import { Coord, is_segments_intersection, linesIntersection, Rectangle } from "gramoloss";
import { Camera } from "./display/camera";
import { CanvasVect } from "./display/canvasVect";
import { CanvasCoord } from "./display/canvas_coord";
import { Color, getCanvasColor } from "./display/colors_v2";
import { BoardElementType, ClientBoard } from "./board";

export class ClientRectangle extends Rectangle {
    color: Color;
    canvas_corner_top_left : CanvasCoord;
    canvas_corner_bottom_left : CanvasCoord;
    canvas_corner_bottom_right : CanvasCoord;
    canvas_corner_top_right : CanvasCoord;
    board: ClientBoard;
    isSelected: boolean;


    constructor(c1: Coord, c2: Coord, color: Color, board: ClientBoard, index: number){
        super(c1, c2, color, index);
        this.color = color;
        this.board = board;
        this.canvas_corner_top_left = CanvasCoord.fromCoord(this.top_left_corner(), board.camera); 
        this.canvas_corner_bottom_left = CanvasCoord.fromCoord(this.bot_left_corner(), board.camera);
        this.canvas_corner_bottom_right = CanvasCoord.fromCoord(this.bot_right_corner(), board.camera);
        this.canvas_corner_top_right = CanvasCoord.fromCoord(this.top_right_corner(), board.camera);
        this.isSelected = false;
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

        if (this.isSelected){
            this.board.ctx.beginPath();
            this.board.ctx.strokeStyle = getCanvasColor(this.color, this.board.isDarkMode());
            this.board.ctx.lineWidth = 5;
            const c1canvas = this.canvas_corner_top_left;
            const c2canvas = this.canvas_corner_bottom_right;
            this.board.ctx.rect(c1canvas.x , c1canvas.y, c2canvas.x - c1canvas.x, c2canvas.y - c1canvas.y);
            this.board.ctx.stroke();
        }
    }
    


    resize_corner_area(c1:CanvasCoord, c2:CanvasCoord, camera: Camera){
        this.canvas_corner_top_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_top_right.y = Math.min(c1.y, c2.y);
        this.canvas_corner_top_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_top_left.y = Math.min(c1.y, c2.y);
        this.canvas_corner_bottom_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_bottom_right.y = Math.max(c1.y, c2.y);
        this.canvas_corner_bottom_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_bottom_left.y = Math.max(c1.y, c2.y);
    }

    update_after_camera_change(camera: Camera){
        this.canvas_corner_top_left = camera.create_canvas_coord(this.top_left_corner());
        this.canvas_corner_bottom_left = camera.create_canvas_coord(this.bot_left_corner());
        this.canvas_corner_bottom_right = camera.create_canvas_coord(this.bot_right_corner());
        this.canvas_corner_top_right = camera.create_canvas_coord(this.top_right_corner());
    }
    
    translate_by_canvas_vect(cshift: CanvasVect, camera: Camera){
    }

    getType(): BoardElementType{
        return BoardElementType.Rectangle;
    }

    isInRect(c1: CanvasCoord, c2: CanvasCoord){
        const topLeft = new Coord(Math.min(c1.x, c2.x), Math.min(c1.y, c2.y));
        const topRight = new Coord(Math.max(c1.x, c2.x), Math.min(c1.y, c2.y));
        const bottomLeft = new Coord(Math.min(c1.x, c2.x), Math.max(c1.y, c2.y));
        const bottomRight = new Coord(Math.max(c1.x, c2.x), Math.max(c1.y, c2.y));
        if (topLeft.is_in_rect(this.canvas_corner_top_left, this.canvas_corner_bottom_right) || topRight.is_in_rect(this.canvas_corner_top_left, this.canvas_corner_bottom_right) || bottomLeft.is_in_rect(this.canvas_corner_top_left, this.canvas_corner_bottom_right) || bottomRight.is_in_rect(this.canvas_corner_top_left, this.canvas_corner_bottom_right)){
            return true;
        }

        if (this.canvas_corner_bottom_left.is_in_rect(c1,c2)
        || this.canvas_corner_bottom_right.is_in_rect(c1,c2)
        || this.canvas_corner_top_left.is_in_rect(c1,c2)
        || this.canvas_corner_top_right.is_in_rect(c1,c2) ){
            return true;
        }

        if (is_segments_intersection(this.canvas_corner_top_left, this.canvas_corner_top_right, topLeft, bottomLeft)
        || is_segments_intersection(this.canvas_corner_top_left, this.canvas_corner_top_right, topRight, bottomRight)
        || is_segments_intersection(this.canvas_corner_bottom_left, this.canvas_corner_bottom_right, topLeft, bottomLeft)
        || is_segments_intersection(this.canvas_corner_bottom_left, this.canvas_corner_bottom_right, topRight, bottomRight)){
            return true;
        }

        if (is_segments_intersection(this.canvas_corner_top_left, this.canvas_corner_bottom_left, topLeft, topRight)
        || is_segments_intersection(this.canvas_corner_top_left, this.canvas_corner_bottom_left, bottomLeft, bottomRight)
        || is_segments_intersection(this.canvas_corner_bottom_right, this.canvas_corner_top_right, topLeft, topRight)
        || is_segments_intersection(this.canvas_corner_bottom_right, this.canvas_corner_top_right, bottomLeft, bottomRight)){
            return true;
        }



        return false;
    }
}