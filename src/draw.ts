export const SELECTION_COLOR = 'green' // avant c'était '#00ffff'
export let COLOR_BACKGROUND = "#1e1e1e";
export const GRID_COLOR = '#777777';
export const VERTEX_RADIUS = 8;
export const COLOR_ALIGNEMENT_LINE = "#444444";
export let COLOR_BORDER_VERTEX = "#ffffff";
export let COLOR_INNER_VERTEX_DEFAULT = "#000000";


import { User, users } from './user';
import { ClientGraph } from './board/graph';
import { clamp } from './utils';
import { Multicolor } from './multicolor';
import { drawRoundRect} from './draw_basics';
import { graph_clipboard } from './clipboard';

export function toggle_dark_mode(enable:boolean){
    const action_DOM = document.getElementById("actions");
    const interactor_DOM = document.getElementById("interaction_mode_selector");
    const border_DOM = document.getElementById("border"); // TODO: Change border color and check if someone is followed first
    if(enable){
        COLOR_BACKGROUND = "#1e1e1e";
        // COLOR_INDEX = "#ffffff";
        COLOR_BORDER_VERTEX = "#ffffff";
        document.documentElement.style.setProperty(`--background_color_div`, "#ffffff"); 
        document.documentElement.style.setProperty(`--color_div`, "#000000"); 
        document.documentElement.style.setProperty(`--background_color_page`, COLOR_BACKGROUND); 
        
        const action_svgs = action_DOM.getElementsByTagName('img');
        for(const svg of action_svgs){
            svg.style.filter = "";
        }

        const interactor_svgs = interactor_DOM.getElementsByTagName('img');
        for(const svg of interactor_svgs){
            svg.style.filter = "";
        }
        // action_DOM.style.backgroundColor = "#fff";
    }
    else{
        COLOR_BACKGROUND = "#fafafa";
        // COLOR_INDEX = "#ffffff";
        COLOR_BORDER_VERTEX = "#000000";
        
        document.documentElement.style.setProperty(`--background_color_div`, "#202124"); 
        document.documentElement.style.setProperty(`--color_div`, "#ffffff"); 
        document.documentElement.style.setProperty(`--background_color_page`, COLOR_BACKGROUND); 
 
        const action_svgs = action_DOM.getElementsByTagName('img');
        for(const svg of action_svgs){
            svg.style.filter = "invert(100%) sepia(0%) saturate(2%) hue-rotate(115deg) brightness(102%) contrast(100%)";
            console.log(svg.style);
        }

        const interactor_svgs = interactor_DOM.getElementsByTagName('img');
        for(const svg of interactor_svgs){
            svg.style.filter = "invert(100%) sepia(0%) saturate(2%) hue-rotate(115deg) brightness(102%) contrast(100%)";
        }
    }
}











function draw_user_label(x:number, y:number, label:string, multicolor:Multicolor, timer_refresh:number, ctx: CanvasRenderingContext2D){
    
    // We set up a two second delay before starting to fade
    if(Date.now() - timer_refresh > 2000){
        ctx.globalAlpha = Math.max(0, 1 - (Date.now() - timer_refresh - 2000 )/2000);
    }
    else{
        ctx.globalAlpha = 1;
    }

    ctx.font = "400 17px Arial";
    const text = ctx.measureText(label);
    ctx.strokeStyle = multicolor.color;
    ctx.fillStyle = multicolor.color;
    // Rectangle 
    drawRoundRect(ctx, x, y, text.width + 10, 21, 5, multicolor.color, multicolor.color);

    // username
    ctx.beginPath();
    ctx.fillStyle = multicolor.contrast;
    ctx.fillText(label,  x + 5, y + 16);
    ctx.fill();

    ctx.globalAlpha = 1;
}


function draw_user_arrow(user: User, ctx: CanvasRenderingContext2D){
    if ( typeof user.canvas_pos == "undefined") return;
    
    // Background
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = user.multicolor.darken;
    ctx.moveTo(user.canvas_pos.x - 2, user.canvas_pos.y + 1);
    ctx.lineTo(user.canvas_pos.x - 2, user.canvas_pos.y + 21);
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;

    //Arrow
    ctx.beginPath();
    ctx.fillStyle = user.multicolor.color;
    ctx.moveTo(user.canvas_pos.x, user.canvas_pos.y);
    ctx.lineTo(user.canvas_pos.x + 13, user.canvas_pos.y + 13);
    ctx.lineTo(user.canvas_pos.x + 5, user.canvas_pos.y + 13);
    ctx.lineTo(user.canvas_pos.x, user.canvas_pos.y + 20);
    ctx.closePath();
    ctx.fill();

    // Bright sides
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = user.multicolor.lighten;
    ctx.moveTo(user.canvas_pos.x, user.canvas_pos.y);
    ctx.lineTo(user.canvas_pos.x + 13, user.canvas_pos.y + 13);
    ctx.lineTo(user.canvas_pos.x + 5, user.canvas_pos.y + 13);
    ctx.lineTo(user.canvas_pos.x, user.canvas_pos.y + 20);
    ctx.stroke();
}


export function draw_user(user: User, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    if ( typeof user.canvas_pos == "undefined") return;
    
    if(user.canvas_pos.x > canvas.width || user.canvas_pos.x < 0 || user.canvas_pos.y > canvas.height  || user.canvas_pos.y < 0 ){
        const x = clamp(user.canvas_pos.x, 0, canvas.width);
        const y = clamp(user.canvas_pos.y, 0, canvas.height);

        ctx.beginPath();
        ctx.fillStyle = user.multicolor.color;
        ctx.arc(x, y, 10, 0, 2*Math.PI);
        ctx.fill();

        ctx.font = "400 17px Arial";
        const text = ctx.measureText(user.label);

        let shift_x = 0;
        let shift_y = 0;
        if(user.canvas_pos.x > canvas.width){
            shift_x = - text.width - 23 ;
            shift_y = -10;
        }
        if(user.canvas_pos.x < 0){
            shift_x = 13 ;
            shift_y = -10;
        }
        if(user.canvas_pos.y > canvas.height){
            shift_x = - text.width/2 - 5;
            shift_y = - 34 ;

            if(user.canvas_pos.x < 0){
                shift_x = 10;
            }
            if(user.canvas_pos.x > canvas.width){
                shift_x = - text.width - 13;
            }
        }
        if(user.canvas_pos.y < 0){
            shift_x = - text.width/2 - 5;
            shift_y = 13 ;

            if(user.canvas_pos.x < 0){
                shift_x = 10;
            }
            if(user.canvas_pos.x > canvas.width){
                shift_x = - text.width - 13;
            }
        }

        // Date.now() is to prevent the label to fade when shown on the side of the screen
        // TODO: Change this.
        draw_user_label(x + shift_x, y + shift_y, user.label, user.multicolor, Date.now(), ctx);
        

    }
    else{
        // DRAW USERNAME 
        draw_user_label(user.canvas_pos.x + 10, user.canvas_pos.y + 17, user.label, user.multicolor, user.timer_refresh, ctx);
    

        // DRAW ARROW
        draw_user_arrow(user, ctx);
    }
    
}





// DRAW USERS
export function drawUsers(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    users.forEach(user => {
        draw_user(user, canvas, ctx);
    });
}






export function drawClipboardGraph(ctx: CanvasRenderingContext2D){
    if ( graph_clipboard != null){
        graph_clipboard.draw(ctx);
    }
}


