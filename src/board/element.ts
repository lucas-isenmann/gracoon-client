import { Coord, Link } from "gramoloss";
import { CanvasCoord } from "./display/canvas_coord";
import { Color, getCanvasColor } from "./display/colors_v2";
import { BoardElementType, ClientBoard } from "./board";
import { CanvasVect } from "./display/canvasVect";


export interface BoardElement {
    center: CanvasCoord;
    serverId: number;
    boardElementType: BoardElementType;
    delete: () => void;
    

    translate: (cshift: CanvasVect) => void;

    isSelected: boolean;
    select: () => void;
    deselect: () => void;

    isNearby: (pos: CanvasCoord, d: number) => boolean;
}




export class VertexElement implements BoardElement {
    center: CanvasCoord;
    id: number;
    serverId: number;
    boardElementType: BoardElementType;
    color: Color;
    isSelected: boolean = false;
    disk: SVGCircleElement;
    board: ClientBoard;

    constructor(board: ClientBoard, id: number, x: number, y: number, innerLabel: string, outerLabel: string, color: Color){
        this.id = board.elementCounter;
        this.center = new CanvasCoord(x,y);
        this.color = color;
        this.boardElementType = BoardElementType.Vertex;
        this.serverId = id;
        this.board = board;
        
        // Create circle element
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        board.svgContainer.appendChild(circle);
        
        // Set circle attributes
        circle.setAttribute("cx", `${x}`);    // Center x coordinate
        circle.setAttribute("cy", `${y}`);    // Center y coordinate
        circle.setAttribute("r", "5");     // Radius
        circle.setAttribute("fill", getCanvasColor(this.color, board.isDarkMode())); // Use provided color instead of hardcoded red
        circle.style.transformBox = "fill-box";
        
        circle.style.animation = "vertexCreate 0.5s ease-out forwards";
        this.disk = circle;
        this.disk.classList.add("vertex");
        this.disk.classList.add("deselected")

        board.elements.set(this.id, this);
        board.elementCounter += 1;
    }

    delete(){
        this.disk.remove();
    }

    isNearby (pos: CanvasCoord,d: number){
        return pos.dist2(this.center) <= d*d 
    }

    select(){
        this.disk.classList.add("selected")
        this.disk.classList.remove("deselected")
        this.isSelected = true;
        this.disk.style.animation = "selectVertex 0.5s ease-out forwards";
    }

    deselect(){
        this.disk.classList.remove("selected")
        this.disk.classList.add("deselected")
        this.isSelected = false;
        this.disk.style.animation = "deselectVertex 0.5s ease-out forwards";

    }

    translate (cshift: CanvasVect){
        this.center.x += cshift.x;
        this.center.y += cshift.y;

        this.disk.setAttribute("cx", `${this.center.x}`);    // Center x coordinate
        this.disk.setAttribute("cy", `${this.center.y}`);    // Center y coordinate

        for (const element of this.board.elements.values()){
            if (element instanceof LinkElement){
                if ( element.startIndex == this.serverId){
                    element.line.setAttribute("x1", this.center.x.toString())
                    element.line.setAttribute("y1", this.center.y.toString())
                }
                if ( element.endIndex == this.serverId){
                    element.line.setAttribute("x2", this.center.x.toString())
                    element.line.setAttribute("y2", this.center.y.toString())
                }
            }
        }
    }
}



export class LinkElement implements BoardElement {
    center: CanvasCoord;
    id: number;
    serverId: number;
    boardElementType: BoardElementType;
    color: Color;
    isSelected: boolean = false;
    startIndex: number;
    endIndex: number;
    line: SVGLineElement;


    constructor(board: ClientBoard, serverId: number, starIndex: number, endIndex: number, label: string, color: Color){
        this.id = board.elementCounter;
        this.center = new CanvasCoord(0,0);
        this.color = color;
        this.boardElementType = BoardElementType.Link;
        this.serverId = serverId;
        this.startIndex = starIndex;
        this.endIndex = endIndex;
        
        // Check if startIndex and endIndex vertices exist
        let startVertex: undefined | VertexElement = undefined;
        let endVertex = undefined;
        for (const element of board.elements.values()){
            if (element instanceof VertexElement){
                if (element.serverId == starIndex){
                    startVertex = element;
                } else if (element.serverId == endIndex){
                    endVertex = element;
                }
            }
        }
        this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");


        // Create Line element
        if (typeof startVertex != "undefined" && typeof endVertex != "undefined"){
            // Set line attributes
            this.line.setAttribute("x1", startVertex.center.x.toString());
            this.line.setAttribute("y1", startVertex.center.y.toString());
            this.line.setAttribute("x2", endVertex.center.x.toString());
            this.line.setAttribute("y2", endVertex.center.y.toString());
            this.line.setAttribute("stroke", getCanvasColor(this.color, board.isDarkMode()));
            this.line.setAttribute("stroke-width", "2");
            this.line.classList.add("link", "deselected")
            this.line.style.transformBox = "fill-box";
        

            board.svgContainer.appendChild(this.line);

            this.center.x = (startVertex.center.x + endVertex.center.x)/2
            this.center.y = (startVertex.center.y + endVertex.center.y)/2;

            board.elements.set(this.id, this);
            board.elementCounter += 1;
        }
        
    }

    delete(){
        this.line.remove();
    }

    isNearby (pos: CanvasCoord, d: number){
        // const v = startVertex;
        // const w = endVertex;
        // const linkcp_canvas = link.data.cp_canvas_pos;
        // const v_canvas_pos = v.data.canvas_pos;
        // const w_canvas_pos = w.data.canvas_pos
        // if (typeof linkcp_canvas != "string"){
        //     return e.is_nearby_beziers_1cp(v_canvas_pos, linkcp_canvas, w_canvas_pos);
        // }
        // else {
        //     // OPT dont need beziers as it is a straight line
        //     const middle = v_canvas_pos.middle(w_canvas_pos);
        //     return e.is_nearby_beziers_1cp(v_canvas_pos, middle, w_canvas_pos);
        // }


        return pos.dist2(this.center) <= d*d 
    }

    translate (cshift: CanvasVect){

    }

    select(){
        console.log("select line")
        this.line.classList.add("selected")
        this.line.classList.remove("deselected")
        this.isSelected = true;
        this.line.style.animation = "selectLine 0.5s ease-out forwards";
    }


    deselect(){
        this.line.classList.remove("selected")
        this.line.classList.add("deselected")
        this.isSelected = false;
        this.line.style.animation = "deselectLine 0.5s ease-out forwards";
    }
}