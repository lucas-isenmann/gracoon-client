import { Coord, Option } from "gramoloss";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { INTERACTOR_TYPE, RESIZE_TYPE } from "../../interactors/interactor";
import { PreInteractor } from "../pre_interactor";
import { BoardElementType, ClientBoard } from "../../board/board";
import { PointedElementData } from "../../interactors/pointed_element_data";
import { ShapeElement } from "../../board/element";
import { ShapePreData } from "../../board/elements/rectangle";



let firstCorner : Option<Coord>;
let currentRectangle: Option<ShapeElement> = undefined;


export function setCurrentShape(newShape: ShapeElement){
    if (typeof firstCorner != "undefined"){
        currentRectangle = newShape;
    }
}


export function createRectangleInteractor(board: ClientBoard){

    const shapeInteractor = new PreInteractor(INTERACTOR_TYPE.RECTANGLE, "Draw rectangle", "", "rectangle", "default", new Set([]));

    
    
    shapeInteractor.mousedown = (( board: ClientBoard, pointed: PointedElementData) => {
        if (typeof pointed.data == "undefined" ) {
            firstCorner = board.camera.createServerCoord(pointed.magnetPos);

            board.emitAddElement(new ShapePreData(firstCorner, board.colorSelected), (data) =>{
                console.log("receive", data)
            });
            
            // const newIndex = board.get_next_available_index_rectangle();
            // currentRectangle = new ClientRectangle(firstCorner, firstCorner, board.colorSelected, board, newIndex);
            // board.rectangles.set(newIndex, currentRectangle);
        } 
    })
    
    shapeInteractor.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if ( typeof currentRectangle != "undefined" && typeof firstCorner != "undefined") {
            const magnetE = board.alignPosition(e, new Set(), board.canvas, board.camera);
            // currentRectangle.setCorners(board.camera.create_canvas_coord(firstCorner), magnetE);
            if ( firstCorner.x <= magnetE.x && firstCorner.y <= magnetE.y){
                board.emitResizeElement(BoardElementType.Rectangle, currentRectangle.serverId, magnetE, RESIZE_TYPE.BOTTOM_RIGHT);
            } else if ( firstCorner.x <= magnetE.x && firstCorner.y >= magnetE.y){
                board.emitResizeElement(BoardElementType.Rectangle, currentRectangle.serverId, magnetE, RESIZE_TYPE.TOP_RIGHT);
            } else if ( firstCorner.x >= magnetE.x && firstCorner.y <= magnetE.y){
                board.emitResizeElement(BoardElementType.Rectangle, currentRectangle.serverId, magnetE, RESIZE_TYPE.BOTTOM_LEFT);
            } else if ( firstCorner.x >= magnetE.x && firstCorner.y >= magnetE.y){
                board.emitResizeElement(BoardElementType.Rectangle, currentRectangle.serverId, magnetE, RESIZE_TYPE.TOP_LEFT);
            }
            
            return true;   
        }
        return false;
    })
    
    shapeInteractor.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if ( typeof currentRectangle != "undefined") {
            currentRectangle = undefined;
            firstCorner = undefined;
        }
    })
    
    return shapeInteractor;
}
