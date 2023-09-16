import { Coord, Option } from "gramoloss";
import { ClientRectangle } from "../../board/rectangle";
import { CanvasCoord } from "../../board/canvas_coord";
import { DOWN_TYPE } from "../../interactors/interactor";
import { last_down } from "../../interactors/interactor_manager";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";
import { ClientBoard } from "../../board/board";


export function createRectangleInteractor(board: ClientBoard){

    const rectangle_interactorV2 = new InteractorV2(board, "rectangle", "Draw rectangle", "", ORIENTATION_INFO.RIGHT, "rectangle", "default", new Set([]));

    let firstCorner : Option<Coord>;
    let currentRectangle: Option<ClientRectangle> = undefined;
    
    
    rectangle_interactorV2.mousedown = (( board: ClientBoard, e: CanvasCoord) => {
        if (last_down === DOWN_TYPE.EMPTY) {
            firstCorner = board.view.create_server_coord(e);
            const newIndex = board.get_next_available_index_rectangle();
            currentRectangle = new ClientRectangle(firstCorner, firstCorner, board.colorSelected, board);
            board.rectangles.set(newIndex, currentRectangle);
        } 
    })
    
    rectangle_interactorV2.mousemove = ((board: ClientBoard, e: CanvasCoord) => {
        if ( typeof currentRectangle != "undefined" && typeof firstCorner != "undefined") {
            currentRectangle.resize_corner_area(board.view.create_canvas_coord(firstCorner), e, board.view);
            return true;   
        }
        return false;
    })
    
    rectangle_interactorV2.mouseup = ((board: ClientBoard, e: CanvasCoord) => {
        if ( typeof currentRectangle != "undefined") {
            
            currentRectangle.c1 = board.view.create_server_coord(currentRectangle.canvas_corner_top_left); 
            currentRectangle.c2 = board.view.create_server_coord(currentRectangle.canvas_corner_bottom_right); 
            currentRectangle = undefined;
            firstCorner = undefined;
    
            //TODO: emit server
        }
    })
    
    return rectangle_interactorV2;
    
}
