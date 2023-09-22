import { Coord, Vect } from "gramoloss";
import { ClientBoard } from "./board";
import { CanvasCoord } from "./canvas_coord";
import { CanvasVect } from "./canvasVect";



export class View {
    camera: Coord;
    zoom: number;
   
    

    is_aligning: boolean;
    alignement_horizontal: boolean;
    alignement_horizontal_y: number;
    alignement_vertical: boolean;
    alignement_vertical_x: number;


    constructor() {
        this.camera = new Coord(0, 0);
        this.zoom = 1.;
        
        this.is_aligning = false;
        this.alignement_horizontal = false;
        this.alignement_vertical = false;
    }

   




    // zoom factor is multiply by r
    apply_zoom_to_center(center: CanvasCoord, r: number) {
        this.zoom *= r;
        this.camera.x = center.x + (this.camera.x - center.x) * r;
        this.camera.y = center.y + (this.camera.y - center.y) * r;

        
    }

    translate_camera(shift: CanvasVect){
        this.camera.x += shift.x;
        this.camera.y += shift.y;
    }

    server_vect(v: CanvasVect): Vect{
        return new Vect( v.x/this.zoom, v.y/this.zoom);
    }

    create_canvas_vect(v: Vect): CanvasVect {
        return new CanvasVect(v.x*this.zoom, v.y*this.zoom)
    }

    create_server_coord(c: CanvasCoord){
        return new Coord( (c.x - this.camera.x)/ this.zoom, (c.y - this.camera.y)/ this.zoom);
    }

    create_server_coord_from_subtranslated(c: CanvasCoord, shift: CanvasVect): Coord{
        const c2 = new CanvasCoord(c.x - shift.x, c.y - shift.y);
        return this.create_server_coord(c2);
    }

    create_canvas_coord(c: Coord){
        return new CanvasCoord(c.x*this.zoom + this.camera.x, c.y*this.zoom+this.camera.y);
    }

    canvasCoordX(c: Coord): number{
        return c.x*this.zoom + this.camera.x;
    }

    canvasCoordY(c: Coord): number{
        return c.y*this.zoom + this.camera.y;
    }

}



export function center_canvas_on_rectangle(view: View, top_left:CanvasCoord, bot_right:CanvasCoord, board: ClientBoard){
    const w = bot_right.x - top_left.x;
    const h = bot_right.y - top_left.y;
    const shift_x = (board.canvas.width - w)/2 - top_left.x;
    const shift_y = (board.canvas.height - h)/2 - top_left.y;

    view.translate_camera(new Vect(shift_x, shift_y));

    if ( w <= 0 || h <= 0 ){
        board.update_canvas_pos(view);
        board.updateOtherUsersCanvasPos();
        return;
    }

    const ratio_w = board.canvas.width/w;
    const ratio_h = board.canvas.height/h;

    const center = new CanvasCoord(board.canvas.width/2, board.canvas.height/2);
    view.apply_zoom_to_center(center, Math.min(ratio_h, ratio_w)*0.8);
    
    board.update_after_camera_change();
    board.update_canvas_pos(view);
    board.updateOtherUsersCanvasPos();
}

