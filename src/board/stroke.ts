import { View } from "./display/camera";
import { Coord, Stroke } from "gramoloss";
import { CanvasVect } from "./display/canvasVect";
import { CanvasCoord } from "./display/canvas_coord";
import { Color, getCanvasColor } from "../colors_v2";
import { ClientBoard, SELECTION_COLOR } from "./board";

export class ClientStroke extends Stroke{
    color: Color;
    canvas_positions: Array<CanvasCoord>;
    is_selected:boolean;
    canvas_corner_top_left: CanvasCoord;
    canvas_corner_bottom_right: CanvasCoord;
    
    constructor(pos: Array<Coord>, color: Color, width:number, view: View, index: number){
        super(pos, color, width, index);
        this.color = color;
        this.is_selected = false;
        this.canvas_positions = new Array();
        this.canvas_corner_top_left = view.create_canvas_coord(this.top_left);
        this.canvas_corner_bottom_right = view.create_canvas_coord(this.bot_right);
        for( let i = 0 ; i < this.positions.length; i ++){
            this.canvas_positions.push(view.create_canvas_coord(this.positions[i]));
        }
    }


    is_nearby(pos:CanvasCoord, view: View): boolean{
        const bot_right_canvas = view.create_canvas_coord(this.bot_right);
        const top_left_canvas = view.create_canvas_coord(this.top_left);
        // if (pos.x > bot_right_canvas.x +5 || pos.x < top_left_canvas.x - 5 || pos.y > bot_right_canvas.y +5 || pos.y < top_left_canvas.y - 5)
        // {
        //     console.log("not in rect")
        //     return false;
        // }


        for (let i = 0; i < this.positions.length-1; i++){
            if(pos.is_nearby_beziers_1cp(this.canvas_positions[i], this.canvas_positions[i].middle(this.canvas_positions[i+1]) , this.canvas_positions[i+1] )){
                return true;
            }
        }

        return false;
    }


    push(cpos:CanvasCoord, view: View){
        const pos = view.create_server_coord(cpos);
        this.positions.push(pos);
        this.bot_right.x = Math.max(pos.x, this.bot_right.x);
        this.top_left.x = Math.min(pos.x, this.top_left.x);
        this.bot_right.y = Math.max(pos.y, this.bot_right.y);
        this.top_left.y = Math.min(pos.y, this.top_left.y);
        this.canvas_positions.push(cpos);
    }

    translate_by_canvas_vect(shift: CanvasVect, view: View){
        const server_shift = view.server_vect(shift);
        this.translate(server_shift);

        for (const pos of this.canvas_positions){
            pos.translate_by_canvas_vect(shift);
        }
        this.canvas_corner_top_left.translate_by_canvas_vect(shift);
        this.canvas_corner_bottom_right.translate_by_canvas_vect(shift);
    }

    update_after_camera_change(view: View){
        this.canvas_corner_top_left = view.create_canvas_coord(this.top_left);
        this.canvas_corner_bottom_right = view.create_canvas_coord(this.bot_right);
        for( let i = 0 ; i < this.positions.length; i ++){
            this.canvas_positions[i] = view.create_canvas_coord(this.positions[i]);
        }
    }

    // Test if a stroke is in a Canvas Rectangle defined by two corners.
    // TODO: improve this function by considering that the rectangle intersect the stroke with its segments
    is_in_rect(corner1: CanvasCoord, corner2: CanvasCoord): boolean {
        for (const point of this.canvas_positions){
            if (point.is_in_rect(corner1, corner2)){
                return true;
            }
        }
        return false;
    }

    draw(board: ClientBoard){
        if(this.positions.length > 0){ 
            if(this.is_selected){
                const tlcanvas = this.canvas_corner_top_left;
                const brcanvas = this.canvas_corner_bottom_right;
                board.ctx.beginPath();
                board.ctx.strokeStyle = SELECTION_COLOR;
                board.ctx.lineWidth = 1;
                
                board.ctx.rect(tlcanvas.x - 3 ,tlcanvas.y - 3, brcanvas.x - tlcanvas.x + 6, brcanvas.y - tlcanvas.y + 6);
                board.ctx.stroke();
    
                
                let position_canvas = this.canvas_positions[0];
                board.ctx.beginPath();
                board.ctx.lineWidth = this.width + 4;
                board.ctx.moveTo(position_canvas.x, position_canvas.y);
                for(let i = 1; i<this.positions.length; i++){
                    position_canvas = this.canvas_positions[i];
                    board.ctx.lineTo(position_canvas.x, position_canvas.y);
                }
                board.ctx.stroke();
            }
    
            if ( board.elementOver instanceof ClientStroke && board.elementOver === this ){
                let position_canvas = this.canvas_positions[0];
                board.ctx.beginPath();
                board.ctx.strokeStyle = getCanvasColor(this.color, board.isDarkMode());
                board.ctx.lineWidth = this.width*6;
                board.ctx.globalAlpha = 0.5;
                board.ctx.moveTo(position_canvas.x, position_canvas.y);
                for(let i = 1; i < this.positions.length; i++){
                    position_canvas = this.canvas_positions[i];
                    board.ctx.lineTo(position_canvas.x, position_canvas.y);
                }
                board.ctx.stroke();
                board.ctx.globalAlpha = 1;
            }
            
            let position_canvas = this.canvas_positions[0];
            board.ctx.beginPath();
            board.ctx.strokeStyle = getCanvasColor(this.color, board.isDarkMode());
            board.ctx.lineWidth = this.width;
            board.ctx.moveTo(position_canvas.x, position_canvas.y);
            for(let i = 1; i < this.positions.length; i++){
                position_canvas = this.canvas_positions[i];
                board.ctx.lineTo(position_canvas.x, position_canvas.y);
            }
            board.ctx.stroke();
        }
    }
}