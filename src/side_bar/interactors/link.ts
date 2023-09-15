import { ORIENTATION } from "gramoloss";
import { ClientGraph } from "../../board/graph";
import { CanvasCoord } from "../../board/canvas_coord";
import { draw_circle, drawLine, draw_head } from "../../draw_basics";
import { DOWN_TYPE } from "../../interactors/interactor";
import { key_states, last_down, last_down_index } from "../../interactors/interactor_manager";
import { local_board } from "../../setup";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";
import { ClientVertexData } from "../../board/vertex";
import { LinkPreData } from "../../board/link";
import { SideBar } from "../side_bar";
import { color_selected } from "./color";
import { Color, getCanvasColor } from "../../colors_v2";



/**
 * Generic Interactor class for creating Edge and Arc interactor.
 * This class has the index of the last created vertex.
 */
class LinkInteractor extends InteractorV2 {
    indexLastCreatedVertex: number | undefined;

    constructor(id:string, info: string, shortcut: string, orientationInfo: ORIENTATION_INFO, iconSrc: string, cursorStyle: string, interactableElementTypes: Set<DOWN_TYPE>, mySideBar?: SideBar, rootSidebar?: SideBar)
    {
        super(id, info, shortcut, orientationInfo, iconSrc, cursorStyle, interactableElementTypes, mySideBar, rootSidebar);
        this.indexLastCreatedVertex = undefined;
    }
}

export function createLinkInteractor(orientation: ORIENTATION): InteractorV2{
    const id = orientation == ORIENTATION.UNDIRECTED ? "edge" : "arc";
    const info = orientation == ORIENTATION.UNDIRECTED ? "Create edges" : "Create arcs";
    const shortcutLetter = orientation == ORIENTATION.UNDIRECTED ? "e" : "a";
    const iconSrc = orientation == ORIENTATION.UNDIRECTED ? "edition" : "arc";
    const linkInteractor = new LinkInteractor(id, info, shortcutLetter, ORIENTATION_INFO.RIGHT, iconSrc, "default", new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK]));


    linkInteractor.mousedown = ((canvas, ctx, g: ClientGraph, e) => {
        if (last_down == DOWN_TYPE.EMPTY) {
            const pos = g.align_position(e, new Set(), canvas, local_board.view);
            const server_pos = local_board.view.create_server_coord(pos);

            if( local_board.view.is_link_creating){
                local_board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", local_board.view, color_selected), (response) => { 
                    local_board.emit_add_element( new LinkPreData(linkInteractor.indexLastCreatedVertex, response, orientation, "", color_selected), () => {} )
                    if (key_states.get("Control")){
                        local_board.view.is_link_creating = true;
                        linkInteractor.indexLastCreatedVertex = response;
                        local_board.view.link_creating_start = pos;
                        local_board.view.link_creating_type = orientation;
                    } else {
                        local_board.view.is_link_creating = false;
                    }
                    
                });
            } else {
                local_board.view.is_link_creating = true;
                local_board.view.link_creating_start = pos;
                local_board.view.link_creating_type = orientation;
                local_board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", local_board.view, color_selected), (response) => { linkInteractor.indexLastCreatedVertex = response } );
            }
        } 
        else if (last_down == DOWN_TYPE.LINK){
            local_board.view.is_link_creating = true;
            local_board.view.link_creating_start = e;
            local_board.view.link_creating_type = orientation;
            const pos = local_board.view.create_server_coord(e);
            local_board.emitSubdivideLink( last_down_index, pos, (response) => { linkInteractor.indexLastCreatedVertex = response } );
        } 
        else if (last_down === DOWN_TYPE.VERTEX) {
            const vertex = g.vertices.get(last_down_index);
            if( local_board.view.is_link_creating){
                local_board.emit_add_element( new LinkPreData(linkInteractor.indexLastCreatedVertex, last_down_index, orientation, "", color_selected), () => {} )
                if (key_states.get("Control")){
                    local_board.view.is_link_creating = true;
                    linkInteractor.indexLastCreatedVertex = last_down_index;
                    local_board.view.link_creating_start = vertex.data.canvas_pos;
                    local_board.view.link_creating_type = orientation;
                } else {
                    local_board.view.is_link_creating = false;
                }
            } else {
                linkInteractor.indexLastCreatedVertex = last_down_index;
                local_board.view.is_link_creating = true;
                local_board.view.link_creating_start = vertex.data.canvas_pos;
                local_board.view.link_creating_type = orientation;
            }

            
        }
    })

    linkInteractor.mousemove = ((canvas, ctx, g: ClientGraph, e) => {
        local_board.view.creating_vertex_pos = g.align_position(e, new Set(), canvas, local_board.view);
        return true;
    })

    linkInteractor.mouseup = ((canvas, ctx, g: ClientGraph, e) => {
        if (local_board.view.is_link_creating == false){
            return;
        }
        if ( key_states.get("Control")){
            return;
        }

        const firstVertexIndex = (last_down == DOWN_TYPE.VERTEX) ? last_down_index : linkInteractor.indexLastCreatedVertex;
        

        const vertexIndex = g.get_vertex_index_nearby(g.align_position(e, new Set(), canvas, local_board.view));
        if (vertexIndex != null){
            if ( firstVertexIndex != vertexIndex) { // there is a vertex nearby and it is not the previous one
                local_board.emit_add_element(new LinkPreData(firstVertexIndex, vertexIndex,  orientation, "", color_selected), (response: number) => {});
            } 
        } else {
            const link = g.nearbyLink(e);
            if (typeof link == "undefined"){
                const aligned_mouse_pos = g.align_position(e, new Set(), canvas, local_board.view);
                const server_pos = aligned_mouse_pos.toCoord(local_board.view);
                local_board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", local_board.view, color_selected), (response) => { 
                    if (key_states.get("Control")){
                        local_board.view.is_link_creating = true;
                        linkInteractor.indexLastCreatedVertex = response;
                        local_board.view.link_creating_start = aligned_mouse_pos;
                        local_board.view.link_creating_type = orientation;
                    }
                    local_board.emit_add_element( new LinkPreData(firstVertexIndex, response, orientation, "", color_selected), () => {} )
                });
            }
            else {
                local_board.emitSubdivideLink(link.index, e.toCoord(local_board.view), (response) => { 
                    local_board.emit_add_element( new LinkPreData(firstVertexIndex, response, orientation, "", color_selected), () => {} )
                });
            }
        }

        local_board.view.is_link_creating = false;
        

    })

    linkInteractor.trigger = (mouse_pos: CanvasCoord) => {
        local_board.view.is_creating_vertex = true;
        local_board.view.creating_vertex_pos = mouse_pos;
    }


    linkInteractor.draw = (ctx: CanvasRenderingContext2D) => {
        if (local_board.view.is_creating_vertex){
            draw_circle(local_board.view.creating_vertex_pos, "grey", 10, 0.5, ctx);
        }
        if (local_board.view.is_link_creating) {
            drawLine(local_board.view.link_creating_start, local_board.view.creating_vertex_pos, ctx, getCanvasColor(color_selected, local_board.view.dark_mode),4);
            if (local_board.view.link_creating_type == ORIENTATION.DIRECTED) {
                draw_head(ctx, local_board.view.link_creating_start, local_board.view.creating_vertex_pos);
            }
        }
    }

    return linkInteractor;
}
