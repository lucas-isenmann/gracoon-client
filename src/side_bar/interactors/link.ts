import { ORIENTATION } from "gramoloss";
import { CanvasCoord } from "../../board/canvas_coord";
import { draw_circle, drawLine, draw_head } from "../../draw_basics";
import { DOWN_TYPE } from "../../interactors/interactor";
import { key_states, last_down, last_down_index } from "../../interactors/interactor_manager";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";
import { ClientVertexData } from "../../board/vertex";
import { LinkPreData } from "../../board/link";
import { SideBar } from "../side_bar";
import { getCanvasColor } from "../../colors_v2";
import { ClientBoard } from "../../board/board";



/**
 * Generic Interactor class for creating Edge and Arc interactor.
 * This class has the index of the last created vertex.
 */
class LinkInteractor extends InteractorV2 {
    indexLastCreatedVertex: number | undefined;

    constructor(board: ClientBoard, id:string, info: string, shortcut: string, orientationInfo: ORIENTATION_INFO, iconSrc: string, cursorStyle: string, interactableElementTypes: Set<DOWN_TYPE>, mySideBar?: SideBar, rootSidebar?: SideBar)
    {
        super(board, id, info, shortcut, orientationInfo, iconSrc, cursorStyle, interactableElementTypes, mySideBar, rootSidebar);
        this.indexLastCreatedVertex = undefined;
    }
}

export function createLinkInteractor(board: ClientBoard, orientation: ORIENTATION): InteractorV2{
    const id = orientation == ORIENTATION.UNDIRECTED ? "edge" : "arc";
    const info = orientation == ORIENTATION.UNDIRECTED ? "Create edges" : "Create arcs";
    const shortcutLetter = orientation == ORIENTATION.UNDIRECTED ? "e" : "a";
    const iconSrc = orientation == ORIENTATION.UNDIRECTED ? "edition" : "arc";
    const linkInteractor = new LinkInteractor(board, id, info, shortcutLetter, ORIENTATION_INFO.RIGHT, iconSrc, "default", new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK]));


    linkInteractor.mousedown = ((board: ClientBoard, e) => {
        if (last_down == DOWN_TYPE.EMPTY) {
            const pos = board.graph.align_position(e, new Set(), board.canvas, board.view);
            const server_pos = board.view.create_server_coord(pos);

            if( board.view.is_link_creating){
                board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", board.view, board.colorSelected), (response) => { 
                    board.emit_add_element( new LinkPreData(linkInteractor.indexLastCreatedVertex, response, orientation, "", board.colorSelected), () => {} )
                    if (key_states.get("Control")){
                        board.view.is_link_creating = true;
                        linkInteractor.indexLastCreatedVertex = response;
                        board.view.link_creating_start = pos;
                        board.view.link_creating_type = orientation;
                    } else {
                        board.view.is_link_creating = false;
                    }
                    
                });
            } else {
                board.view.is_link_creating = true;
                board.view.link_creating_start = pos;
                board.view.link_creating_type = orientation;
                board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", board.view, board.colorSelected), (response) => { linkInteractor.indexLastCreatedVertex = response } );
            }
        } 
        else if (last_down == DOWN_TYPE.LINK){
            board.view.is_link_creating = true;
            board.view.link_creating_start = e;
            board.view.link_creating_type = orientation;
            const pos = board.view.create_server_coord(e);
            board.emitSubdivideLink( last_down_index, pos, "", board.colorSelected, (response) => { linkInteractor.indexLastCreatedVertex = response } );
        } 
        else if (last_down === DOWN_TYPE.VERTEX) {
            const vertex = board.graph.vertices.get(last_down_index);
            if( board.view.is_link_creating){
                board.emit_add_element( new LinkPreData(linkInteractor.indexLastCreatedVertex, last_down_index, orientation, "", board.colorSelected), () => {} )
                if (key_states.get("Control")){
                    board.view.is_link_creating = true;
                    linkInteractor.indexLastCreatedVertex = last_down_index;
                    board.view.link_creating_start = vertex.data.canvas_pos;
                    board.view.link_creating_type = orientation;
                } else {
                    board.view.is_link_creating = false;
                }
            } else {
                linkInteractor.indexLastCreatedVertex = last_down_index;
                board.view.is_link_creating = true;
                board.view.link_creating_start = vertex.data.canvas_pos;
                board.view.link_creating_type = orientation;
            }

            
        }
    })

    linkInteractor.mousemove = ((board: ClientBoard, e) => {
        board.view.creating_vertex_pos = board.graph.align_position(e, new Set(), board.canvas, board.view);
        return true;
    })

    linkInteractor.mouseup = ((board: ClientBoard, e) => {
        if (board.view.is_link_creating == false){
            return;
        }
        if ( key_states.get("Control")){
            return;
        }

        const firstVertexIndex = (last_down == DOWN_TYPE.VERTEX) ? last_down_index : linkInteractor.indexLastCreatedVertex;
        

        const vertexIndex = board.graph.get_vertex_index_nearby(board.graph.align_position(e, new Set(), board.canvas, board.view));
        if (vertexIndex != null){
            if ( firstVertexIndex != vertexIndex) { // there is a vertex nearby and it is not the previous one
                board.emit_add_element(new LinkPreData(firstVertexIndex, vertexIndex,  orientation, "", board.colorSelected), (response: number) => {});
            } 
        } else {
            const link = board.graph.nearbyLink(e);
            if (typeof link == "undefined"){
                const aligned_mouse_pos = board.graph.align_position(e, new Set(), board.canvas, board.view);
                const server_pos = aligned_mouse_pos.toCoord(board.view);
                board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", board.view, board.colorSelected), (response) => { 
                    if (key_states.get("Control")){
                        board.view.is_link_creating = true;
                        linkInteractor.indexLastCreatedVertex = response;
                        board.view.link_creating_start = aligned_mouse_pos;
                        board.view.link_creating_type = orientation;
                    }
                    board.emit_add_element( new LinkPreData(firstVertexIndex, response, orientation, "", board.colorSelected), () => {} )
                });
            }
            else {
                board.emitSubdivideLink(link.index, e.toCoord(board.view), "", board.colorSelected, (response) => { 
                    board.emit_add_element( new LinkPreData(firstVertexIndex, response, orientation, "", board.colorSelected), () => {} )
                });
            }
        }

        board.view.is_link_creating = false;
        

    })

    linkInteractor.trigger = (board: ClientBoard, mouse_pos: CanvasCoord) => {
        board.view.is_creating_vertex = true;
        board.view.creating_vertex_pos = mouse_pos;
    }


    linkInteractor.draw = (board: ClientBoard) => {
        if (board.view.is_creating_vertex){
            draw_circle(board.view.creating_vertex_pos, "grey", 10, 0.5, board.ctx);
        }
        if (board.view.is_link_creating) {
            drawLine(board.view.link_creating_start, board.view.creating_vertex_pos, board.ctx, getCanvasColor(board.colorSelected, board.view.dark_mode),4);
            if (board.view.link_creating_type == ORIENTATION.DIRECTED) {
                draw_head(board.ctx, board.view.link_creating_start, board.view.creating_vertex_pos, board.view.index_type);
            }
        }
    }

    return linkInteractor;
}
