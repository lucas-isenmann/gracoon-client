import { CanvasCoord } from "./display/canvas_coord";
import { Color, getCanvasColor } from "./display/colors_v2";
import { BoardElementType, ClientBoard } from "./board";
import { CanvasVect } from "./display/canvasVect";
import { Coord, is_segments_intersection } from "gramoloss";


export interface BoardElement {
    center: CanvasCoord;
    serverId: number;
    boardElementType: BoardElementType;
    delete: () => void;
    
    setColor: (color: Color) => void;
    color: Color;

    translate: (cshift: CanvasVect) => void;

    isSelected: boolean;
    select: () => void;
    deselect: () => void;

    isInRect: (corner1: CanvasCoord, corner2: CanvasCoord) => boolean;
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
    highlight: number | undefined;

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
        
        // circle.style.animation = "vertexCreate 0.5s ease-out forwards";
        this.disk = circle;
        this.disk.classList.add("vertex");

        board.elements.set(this.id, this);
        board.elementCounter += 1;

        board.resetGraph() 
    }

    setHighlight(value: number){
        this.highlight = value;
        this.disk.classList.add("highlight");
        this.disk.setAttribute("stroke", "black");
        this.disk.setAttribute('stroke-width', '10');
    }

    unHighlight(){
        this.highlight = undefined;
        this.disk.classList.remove("highlight")
    }

    setColor (color: Color) {
        this.color = color;
        this.disk.setAttribute("fill", getCanvasColor(this.color, this.board.isDarkMode()));
    }

    delete(){
        this.disk.remove();
    }

    isNearby (pos: CanvasCoord,d: number) {
        return pos.dist2(this.center) <= d*d 
    }

    isInRect (corner1: CanvasCoord, corner2: CanvasCoord) : boolean  {
        return this.center.is_in_rect(corner1, corner2);
    }

    select(){
        this.disk.classList.remove("deselected")
        this.disk.classList.add("selected")

        this.isSelected = true;
        // this.disk.style.animation = "selectVertex 0.5s ease-out forwards";
    }

    deselect(){
        this.disk.classList.remove("selected")
        this.disk.classList.add("deselected")
        this.isSelected = false;
        // this.disk.style.animation = "deselectVertex 0.5s ease-out forwards";

    }

    translate (cshift: CanvasVect){
        this.center.x += cshift.x;
        this.center.y += cshift.y;

        this.disk.setAttribute("cx", `${this.center.x}`);    // Center x coordinate
        this.disk.setAttribute("cy", `${this.center.y}`);    // Center y coordinate

        for (const element of this.board.elements.values()){
            if (element instanceof LinkElement){
                const link = element;
                if ( link.startVertex.serverId == this.serverId){
                    link.line.setAttribute("x1", this.center.x.toString())
                    link.line.setAttribute("y1", this.center.y.toString())
                }
                if ( link.endVertex.serverId == this.serverId){
                    link.line.setAttribute("x2", this.center.x.toString())
                    link.line.setAttribute("y2", this.center.y.toString())
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
    startVertex: VertexElement;
    endVertex: VertexElement;
    line: SVGLineElement;
    isDirected: boolean;
    board: ClientBoard;
    highlight: number | undefined;
    


    constructor(board: ClientBoard, serverId: number, startVertex: VertexElement, endVertex: VertexElement, directed: boolean, label: string, color: Color){
        this.id = board.elementCounter;
        this.center = new CanvasCoord(0,0);
        this.color = color;
        this.boardElementType = BoardElementType.Link;
        this.serverId = serverId;
        this.startVertex = startVertex;
        this.endVertex = endVertex;
        this.isDirected = directed;

        
        this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        board.svgContainer.appendChild(this.line);

        // Set line attributes
        this.line.setAttribute("x1", startVertex.center.x.toString());
        this.line.setAttribute("y1", startVertex.center.y.toString());
        this.line.setAttribute("x2", endVertex.center.x.toString());
        this.line.setAttribute("y2", endVertex.center.y.toString());
        this.line.setAttribute("stroke", getCanvasColor(this.color, board.isDarkMode()));
        this.line.setAttribute("stroke-width", "2");
        this.line.classList.add("link")
        this.line.style.transformBox = "fill-box";

        if (this.isDirected) {
            const markerId = `arrow-head-${this.color}`;
            this.line.setAttribute("marker-end", `url(#${markerId})`);
        }
    


        this.center.x = (startVertex.center.x + endVertex.center.x)/2
        this.center.y = (startVertex.center.y + endVertex.center.y)/2;

        board.elements.set(this.id, this);
        board.elementCounter += 1;
        this.board = board;

        board.resetGraph() 
    }

    setHighlight(value: number){
        this.highlight = value;
        this.line.classList.add("highlight")
    }

    unHighlight(){
        this.highlight = undefined;
        this.line.classList.remove("highlight")
    }

    delete(){
        this.line.remove();
    }

    setColor (color: Color) {
        this.color = color;
        this.line.setAttribute("stroke", getCanvasColor(this.color, this.board.isDarkMode()));
        if (this.isDirected){
            const markerId = `arrow-head-${this.color}`;
            this.line.setAttribute("marker-end", `url(#${markerId})`);
        }

    }

    /**
     * TODO
     * @param c1 
     * @param c2 
     * @returns 
     */
    isInRect(c1: CanvasCoord, c2: CanvasCoord) {
        //V1: is in rect if one of its extremities is in the rectangle
        //TODO: be more clever and select also when there is an intersection between the edge and the rectangle
        // let startVertex: undefined | VertexElement = undefined;
        // let endVertex = undefined;
        // for (const element of this.board.elements.values()){
        //     if (element instanceof VertexElement){
        //         if (element.serverId == starIndex){
        //             startVertex = element;
        //         } else if (element.serverId == endIndex){
        //             endVertex = element;
        //         }
        //     }
        // }
        return this.startVertex.isInRect(c1, c2) || this.endVertex.isInRect(c1, c2);
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











export class ShapeElement implements BoardElement {
    center: CanvasCoord;
    id: number;
    serverId: number;
    boardElementType: BoardElementType;
    color: Color;
    isSelected: boolean = false;
    board: ClientBoard;

    shape: SVGRectElement;

    canvas_corner_top_left : CanvasCoord;
    canvas_corner_bottom_left : CanvasCoord;
    canvas_corner_bottom_right : CanvasCoord;
    canvas_corner_top_right : CanvasCoord;
    c1: Coord;
    c2: Coord;
    


    constructor(board: ClientBoard, serverId: number, c1: Coord, c2: Coord, color: Color){
        this.id = board.elementCounter;
        this.center = new CanvasCoord(0,0);
        this.color = color;
        this.boardElementType = BoardElementType.Rectangle;
        this.serverId = serverId;

        this.c1 = c1.copy();
        this.c2 = c2.copy();


        this.canvas_corner_bottom_left = new CanvasCoord(Math.min(c1.x, c2.x), Math.max(c1.y, c2.y));
        this.canvas_corner_bottom_right = new CanvasCoord(Math.max(c1.x, c2.x), Math.max(c1.y, c2.y));
        this.canvas_corner_top_left = new CanvasCoord(Math.min(c1.x, c2.x), Math.min(c1.y, c2.y));
        this.canvas_corner_top_right = new CanvasCoord(Math.max(c1.x, c2.x), Math.min(c1.y, c2.y));

        
        this.shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        board.svgContainer.appendChild(this.shape);

        // Set SVG Element attributes
        this.shape.setAttribute("x", this.canvas_corner_top_left.x.toString());
        this.shape.setAttribute("y", this.canvas_corner_top_left.y.toString())
        this.shape.setAttribute("width", (this.canvas_corner_bottom_right.x - this.canvas_corner_bottom_left.x).toString());
        this.shape.setAttribute("height", (this.canvas_corner_bottom_right.y - this.canvas_corner_top_left.y).toString());
        this.shape.setAttribute("stroke", getCanvasColor(this.color, board.isDarkMode()));
        this.shape.setAttribute("stroke-width", "2");
        this.shape.setAttribute("fill", getCanvasColor(this.color, board.isDarkMode()));
        this.shape.setAttribute("fill-opacity", "0.1")
        this.shape.classList.add("shape", "deselected")
        this.shape.style.transformBox = "fill-box";


        this.center.x = (c1.x + c2.x)/2;
        this.center.y = (c1.y + c2.y)/2;

        board.elements.set(this.id, this);
        board.elementCounter += 1;
        this.board = board;
    }

    delete(){
        this.shape.remove();
    }

    setCorners(c1:CanvasCoord, c2:CanvasCoord){
        console.log("setCorner")

        this.c1.copy_from(c1);
        this.c2.copy_from(c2);

        this.canvas_corner_top_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_top_right.y = Math.min(c1.y, c2.y);
        this.canvas_corner_top_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_top_left.y = Math.min(c1.y, c2.y);
        this.canvas_corner_bottom_right.x = Math.max(c1.x, c2.x);
        this.canvas_corner_bottom_right.y = Math.max(c1.y, c2.y);
        this.canvas_corner_bottom_left.x = Math.min(c1.x, c2.x);
        this.canvas_corner_bottom_left.y = Math.max(c1.y, c2.y);

        this.shape.setAttribute("x", this.canvas_corner_top_left.x.toString());
        this.shape.setAttribute("y", this.canvas_corner_top_left.y.toString())
        this.shape.setAttribute("width", (this.canvas_corner_bottom_right.x - this.canvas_corner_bottom_left.x).toString());
        this.shape.setAttribute("height", (this.canvas_corner_bottom_right.y - this.canvas_corner_top_left.y).toString());
    }

    setColor (color: Color) {
        this.color = color;
        this.shape.setAttribute("stroke", getCanvasColor(this.color, this.board.isDarkMode()));
        this.shape.setAttribute("fill", getCanvasColor(this.color, this.board.isDarkMode()));
    }

   
    isInRect(c1: CanvasCoord, c2: CanvasCoord) {
        
        const topLeft = new Coord(Math.min(c1.x, c2.x), Math.min(c1.y, c2.y));
        const topRight = new Coord(Math.max(c1.x, c2.x), Math.min(c1.y, c2.y));
        const bottomLeft = new Coord(Math.min(c1.x, c2.x), Math.max(c1.y, c2.y));
        const bottomRight = new Coord(Math.max(c1.x, c2.x), Math.max(c1.y, c2.y));
        if (topLeft.is_in_rect(this.canvas_corner_top_left, this.canvas_corner_bottom_right) || topRight.is_in_rect(this.canvas_corner_top_left, this.canvas_corner_bottom_right) || bottomLeft.is_in_rect(this.canvas_corner_top_left, this.canvas_corner_bottom_right) || bottomRight.is_in_rect(this.canvas_corner_top_left, this.canvas_corner_bottom_right)){
            return true;
        }

        if (this.canvas_corner_bottom_left.is_in_rect(c1,c2)
        || this.canvas_corner_bottom_right.is_in_rect(c1,c2)
        || this.canvas_corner_top_left.is_in_rect(c1,c2)
        || this.canvas_corner_top_right.is_in_rect(c1,c2) ){
            return true;
        }

        if (is_segments_intersection(this.canvas_corner_top_left, this.canvas_corner_top_right, topLeft, bottomLeft)
        || is_segments_intersection(this.canvas_corner_top_left, this.canvas_corner_top_right, topRight, bottomRight)
        || is_segments_intersection(this.canvas_corner_bottom_left, this.canvas_corner_bottom_right, topLeft, bottomLeft)
        || is_segments_intersection(this.canvas_corner_bottom_left, this.canvas_corner_bottom_right, topRight, bottomRight)){
            return true;
        }

        if (is_segments_intersection(this.canvas_corner_top_left, this.canvas_corner_bottom_left, topLeft, topRight)
        || is_segments_intersection(this.canvas_corner_top_left, this.canvas_corner_bottom_left, bottomLeft, bottomRight)
        || is_segments_intersection(this.canvas_corner_bottom_right, this.canvas_corner_top_right, topLeft, topRight)
        || is_segments_intersection(this.canvas_corner_bottom_right, this.canvas_corner_top_right, bottomLeft, bottomRight)){
            return true;
        }

        return false;
    }

    isClickOver (pos: CanvasCoord): boolean{
        return this.canvas_corner_bottom_left.x <= pos.x &&
            pos.x <= this.canvas_corner_top_right.x && 
            this.canvas_corner_top_right.y <= pos.y && 
            pos.y <= this.canvas_corner_bottom_left.y;
    }

    isNearby (pos: CanvasCoord, d: number){

        return this.canvas_corner_bottom_left.x <= pos.x && pos.x <= this.canvas_corner_bottom_right.x && this.canvas_corner_top_left.y <= pos.y && pos.y <= this.canvas_corner_bottom_right.y;

    }

    translate (cshift: CanvasVect){
        this.center.x += cshift.x;
        this.center.y += cshift.y;

        this.canvas_corner_bottom_left.translate_by_canvas_vect(cshift);
        this.canvas_corner_bottom_right.translate_by_canvas_vect(cshift);
        this.canvas_corner_top_left.translate_by_canvas_vect(cshift);
        this.canvas_corner_top_right.translate_by_canvas_vect(cshift);


        this.shape.setAttribute("x", this.canvas_corner_top_left.x.toString());
        this.shape.setAttribute("y", this.canvas_corner_top_left.y.toString())
        this.shape.setAttribute("width", (this.canvas_corner_bottom_right.x - this.canvas_corner_bottom_left.x).toString());
        this.shape.setAttribute("height", (this.canvas_corner_bottom_right.y - this.canvas_corner_top_left.y).toString());
    }

    select(){
        console.log("select shape")
        this.shape.classList.add("selected")
        this.shape.classList.remove("deselected")
        this.isSelected = true;
        this.shape.style.animation = "selectShape 0.5s ease-out forwards";
    }


    deselect(){
        this.shape.classList.remove("selected")
        this.shape.classList.add("deselected")
        this.isSelected = false;
        this.shape.style.animation = "deselectShape 0.5s ease-out forwards";
    }
}