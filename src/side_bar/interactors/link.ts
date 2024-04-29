import { Coord, Option, ORIENTATION } from "gramoloss";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { drawHead } from "../../board/display/draw_basics";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { PreInteractor } from "../pre_interactor";
import { ClientVertexData } from "../../board/vertex";
import { LinkPreData } from "../../board/link";
import { getCanvasColor } from "../../board/display/colors_v2";
import { ClientBoard, INDEX_TYPE, VERTEX_RADIUS } from "../../board/board";
import { ELEMENT_DATA_LINK, ELEMENT_DATA_VERTEX, PointedElementData } from "../../interactors/pointed_element_data";




/**
 * Generic Interactor class for creating Edge and Arc interactor.
 * This class has the index of the last created vertex.
 */
class LinkInteractor extends PreInteractor {
    indexLastCreatedVertex: number | undefined;
    lastVertexPos: Option<Coord>;


    constructor( id: INTERACTOR_TYPE, info: string, shortcut: string, iconSrc: string, cursorStyle: string, interactableElementTypes: Set<DOWN_TYPE>)
    {
        super(id, info, shortcut, iconSrc, cursorStyle, interactableElementTypes);
        this.indexLastCreatedVertex = undefined;
        this.lastVertexPos = undefined;
    }
}

export function createLinkInteractor(board: ClientBoard, orientation: ORIENTATION): PreInteractor{
    const id = orientation == ORIENTATION.UNDIRECTED ? INTERACTOR_TYPE.EDGE : INTERACTOR_TYPE.ARC;
    const info = orientation == ORIENTATION.UNDIRECTED ? "Create edges" : "Create arcs";
    const shortcutLetter = orientation == ORIENTATION.UNDIRECTED ? "e" : "a";
    const iconSrc = orientation == ORIENTATION.UNDIRECTED ? "edition" : "arc";
    const linkInteractor = new LinkInteractor(id, info, shortcutLetter, iconSrc, "default", new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK]));


    linkInteractor.mousedown = ((board: ClientBoard, pointed: PointedElementData) => {
        board.regenAgregId();
        if ( typeof pointed.data == "undefined" ) {
            const pos = pointed.magnetPos;
            const server_pos = board.camera.create_server_coord(pos);

            if( typeof linkInteractor.indexLastCreatedVertex != "undefined"){
                board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", board.camera, board.colorSelected), (response) => { 
                    if( typeof linkInteractor.indexLastCreatedVertex != "undefined"){
                        board.emit_add_element( new LinkPreData(linkInteractor.indexLastCreatedVertex, response, orientation, "", board.colorSelected), () => {} )
                    }
                    if (board.keyPressed.has("Control")){
                        linkInteractor.indexLastCreatedVertex = response;
                        linkInteractor.lastVertexPos = server_pos;
                    }
                    
                });
            } else {
                board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", board.camera, board.colorSelected), (response) => { 
                    linkInteractor.indexLastCreatedVertex = response;
                    linkInteractor.lastVertexPos = server_pos;
                } );
            }
        } 
        else if ( pointed.data instanceof ELEMENT_DATA_LINK ){
            const pos = board.camera.create_server_coord(pointed.pointedPos);
            board.emitSubdivideLink( pointed.data.element.index, pos, "", board.colorSelected, (response) => { 
                if( typeof linkInteractor.indexLastCreatedVertex != "undefined"){
                    board.emit_add_element( new LinkPreData(linkInteractor.indexLastCreatedVertex, response, orientation, "", board.colorSelected), () => {} )
                }
                linkInteractor.indexLastCreatedVertex = response;
                linkInteractor.lastVertexPos = pos;
             } );
        } 
        else if ( pointed.data instanceof ELEMENT_DATA_VERTEX) {
            const vertex = pointed.data.element;
            if( typeof linkInteractor.indexLastCreatedVertex != "undefined"){
                board.emit_add_element( new LinkPreData(linkInteractor.indexLastCreatedVertex, pointed.data.element.index, orientation, "", board.colorSelected), () => {} )
                if (board.keyPressed.has("Control")){
                    linkInteractor.indexLastCreatedVertex = vertex.index;
                    linkInteractor.lastVertexPos = vertex.data.pos;
                }
            } else {
                linkInteractor.indexLastCreatedVertex = vertex.index;
                linkInteractor.lastVertexPos = vertex.data.pos
            }
        }
    })

    linkInteractor.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        return true;
    })

    linkInteractor.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if (typeof pointed == "undefined") return false;

        if ( typeof linkInteractor.indexLastCreatedVertex == "undefined"){
            return;
        }
        if ( board.keyPressed.has("Control")){
            return;
        }

        const firstVertexIndex = (pointed.data instanceof ELEMENT_DATA_VERTEX) ? pointed.data.element.index : linkInteractor.indexLastCreatedVertex;
        

        const vertexIndex = board.graph.get_vertex_index_nearby(board.graph.align_position(e, new Set(), board.canvas, board.camera));
        if (vertexIndex != null){
            if ( firstVertexIndex != vertexIndex) { // there is a vertex nearby and it is not the previous one
                board.emit_add_element(new LinkPreData(firstVertexIndex, vertexIndex,  orientation, "", board.colorSelected), (response: number) => {});
            } 
        } else {
            const link = board.graph.nearbyLink(e);
            if (typeof link == "undefined"){
                const aligned_mouse_pos = board.graph.align_position(e, new Set(), board.canvas, board.camera);
                const server_pos = aligned_mouse_pos.toCoord(board.camera);
                board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", board.camera, board.colorSelected), (response) => { 
                    if (board.keyPressed.has("Control")){
                        linkInteractor.indexLastCreatedVertex = response;
                        linkInteractor.lastVertexPos = aligned_mouse_pos;
                    }
                    board.emit_add_element( new LinkPreData(firstVertexIndex, response, orientation, "", board.colorSelected), () => {} )
                });
            }
            else {
                board.emitSubdivideLink(link.index, e.toCoord(board.camera), "", board.colorSelected, (response) => { 
                    board.emit_add_element( new LinkPreData(firstVertexIndex, response, orientation, "", board.colorSelected), () => {} )
                });
            }
        }

        linkInteractor.indexLastCreatedVertex = undefined;
        linkInteractor.lastVertexPos = undefined;

    })

    linkInteractor.trigger = (board: ClientBoard, mousePos: Option<CanvasCoord>) => {
    }


    linkInteractor.draw = (board: ClientBoard) => {

        if (typeof board.selfUser.canvasPos != "undefined"){
            const color = getCanvasColor(board.colorSelected, board.isDarkMode());
            const p1 = board.selfUser.canvasPos;
            const pos = board.graph.align_position(p1, new Set(), board.canvas, board.camera);
            board.drawCanvasCircle( pos, 10, color, 0.5);
            if ( typeof linkInteractor.indexLastCreatedVertex != "undefined" && typeof linkInteractor.lastVertexPos != "undefined" ) {
                board.drawLineUnscaled(linkInteractor.lastVertexPos, pos.toCoord(board.camera), color ,4);
                if ( orientation == ORIENTATION.DIRECTED) {
                    drawHead(board.ctx, board.camera.create_canvas_coord(linkInteractor.lastVertexPos), pos, (board.getIndexType() != INDEX_TYPE.NONE) ? 2*VERTEX_RADIUS : VERTEX_RADIUS);
                }
            }
        }
        
    }

    return linkInteractor;
}
