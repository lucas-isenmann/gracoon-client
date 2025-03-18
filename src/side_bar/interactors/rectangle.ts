import { Board, Coord, Option, Rectangle } from "gramoloss";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { INTERACTOR_TYPE, RESIZE_TYPE } from "../../interactors/interactor";
import { PreInteractor } from "../pre_interactor";
import { BoardElementType, ClientBoard } from "../../board/board";
import { PointedElementData } from "../../interactors/pointed_element_data";
import { ShapeElement } from "../../board/element";
import { ShapeData } from "../../board/vertex";



let firstCorner : Option<Coord>;
let currentRectangle: Option<ShapeElement> = undefined;


export function setCurrentShape(newShape: ShapeElement){
    if (typeof firstCorner != "undefined"){
        currentRectangle = newShape;
    }
}


export function createRectangleInteractor(board: ClientBoard){

    const rectangle_interactorV2 = new PreInteractor(INTERACTOR_TYPE.RECTANGLE, "Draw rectangle", "", "rectangle", "default", new Set([]));

    
    
    rectangle_interactorV2.mousedown = (( board: ClientBoard, pointed: PointedElementData) => {
        if (typeof pointed.data == "undefined" ) {
            firstCorner = board.camera.create_server_coord(pointed.magnetPos);

            board.emit_add_element(new ShapeData(firstCorner, board.colorSelected), (data) =>{
                console.log("receive", data)

                
            });
            
            // const newIndex = board.get_next_available_index_rectangle();
            // currentRectangle = new ClientRectangle(firstCorner, firstCorner, board.colorSelected, board, newIndex);
            // board.rectangles.set(newIndex, currentRectangle);
        } 
    })
    
    rectangle_interactorV2.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if ( typeof currentRectangle != "undefined" && typeof firstCorner != "undefined") {
            const magnetE = board.graph.align_position(e, new Set(), board.canvas, board.camera);
            currentRectangle.setCorners(board.camera.create_canvas_coord(firstCorner), magnetE);
            board.emit_resize_element(BoardElementType.Rectangle, currentRectangle.serverId, magnetE, RESIZE_TYPE.BOTTOM_RIGHT);
            
            return true;   
        }
        return false;
    })
    
    rectangle_interactorV2.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if ( typeof currentRectangle != "undefined") {
            currentRectangle = undefined;
            firstCorner = undefined;
        }
    })
    
    return rectangle_interactorV2;
}
