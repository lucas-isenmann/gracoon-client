import { CanvasCoord } from "./canvas_coord";
import { Multicolor } from "./multicolor";

const ARC_ARROW_LENGTH = 12




export function drawLine(start: CanvasCoord, end: CanvasCoord, ctx: CanvasRenderingContext2D, color: string, width: number) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
}

export function drawBezierCurve(ctx: CanvasRenderingContext2D,  p1: CanvasCoord, c1: CanvasCoord, c2: CanvasCoord, p2: CanvasCoord, color: string, width: number): void{
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
    ctx.stroke();
}


export function drawCircle(center: CanvasCoord, fillStyle: string, radius: number, alpha: number, ctx: CanvasRenderingContext2D): void {
    if(center != null){
        ctx.beginPath();
        ctx.fillStyle = fillStyle;
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.globalAlpha = alpha;

        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

export function drawArc(ctx: CanvasRenderingContext2D, center: CanvasCoord, strokeStyle: string, radius: number, alpha: number, width: number){
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.lineWidth = width;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
}



