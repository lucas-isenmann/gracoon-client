import { Coord, Option } from "gramoloss";
import { ClientBoard } from "./board/board";
import { Camera } from "./board/display/camera";
import { CanvasCoord } from "./board/display/canvas_coord";
import { drawUserLabel } from "./board/display/draw_basics";
import { Multicolor } from "./board/display/multicolor";
import { clamp } from "./utils";


export class User {
    id: string;
    label: string;
    multicolor: Multicolor;
    pos: Option<Coord>;
    canvasPos: Option<CanvasCoord>;
    timerRefresh : number; // Date since the last change of position
    idTimeout : number | undefined; // Id of the time_out to kill when position is changed, "" if empty. 

    constructor(id: string, label: string, color: string, camera: Camera, pos?: Coord) {
        this.id = id;
        this.label = label;
        this.multicolor = new Multicolor(color);
         
        if (typeof pos !== 'undefined') {
            this.pos = pos;
            this.canvasPos = camera.create_canvas_coord(this.pos);
        }
        else{
            this.pos = undefined;
            this.canvasPos = undefined;
        }
        this.timerRefresh = Date.now();
        this.idTimeout = undefined;
    }

    set_pos(newPos: Option<Coord>, board: ClientBoard) {

        if (typeof newPos != "undefined"){
            if( typeof this.pos == "undefined" || ( this.pos.x != newPos.x || this.pos.y != newPos.y ) ){ // If the user position is updated
                this.timerRefresh = Date.now();
                if( typeof this.idTimeout !== "undefined"){
                    clearTimeout(this.idTimeout); // We clear the current timeout 
                    this.idTimeout = undefined;
                }
                // We set a new timeout that starts after 2 seconds. 
                this.idTimeout = setTimeout(() => {
                    // We draw the canvas every 100ms
                    const interval_id = setInterval(()=>{
                        const canvas = document.getElementById('main') as HTMLCanvasElement;
                        const ctx = canvas.getContext('2d');
    
                        if(Date.now() - this.timerRefresh > 4000){
                            // The interval kill itself after the user does not move for 4secs 
                            clearInterval(interval_id); 
                        }
                    }, 100);
                }, 2000);
            }
        }
        
        this.pos = newPos;
        if (typeof this.pos != "undefined"){
            this.canvasPos = board.camera.create_canvas_coord(this.pos);
        } else {
            this.canvasPos = undefined;
        }
    }

    setColor(color: string){
        this.multicolor.setColor(color);
    }
    






    draw_user_arrow(ctx: CanvasRenderingContext2D){
        if ( typeof this.canvasPos == "undefined") return;
        
        // Background
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = this.multicolor.darken;
        ctx.moveTo(this.canvasPos.x - 2, this.canvasPos.y + 1);
        ctx.lineTo(this.canvasPos.x - 2, this.canvasPos.y + 21);
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.globalAlpha = 1;

        //Arrow
        ctx.beginPath();
        ctx.fillStyle = this.multicolor.color;
        ctx.moveTo(this.canvasPos.x, this.canvasPos.y);
        ctx.lineTo(this.canvasPos.x + 13, this.canvasPos.y + 13);
        ctx.lineTo(this.canvasPos.x + 5, this.canvasPos.y + 13);
        ctx.lineTo(this.canvasPos.x, this.canvasPos.y + 20);
        ctx.closePath();
        ctx.fill();

        // Bright sides
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.multicolor.lighten;
        ctx.moveTo(this.canvasPos.x, this.canvasPos.y);
        ctx.lineTo(this.canvasPos.x + 13, this.canvasPos.y + 13);
        ctx.lineTo(this.canvasPos.x + 5, this.canvasPos.y + 13);
        ctx.lineTo(this.canvasPos.x, this.canvasPos.y + 20);
        ctx.stroke();
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





