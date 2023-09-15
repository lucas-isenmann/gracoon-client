import { Coord, Option } from "gramoloss";
import { ClientGraph } from "../../board/graph";
import { ClientRectangle } from "../../board/rectangle";
import { CanvasCoord } from "../../board/canvas_coord";
import { DOWN_TYPE } from "../../interactors/interactor";
import { last_down } from "../../interactors/interactor_manager";
import { local_board } from "../../setup";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";
import { color_selected } from "./color";


export const rectangle_interactorV2 = new InteractorV2("rectangle", "Draw rectangle", "", ORIENTATION_INFO.RIGHT, "rectangle", "default", new Set([]));

let firstCorner : Option<Coord>;
let currentRectangle: Option<ClientRectangle> = undefined;


rectangle_interactorV2.mousedown = (( canvas, ctx, g: ClientGraph, e: CanvasCoord) => {
    if (last_down === DOWN_TYPE.EMPTY) {
        firstCorner = local_board.view.create_server_coord(e);
        const newIndex = local_board.get_next_available_index_rectangle();
        currentRectangle = new ClientRectangle(firstCorner, firstCorner, color_selected, local_board);
        local_board.rectangles.set(newIndex, currentRectangle);
    } 
})

rectangle_interactorV2.mousemove = ((canvas, ctx, g: ClientGraph, e: CanvasCoord) => {
    if ( typeof currentRectangle != "undefined" && typeof firstCorner != "undefined") {
        currentRectangle.resize_corner_area(local_board.view.create_canvas_coord(firstCorner), e, local_board.view);
        return true;   
    }
    return false;
})

rectangle_interactorV2.mouseup = ((canvas, ctx, g: ClientGraph, e: CanvasCoord) => {
    if ( typeof currentRectangle != "undefined") {
        
        currentRectangle.c1 = local_board.view.create_server_coord(currentRectangle.canvas_corner_top_left); 
        currentRectangle.c2 = local_board.view.create_server_coord(currentRectangle.canvas_corner_bottom_right); 
        currentRectangle = undefined;
        firstCorner = undefined;

        //TODO: emit server
    }
})


