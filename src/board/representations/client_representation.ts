import { Representation } from "gramoloss";
import { View } from "../display/camera";
import { CanvasVect } from "../canvasVect";
import { CanvasCoord } from "../canvas_coord";
import { BoardElementType } from "../board";



export interface ClientRepresentation extends Representation {
    canvas_corner_top_left : CanvasCoord;
    canvas_corner_bottom_left : CanvasCoord;
    canvas_corner_bottom_right : CanvasCoord;
    canvas_corner_top_right : CanvasCoord;
    
    draw(ctx: CanvasRenderingContext2D, view: View): void;
    update_after_camera_change(view: View): void;
    click_over(pos: CanvasCoord, view: View): number | string ;
    translate_element_by_canvas_vect(index: number, cshift: CanvasVect, view: View): void;
    onmouseup(view: View): void;
    translate_by_canvas_vect(cshift: CanvasVect, view: View): void;
    getType(): BoardElementType; // return Representation
}
