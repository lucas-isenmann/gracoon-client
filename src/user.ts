import { Coord, Option } from "gramoloss";
import { ClientBoard } from "./board/board";
import { CanvasCoord } from "./board/display/canvas_coord";
import { drawUserLabel } from "./board/display/draw_basics";
import { Multicolor } from "./board/display/multicolor";
import { clamp } from "./utils";
import { LocalPoint } from "./board/elements/localPoint";


export class User {
    id: string;
    label: string;
    multicolor: Multicolor;
    canvasPos: Option<CanvasCoord> = undefined;
    timerRefresh : number; // Date since the last change of position
    idTimeout : number | undefined = undefined; // Id of the time_out to kill when position is changed, "" if empty. 
    point: LocalPoint;

    constructor(id: string, label: string, color: string, board: ClientBoard, pos?: Coord) {
        this.id = id;
        this.label = label;
        this.multicolor = new Multicolor(color);
        if (typeof pos !== 'undefined') {
            this.canvasPos = board.camera.createCanvasCoord(pos);
        }
        this.timerRefresh = Date.now();

        this.point = new LocalPoint(board, new CanvasCoord(300,300, board.camera));

        this.point.disk.setAttribute("fill", this.multicolor.color);

    }

    setPos(newPos: Option<Coord>, board: ClientBoard) {
        
    }

    setColor(color: string){
        this.multicolor.setColor(color);
        this.point.disk.setAttribute("fill", this.multicolor.color);

    }
    



    draw_user_arrow(ctx: CanvasRenderingContext2D){
        
    }


    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        if ( typeof this.canvasPos == "undefined") return;
        
        if(this.canvasPos.x > canvas.width || this.canvasPos.x < 0 || this.canvasPos.y > canvas.height  || this.canvasPos.y < 0 ){
            const x = clamp(this.canvasPos.x, 0, canvas.width);
            const y = clamp(this.canvasPos.y, 0, canvas.height);

            ctx.beginPath();
            ctx.fillStyle = this.multicolor.color;
            ctx.arc(x, y, 10, 0, 2*Math.PI);
            ctx.fill();

            ctx.font = "400 17px Arial";
            const text = ctx.measureText(this.label);

            let shift_x = 0;
            let shift_y = 0;
            if(this.canvasPos.x > canvas.width){
                shift_x = - text.width - 23 ;
                shift_y = -10;
            }
            if(this.canvasPos.x < 0){
                shift_x = 13 ;
                shift_y = -10;
            }
            if(this.canvasPos.y > canvas.height){
                shift_x = - text.width/2 - 5;
                shift_y = - 34 ;

                if(this.canvasPos.x < 0){
                    shift_x = 10;
                }
                if(this.canvasPos.x > canvas.width){
                    shift_x = - text.width - 13;
                }
            }
            if(this.canvasPos.y < 0){
                shift_x = - text.width/2 - 5;
                shift_y = 13 ;

                if(this.canvasPos.x < 0){
                    shift_x = 10;
                }
                if(this.canvasPos.x > canvas.width){
                    shift_x = - text.width - 13;
                }
            }

            // Date.now() is to prevent the label to fade when shown on the side of the screen
            // TODO: Change this.
            drawUserLabel(x + shift_x, y + shift_y, this.label, this.multicolor, Date.now(), ctx);
            

        }
        else{
            // DRAW USERNAME 
            drawUserLabel(this.canvasPos.x + 10, this.canvasPos.y + 17, this.label, this.multicolor, this.timerRefresh, ctx);
        

            // DRAW ARROW
            this.draw_user_arrow(ctx);
        }
        
    }




}





