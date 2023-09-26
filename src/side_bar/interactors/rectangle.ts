import { Coord, Option } from "gramoloss";
import { ClientRectangle } from "../../board/rectangle";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { INTERACTOR_TYPE } from "../../interactors/interactor";
import { PreInteractor } from "../pre_interactor";
import { ClientBoard } from "../../board/board";
import { PointedElementData } from "../../interactors/pointed_element_data";


export function createRectangleInteractor(board: ClientBoard){

    const rectangle_interactorV2 = new PreInteractor(INTERACTOR_TYPE.RECTANGLE, "Draw rectangle", "", "rectangle", "default", new Set([]));

    let firstCorner : Option<Coord>;
    let currentRectangle: Option<ClientRectangle> = undefined;
    
    
    rectangle_interactorV2.mousedown = (( board: ClientBoard, pointed: PointedElementData) => {
        if (typeof pointed.data == "undefined" ) {
            firstCorner = board.camera.create_server_coord(pointed.pointedPos);
            const newIndex = board.get_next_available_index_rectangle();
            currentRectangle = new ClientRectangle(firstCorner, firstCorner, board.colorSelected, board, newIndex);
            board.rectangles.set(newIndex, currentRectangle);
        } 
    })
    
    rectangle_interactorV2.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if ( typeof currentRectangle != "undefined" && typeof firstCorner != "undefined") {
            currentRectangle.resize_corner_area(board.camera.create_canvas_coord(firstCorner), e, board.camera);
            return true;   
        }
        return false;
    })
    
    rectangle_interactorV2.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if ( typeof currentRectangle != "undefined") {
            
            currentRectangle.c1 = board.camera.create_server_coord(currentRectangle.canvas_corner_top_left); 
            currentRectangle.c2 = board.camera.create_server_coord(currentRectangle.canvas_corner_bottom_right); 
            currentRectangle = undefined;
            firstCorner = undefined;
    
            //TODO: emit server
        }
    })
    
    return rectangle_interactorV2;
    
}
