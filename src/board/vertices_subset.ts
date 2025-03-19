import { CanvasCoord } from "./display/canvas_coord";
import { Color, getCanvasColor } from "./display/colors_v2";
import { ClientBoard, SELECTION_COLOR } from "./board";
import { ClientVertex } from "./vertex";

export class VerticesSubset {
    id: number;
    color: Color;
    colorString: string;
    isSelected: boolean;
    margin: number;
    board: ClientBoard;
    vertices: Array<ClientVertex>;
    points: Array<CanvasCoord>;
    
    constructor(board: ClientBoard, vertices: Array<ClientVertex>, id: number, margin: number){
        this.id = id;
        this.color = Color.Blue;
        this.colorString = getCanvasColor(this.color, board.isDarkMode());
        this.margin = 10;
        this.isSelected = false;
        this.board = board;
        this.vertices = vertices;
        this.points = new Array();
        for (const v of this.vertices ){
            this.points.push(v.data.canvas_pos);
        }
    }


    draw(){
        drawConvexHull(this.board.ctx, this.points, this.colorString )
    }


}


function findConvexHullCycle(points: CanvasCoord[]): CanvasCoord[] {
    const n = points.length;
    
    // Find the leftmost point
    let start = 0;
    for (let i = 1; i < n; i++) {
        if (points[i].x < points[start].x || 
            (points[i].x === points[start].x && points[i].y < points[start].y)) {
            start = i;
        }
    }

    // Initialize stack with first point
    const stack: CanvasCoord[] = [points[start]];

    // Process remaining points
    let p = start;
    let q = 0;
    while (q < n - 1) {
        // Find next point on convex hull
        for (let i = 0; i < n; i++) {
            if (i !== p && isPointOnLeft(points[p], points[i], points[q])) {
                q = i;
            }
        }

        stack.push(points[q]);
        p = q;
    }

    return stack;
}

function isPointOnLeft(p1: CanvasCoord, p2: CanvasCoord, p3: CanvasCoord): boolean {
    const val = (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
    return val > 0 || (val === 0 && (p2.x - p1.x) * (p2.y - p3.y) + (p3.x - p2.x) * (p2.y - p1.y) >= 0);
}




function drawConvexHull(ctx: CanvasRenderingContext2D, points: Array<CanvasCoord>, color: string){

    ctx.beginPath();

    const hullPoints = findConvexHullCycle(points);

    // Add all points to the path
    for (let i = 0; i < hullPoints.length; i++) {
        const point = hullPoints[i];
        ctx.moveTo(point.x, point.y);

        if (i === hullPoints.length - 1) {
            ctx.lineTo(hullPoints[0].x, hullPoints[0].y);
        } else {
            ctx.lineTo(hullPoints[i + 1].x, hullPoints[i + 1].y);
        }
    }

    // Close the path
    ctx.closePath();

    // Set stroke style
    ctx.strokeStyle = color;

    ctx.stroke();
}