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
       
    }
    


    resize_corner_area(c1:CanvasCoord, c2:CanvasCoord, camera: Camera){
       
    }

    update_after_camera_change(camera: Camera){
      
    }
    
    translate_by_canvas_vect(cshift: CanvasVect, camera: Camera){
    }

    getType(): BoardElementType{
        return BoardElementType.Rectangle;
    }

    isInRect(c1: CanvasCoord, c2: CanvasCoord){
        


        return false;
    }
}