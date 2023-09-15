import { Coord, Rectangle } from "gramoloss";
import { View } from "./camera";
import { CanvasVect } from "./vect";
import { CanvasCoord } from "./canvas_coord";
import { Color, getCanvasColor } from "../colors_v2";
import { ClientBoard } from "./board";

export class ClientRectangle extends Rectangle {
    color: Color;
    canvas_corner_top_left : CanvasCoord;
    canvas_corner_bottom_left : CanvasCoord;
    canvas_corner_bottom_right : CanvasCoord;
    canvas_corner_top_right : CanvasCoord;
    board: ClientBoard;


    constructor(c1: Coord, c2: Coord, color: Color, board: ClientBoard){
        super(c1, c2, color);
        this.color = color;
        this.board = board;
        this.canvas_corner_top_left = CanvasCoord.fromCoord(this.top_left_corner(), board.view); 
        this.canvas_corner_bottom_left = CanvasCoord.fromCoord(this.bot_left_corner(), board.view);
        this.canvas_corner_bottom_right = CanvasCoord.fromCoord(this.bot_right_corner(), board.view);
        this.canvas_corner_top_right = CanvasCoord.fromCoord(this.top_right_corner(), board.view);
    }


    draw(ctx: CanvasRenderingContext2D, view: View){
        // draw border
        ctx.beginPath();
        ctx.strokeStyle = getCanvasColor(this.color, view.dark_mode);
        ctx.lineWidth = 2;
        const c1canvas = this.canvas_corner_top_left;
        const c2canvas = this.canvas_corner_bottom_right;
        ctx.rect(c1canvas.x , c1canvas.y, c2canvas.x - c1canvas.x, c2canvas.y - c1canvas.y);
        ctx.stroke();

        // draw rect fill
        ctx.globalAlpha = 0.07;
        if (this.board.elementOver === this){
            ctx.globalAlpha = 0.2;
        }
        ctx.fillStyle = getCanvasColor(this.color, view.dark_mode);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    


    resize_corner_area(c1:CanvasCoord, c2:CanvasCoord, view: View){
        this.canvas_corner_top_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_top_right.y = Math.min(c1.y, c2.y);
        this.canvas_corner_top_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_top_left.y = Math.min(c1.y, c2.y);
        this.canvas_corner_bottom_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_bottom_right.y = Math.max(c1.y, c2.y);
        this.canvas_corner_bottom_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_bottom_left.y = Math.max(c1.y, c2.y);
    }

    update_after_camera_change(view: View){
        this.canvas_corner_top_left = view.create_canvas_coord(this.top_left_corner());
        this.canvas_corner_bottom_left = view.create_canvas_coord(this.bot_left_corner());
        this.canvas_corner_bottom_right = view.create_canvas_coord(this.bot_right_corner());
        this.canvas_corner_top_right = view.create_canvas_coord(this.top_right_corner());
    }
    
    translate_by_canvas_vect(cshift: CanvasVect, view: View){
    }
}