import { Coord, Option, ORIENTATION } from "gramoloss";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { PreInteractor } from "../pre_interactor";
import { Color, getCanvasColor } from "../../board/display/colors_v2";
import { BoardElementType, ClientBoard } from "../../board/board";
import { ELEMENT_DATA_LINK, ELEMENT_DATA_VERTEX, PointedElementData } from "../../interactors/pointed_element_data";
import { BoardVertex } from "../../board/elements/vertex";
import { LocalPoint } from "../../board/elements/localPoint";
import { LocalSegment } from "../../board/elements/segment";




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
    const targetPoint = new LocalPoint(board, new CanvasCoord(0,0, board.camera));
    targetPoint.hide();
    targetPoint.setColor(Color.Red);
    const constructionSegment = new LocalSegment(board, new CanvasCoord(0,0, board.camera), new CanvasCoord(0,0, board.camera), Color.Neutral);
    constructionSegment.hide();


    // Mouse down
    linkInteractor.mousedown = ((board: ClientBoard, pointed: PointedElementData) => {
        console.log("mouse down ", pointed.pointedPos);
        console.log("camera", board.camera.camera);
        
        board.regenAgregId();
        if ( typeof pointed.data == "undefined" ) {
            const pos = pointed.magnetPos;
            const server_pos = board.camera.createServerCoord(pos);
            console.log("pos", pos)
            console.log("serverPos", server_pos)

            if( typeof linkInteractor.indexLastCreatedVertex != "undefined"){
                board.emitAddElement(board.createVertexPreData(server_pos), (response) => { 
                    constructionSegment.show();
                    constructionSegment.setStartPoint(pointed.magnetPos);
                    constructionSegment.setEndPoint(pointed.magnetPos);

                    if( typeof linkInteractor.indexLastCreatedVertex != "undefined"){
                        board.emitAddElement( board.createLinkPreData(linkInteractor.indexLastCreatedVertex, response, orientation)
                        , () => {} )
                    }
                    if (board.keyPressed.has("Control")){
                        linkInteractor.indexLastCreatedVertex = response;
                        linkInteractor.lastVertexPos = server_pos;
                    }
                    
                });
            } else {

                board.emitAddElement(board.createVertexPreData(server_pos), (response) => { 
                    constructionSegment.show();
                    constructionSegment.setStartPoint(pointed.magnetPos);
                    constructionSegment.setEndPoint(pointed.magnetPos);
                    linkInteractor.indexLastCreatedVertex = response;
                    linkInteractor.lastVertexPos = server_pos;
                } );
            }
        } 
        else if ( pointed.data instanceof ELEMENT_DATA_LINK ){
            const pos = board.camera.createServerCoord(pointed.pointedPos);
            board.emitSubdivideLink( pointed.data.element.serverId, pos, "", board.colorSelected, (response) => { 
                if( typeof linkInteractor.indexLastCreatedVertex != "undefined"){
                    board.emitAddElement( board.createLinkPreData(linkInteractor.indexLastCreatedVertex, response, orientation), () => {} )
                }
                linkInteractor.indexLastCreatedVertex = response;
                linkInteractor.lastVertexPos = pos;
             } );
        } 
        else if ( pointed.data instanceof ELEMENT_DATA_VERTEX) {
            const vertex = pointed.data.element;
            constructionSegment.show()
            constructionSegment.setStartPoint(vertex.cameraCenter);
            constructionSegment.setEndPoint(vertex.cameraCenter);
            if( typeof linkInteractor.indexLastCreatedVertex != "undefined"){
                board.emitAddElement( board.createLinkPreData(linkInteractor.indexLastCreatedVertex, pointed.data.element.serverId, orientation), () => {} )
                if (board.keyPressed.has("Control")){
                    linkInteractor.indexLastCreatedVertex = vertex.serverId;
                    linkInteractor.lastVertexPos = vertex.cameraCenter.serverPos;
                }
            } else {
                linkInteractor.indexLastCreatedVertex = vertex.serverId;
                linkInteractor.lastVertexPos = vertex.cameraCenter.serverPos;
            }
        }
    })


    // Mouse move
    linkInteractor.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        const p = board.alignPosition(e, new Set());
        targetPoint.setCanvasPos(p);
        constructionSegment.setEndPoint(p);
        return false;
    })

    // Mouse up
    linkInteractor.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        console.log("mouseup")


        // if (typeof pointed == "undefined") return false;

        if ( typeof linkInteractor.indexLastCreatedVertex == "undefined"){
            return;
        }
        if ( board.keyPressed.has("Control")){
            return;
        }
        constructionSegment.hide();

        const firstVertexIndex = (typeof pointed != "undefined" && pointed.data instanceof ELEMENT_DATA_VERTEX) ? pointed.data.element.serverId : linkInteractor.indexLastCreatedVertex;
        

        const selectedVertex = board.getSpecificElementNearby(board.alignPosition(e, new Set()), BoardElementType.Vertex, 15);
        console.log(selectedVertex);
        if (selectedVertex instanceof BoardVertex){
            if ( firstVertexIndex != selectedVertex.serverId) { // there is a vertex nearby and it is not the previous one
                board.emitAddElement(
                    board.createLinkPreData(firstVertexIndex, selectedVertex.serverId, orientation)
                    , (response: number) => {});
            } 
        } else {
            const link = board.nearbyLink(e);
            if (typeof link == "undefined"){
                const aligned_mouse_pos = board.alignPosition(e, new Set());
                const serverPos = aligned_mouse_pos.toCoord();
                board.emitAddElement(
                    board.createVertexPreData(serverPos), (response) => { 
                    
                    if (board.keyPressed.has("Control")){
                        linkInteractor.indexLastCreatedVertex = response;
                        linkInteractor.lastVertexPos = aligned_mouse_pos.serverPos;
                    }
                    board.emitAddElement(
                        board.createLinkPreData(firstVertexIndex, response, orientation)
                         , () => {} )
                });
            }
            else {
                board.emitSubdivideLink(link.serverId, e.toCoord(), "", board.colorSelected, (response) => { 
                    board.emitAddElement( board.createLinkPreData(firstVertexIndex, response, orientation), () => {} )
                });
            }
        }

        linkInteractor.indexLastCreatedVertex = undefined;
        linkInteractor.lastVertexPos = undefined;

    })

    // Trigger
    linkInteractor.trigger = (board: ClientBoard, mousePos: Option<CanvasCoord>) => {
        targetPoint.show();
    }

    linkInteractor.onleave = () => {
        constructionSegment.hide();
        targetPoint.hide();
    }

    // Canvas Draw
    linkInteractor.draw = (board: ClientBoard) => {
    }

    return linkInteractor;
}
