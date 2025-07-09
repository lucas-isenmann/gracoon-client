import { CanvasCoord } from "./display/canvas_coord";
import { Color, getCanvasColor } from "./display/colors_v2";
import { BoardElementType, ClientBoard, SELECTION_COLOR } from "./board";
import { BoardElement, VertexElement } from "./element";
import { Coord } from "gramoloss";
import { CanvasVect } from "./display/canvasVect";

export class VerticesSubset implements BoardElement{
    id: number;
    color: Color;
    colorString: string;
    isSelected: boolean;
    board: ClientBoard;
    cameraCenter: CanvasCoord;
    serverId: number;
    boardElementType: BoardElementType = BoardElementType.Local;
    
    points: Array<Coord>;
    convexHullPoints: Array<Coord>;

    svg: SVGElement;
    thickness: number
    margin: number;


    
    
    constructor(board: ClientBoard, vertices: Array<number>, thickness: number){
        this.id = board.elementCounter;
        board.elements.set(this.id, this);
        board.elementCounter += 1;

        this.cameraCenter = new CanvasCoord(0,0, board.camera);

        this.serverId = this.id;
        this.color = board.colorSelected;
        this.colorString = getCanvasColor(this.color, board.isDarkMode());
        this.margin = 10;
        this.isSelected = false;
        this.board = board;
        this.points = new Array();



        for (const vId of vertices){
            const element = this.board.elements.get(vId);
            if (element instanceof VertexElement){
                this.points.push(element.cameraCenter.serverPos)
            }
        }

        this.convexHullPoints = findConvexHullCycle(this.points);


        this.thickness = thickness;

        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.svg.classList.add("vertices-subset");
        board.svgContainer.appendChild(this.svg);
        this.svg.setAttribute("stroke", getCanvasColor(this.color, board.isDarkMode()));
        this.svg.setAttribute("stroke-opacity", "0.1")
        this.svg.setAttribute("fill", getCanvasColor(this.color, board.isDarkMode()));
        this.svg.setAttribute("fill-opacity", "0.1")
        this.svg.setAttribute("stroke-width", thickness.toString());
        this.updatePathData();

    }

   

    updatePathData(){
        // Generate SVG path command
        let pathData = this.convexHullPoints.reduce((path, point, index) => {
            const canvasPos = this.board.camera.create_canvas_coord(point);
            const command = index === 0 ? 'M' : 'L';
            return `${path} ${command} ${canvasPos.x},${canvasPos.y}`;
        }, '');
        pathData += "Z";

        this.svg.setAttribute('d', pathData);
    }

    
    delete (){
        this.svg.remove();
    }

    updateAfterCameraChange(){

    }

    setColor(color: Color){

    }

    translate(cshift: CanvasVect){

    }

    select(){

    }

    deselect(){

    }

    isInRect(corner1: CanvasCoord, corner2: CanvasCoord){
        return false;
    };

    isNearby(pos: CanvasCoord, d: number){
        return false
    }


   


}


function findConvexHullCycle(points: Coord[]): Coord[] {
    const n = points.length;
    if (n <= 2){
        return points;
    }
    
    // Find the leftmost point
    let start = 0;
    for (let i = 1; i < n; i++) {
        if (points[i].x < points[start].x || 
            (points[i].x === points[start].x && points[i].y < points[start].y)) {
            start = i;
        }
    }

    // Initialize stack with first point
    const stack: Coord[] = [points[start]];

    // Process remaining points
    let p = start;
    let q = 0;
    if (q == start){
        q = 1;
    }
    let counter = 0;
    while (true  ) {
        counter += 1;
        if (counter >= n){ // Avoid infinite loops
            break;
        }
        // Find next point on convex hull
        for (let i = 0; i < n; i++) {
            if (i !== p && isPointOnLeft(points[p], points[i], points[q])) {
                q = i;
            }
        }

        if (q == start){
            break;
        }
        stack.push(points[q]);
        p = q;
        q = 0;
        if (q == p){
            q = 1;
        }
    }

    return stack;
}


function isPointOnLeft(p1: Coord, p2: Coord, p3: Coord): boolean {
    const val = (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
    return val > 0 || (val === 0 && (p2.x - p1.x) * (p2.y - p3.y) + (p3.x - p2.x) * (p2.y - p1.y) >= 0);
}



