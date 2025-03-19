import { Coord, Vect } from "gramoloss";
import { CanvasCoord } from "./canvas_coord";
import { CanvasVect } from "./canvasVect";


export class Camera {
    camera: Coord;
    zoom: number;

    constructor() {
        this.camera = new Coord(0, 0);
        this.zoom = 1.;
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

    createServerCoord(c: CanvasCoord){
        return new Coord( (c.x - this.camera.x)/ this.zoom, (c.y - this.camera.y)/ this.zoom);
    }

    create_server_coord_from_subtranslated(c: CanvasCoord, shift: CanvasVect): Coord{
        const c2 = new CanvasCoord(c.x - shift.x, c.y - shift.y);
        return this.createServerCoord(c2);
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


    centerOnRectangle(c1: CanvasCoord, c2: CanvasCoord, canvas: HTMLCanvasElement){
        const w = Math.abs(c1.x - c2.x);
        const h = Math.abs(c1.y - c2.y);
        const shift_x = (canvas.width - w)/2 - Math.min(c1.x, c2.x);
        const shift_y = (canvas.height - h)/2 - Math.min(c1.y, c2.y);

        this.translate_camera(new Vect(shift_x, shift_y));

        const ratio_w = canvas.width/w;
        const ratio_h = canvas.height/h;
        const center = new CanvasCoord(canvas.width/2, canvas.height/2);
        this.apply_zoom_to_center(center, Math.min(ratio_h, ratio_w)*0.8);
    }
}



