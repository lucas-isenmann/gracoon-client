import { INDEX_TYPE } from "./board/camera";
import { VERTEX_RADIUS } from "./draw";
import { CanvasCoord } from "./board/canvas_coord";
import { Multicolor } from "./multicolor";

const ARC_ARROW_LENGTH = 12

function drawTriangle(ctx: CanvasRenderingContext2D, a: CanvasCoord, b: CanvasCoord, c: CanvasCoord){
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(a.x, a.y);
    ctx.stroke();
}


export function drawLine(start: CanvasCoord, end: CanvasCoord, ctx: CanvasRenderingContext2D, color: string, width: number) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}

export function drawBezierCurve(ctx: CanvasRenderingContext2D,  p1: CanvasCoord, c1: CanvasCoord, c2: CanvasCoord, p2: CanvasCoord, color: string, width: number){
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
    ctx.stroke();
}


export function draw_circle(center: CanvasCoord, fillStyle: string, radius: number, alpha: number, ctx: CanvasRenderingContext2D) {
    if(center != null){
        ctx.beginPath();
        ctx.fillStyle = fillStyle;
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.globalAlpha = alpha;

        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fillColor?: string, strokeColor?: string) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;

    ctx.beginPath();
    if (typeof fillColor !== 'undefined') {
        ctx.fillStyle = fillColor;
    }
    if (typeof strokeColor !== 'undefined') {
        ctx.strokeStyle = strokeColor;
    }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);

    if (typeof fillColor !== 'undefined') {
        ctx.fill();
    }
    ctx.closePath();
}

export function draw_head(ctx: CanvasRenderingContext2D, start_pos: CanvasCoord, end_pos: CanvasCoord, indexType: INDEX_TYPE) {
    const headlen = ARC_ARROW_LENGTH;
    let vertex_radius = VERTEX_RADIUS;
    if (indexType != INDEX_TYPE.NONE) {
        vertex_radius = VERTEX_RADIUS * 2;
    }
    const d = Math.sqrt(start_pos.dist2(end_pos))
    const tox2 = end_pos.x + (start_pos.x - end_pos.x) * vertex_radius / d
    const toy2 = end_pos.y + (start_pos.y - end_pos.y) * vertex_radius / d
    const dx = tox2 - start_pos.x;
    const dy = toy2 - start_pos.y;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(tox2, toy2);
    ctx.lineTo(tox2 - headlen * Math.cos(angle - Math.PI / 6), toy2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox2, toy2);
    ctx.lineTo(tox2 - headlen * Math.cos(angle + Math.PI / 6), toy2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}



export function draw_user_label(x:number, y:number, label:string, multicolor:Multicolor, timer_refresh:number, ctx: CanvasRenderingContext2D){
    
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