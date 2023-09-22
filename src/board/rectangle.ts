import { Coord, Rectangle } from "gramoloss";
import { View } from "./display/camera";
import { CanvasVect } from "./display/canvasVect";
import { CanvasCoord } from "./display/canvas_coord";
import { Color, getCanvasColor } from "../colors_v2";
import { BoardElementType, ClientBoard } from "./board";

export class ClientRectangle extends Rectangle {
    color: Color;
    canvas_corner_top_left : CanvasCoord;
    canvas_corner_bottom_left : CanvasCoord;
    canvas_corner_bottom_right : CanvasCoord;
    canvas_corner_top_right : CanvasCoord;
    board: ClientBoard;


    constructor(c1: Coord, c2: Coord, color: Color, board: ClientBoard, index: number){
        super(c1, c2, color, index);
        this.color = color;
        this.board = board;
        this.canvas_corner_top_left = CanvasCoord.fromCoord(this.top_left_corner(), board.camera); 
        this.canvas_corner_bottom_left = CanvasCoord.fromCoord(this.bot_left_corner(), board.camera);
        this.canvas_corner_bottom_right = CanvasCoord.fromCoord(this.bot_right_corner(), board.camera);
        this.canvas_corner_top_right = CanvasCoord.fromCoord(this.top_right_corner(), board.camera);
    }


    draw(){
        // draw border
        this.board.ctx.beginPath();
        this.board.ctx.strokeStyle = getCanvasColor(this.color, this.board.isDarkMode());
        this.board.ctx.lineWidth = 2;
        const c1canvas = this.canvas_corner_top_left;
        const c2canvas = this.canvas_corner_bottom_right;
        this.board.ctx.rect(c1canvas.x , c1canvas.y, c2canvas.x - c1canvas.x, c2canvas.y - c1canvas.y);
        this.board.ctx.stroke();

        // draw rect fill
        this.board.ctx.globalAlpha = 0.07;
        if (this.board.elementOver === this){
            this.board.ctx.globalAlpha = 0.2;
        }
        this.board.ctx.fillStyle = getCanvasColor(this.color, this.board.isDarkMode());
        this.board.ctx.fill();
        this.board.ctx.globalAlpha = 1;
    }
    


    resize_corner_area(c1:CanvasCoord, c2:CanvasCoord, camera: View){
        this.canvas_corner_top_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_top_right.y = Math.min(c1.y, c2.y);
        this.canvas_corner_top_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_top_left.y = Math.min(c1.y, c2.y);
        this.canvas_corner_bottom_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_bottom_right.y = Math.max(c1.y, c2.y);
        this.canvas_corner_bottom_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_bottom_left.y = Math.max(c1.y, c2.y);
    }

    update_after_camera_change(camera: View){
        this.canvas_corner_top_left = camera.create_canvas_coord(this.top_left_corner());
        this.canvas_corner_bottom_left = camera.create_canvas_coord(this.bot_left_corner());
        this.canvas_corner_bottom_right = camera.create_canvas_coord(this.bot_right_corner());
        this.canvas_corner_top_right = camera.create_canvas_coord(this.top_right_corner());
    }
    
    translate_by_canvas_vect(cshift: CanvasVect, camera: View){
    }

    getType(): BoardElementType{
        return BoardElementType.Rectangle;
    }
}