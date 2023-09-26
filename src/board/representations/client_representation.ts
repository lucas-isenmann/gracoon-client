import { Representation } from "gramoloss";
import { Camera } from "../display/camera";
import { CanvasVect } from "../display/canvasVect";
import { CanvasCoord } from "../display/canvas_coord";
import { BoardElementType } from "../board";



export interface ClientRepresentation extends Representation {
    canvas_corner_top_left : CanvasCoord;
    canvas_corner_bottom_left : CanvasCoord;
    canvas_corner_bottom_right : CanvasCoord;
    canvas_corner_top_right : CanvasCoord;
    
    draw(ctx: CanvasRenderingContext2D, camera: Camera): void;
    update_after_camera_change(camera: Camera): void;
    click_over(pos: CanvasCoord, camera: Camera): number | string ;
    translate_element_by_canvas_vect(index: number, cshift: CanvasVect, camera: Camera): void;
    onmouseup(camera: Camera): void;
    translate_by_canvas_vect(cshift: CanvasVect, camera: Camera): void;
    getType(): BoardElementType; // return Representation
}
