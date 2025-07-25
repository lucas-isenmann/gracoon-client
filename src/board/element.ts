import { CanvasCoord } from "./display/canvas_coord";
import { Color, getCanvasColor } from "./display/colors_v2";
import { BoardElementType, ClientBoard } from "./board";
import { CanvasVect } from "./display/canvasVect";
import { Coord, is_segments_intersection, ORIENTATION, Vect } from "gramoloss";
import katex from "katex";
import { highlightColors } from "./display/highlight_colors";


export interface BoardElement {
    cameraCenter: CanvasCoord;
    // serverCenter: Coord; // à virer
    serverId: number;
    boardElementType: BoardElementType;
    delete: () => void;

    updateAfterCameraChange: () => void;
    
    setColor: (color: Color) => void;
    color: Color;

    translate: (cshift: CanvasVect) => void;

    isSelected: boolean;
    select: () => void;
    deselect: () => void;

    isInRect: (corner1: CanvasCoord, corner2: CanvasCoord) => boolean;
    isNearby: (pos: CanvasCoord, d: number) => boolean;
}




export class VertexPreData {
    pos: Coord;
    color: Color;
    weight: string;

    constructor(pos: Coord, color: Color, weight: string){
        this.pos = pos;
        this.color = color;
        this.weight = weight;
    }
}



export class VertexElement implements BoardElement {

    cameraCenter: CanvasCoord;
    // serverCenter: Coord;
    id: number;
    serverId: number;
    boardElementType: BoardElementType = BoardElementType.Vertex;
    color: Color;
    isSelected: boolean = false;
    disk: SVGCircleElement;
    board: ClientBoard;
    highlight: number | undefined;

    posBeforeRotate: Coord =new Coord(0,0);
    innerLabel: string;
    outerLabel: string;
    innerLabelSVG: SVGForeignObjectElement;

    constructor(board: ClientBoard, id: number, x: number, y: number, innerLabel: string, outerLabel: string, color: Color){
        this.id = board.elementCounter;
        this.cameraCenter = CanvasCoord.fromCoord(new Coord(x,y), board.camera);
        // this.serverCenter = this.cameraCenter.serverPos;
        // this.cameraCenter = board.camera.create_canvas_coord(this.serverCenter);
        this.color = color;
        this.serverId = id;
        this.board = board;

        this.innerLabel = innerLabel;
        this.outerLabel = outerLabel;
        
        // Create circle element
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        board.verticesGroup.appendChild(circle);
        
        // Set circle attributes
        circle.setAttribute("cx", `${this.cameraCenter.x}`);    // Center x coordinate
        circle.setAttribute("cy", `${this.cameraCenter.y}`);    // Center y coordinate
        circle.setAttribute("r", "5");     // Radius
        circle.setAttribute("fill", getCanvasColor(this.color, board.isDarkMode())); // Use provided color instead of hardcoded red
        circle.style.transformBox = "fill-box";
        
        // circle.style.animation = "vertexCreate 0.5s ease-out forwards";
        this.disk = circle;
        this.disk.classList.add("vertex");

        // InnerLabel
        const innerLabelSVG = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        board.verticesGroup.appendChild(innerLabelSVG);
        innerLabelSVG.setAttribute("x", `${this.cameraCenter.x-25}`);
        innerLabelSVG.setAttribute("y", `${this.cameraCenter.y-12}`);
        innerLabelSVG.setAttribute("width", "50px");
        innerLabelSVG.setAttribute("height", "3em");
        innerLabelSVG.innerHTML = this.serverId.toString()
        innerLabelSVG.classList.add("vertex-inner-label")
        this.innerLabelSVG = innerLabelSVG;

        board.elements.set(this.id, this);
        board.elementCounter += 1;

        board.resetGraph() 
    }


    setInnerLabel(value: string) {
        console.log("setInnerLabel", this.innerLabel, this.outerLabel)
        this.innerLabel = value;
        console.log("done", this.innerLabel, this.outerLabel)

        this.innerLabelSVG.innerHTML = katex.renderToString(value);
    }

    updateSVGposition(){
        this.disk.setAttribute("cx", `${this.cameraCenter.x}`);  
        this.disk.setAttribute("cy", `${this.cameraCenter.y}`);   
        this.innerLabelSVG.setAttribute("x", `${this.cameraCenter.x-25}`);
        this.innerLabelSVG.setAttribute("y", `${this.cameraCenter.y-12}`);
    }

    updateAfterCameraChange() {
        this.cameraCenter.updateAfterCameraChange();
        this.updateSVGposition();
    }

    setHighlight(value: number){
        this.highlight = value;
        this.disk.classList.add("highlight");
        this.disk.setAttribute("stroke", highlightColors[value]);
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
        this.innerLabelSVG.remove();
    }

    isNearby (pos: CanvasCoord, d: number) {
        return pos.dist(this.cameraCenter) <= d 
    }

    isInRect (corner1: CanvasCoord, corner2: CanvasCoord) : boolean  {
        return this.cameraCenter.isInRect(corner1, corner2);
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

    startRotate(){
        this.posBeforeRotate.copy_from(this.cameraCenter.serverPos)
    }

    setAngle(center: Coord, angle: number){
        this.cameraCenter.setServerPos( 
            center.x + (this.posBeforeRotate.x - center.x) * Math.cos(angle) - (this.posBeforeRotate.y - center.y) * Math.sin(angle), 
            center.y + (this.posBeforeRotate.x - center.x) * Math.sin(angle) + (this.posBeforeRotate.y - center.y) * Math.cos(angle))

        this.updateSVGposition();
        this.updateIncidentLinks();
    }

    applyScale(center: Coord, ratio: number){
        this.cameraCenter.setServerPos(
            center.x + (this.posBeforeRotate.x - center.x) * ratio,
            center.y + (this.posBeforeRotate.y - center.y) * ratio
        )

        this.updateSVGposition();
        this.updateIncidentLinks();
    }

    updateIncidentLinks(){
        for (const element of this.board.elements.values()){
            if (element instanceof LinkElement){
                const link = element;
                if ( link.startVertex.serverId == this.serverId){
                    link.line.setAttribute("x1", this.cameraCenter.x.toString())
                    link.line.setAttribute("y1", this.cameraCenter.y.toString())
                    link.updateExtremities();
                }
                if ( link.endVertex.serverId == this.serverId){
                    link.line.setAttribute("x2", this.cameraCenter.x.toString())
                    link.line.setAttribute("y2", this.cameraCenter.y.toString())
                    link.updateExtremities();
                }
            }
        }
    }

    translate (cshift: CanvasVect){
        this.cameraCenter.translateByCanvasVect(cshift)
        // this.cameraCenter.x += cshift.x;
        // this.cameraCenter.y += cshift.y;

        // this.board.camera.setFromCanvas( this.serverCenter, this.cameraCenter)
        this.updateSVGposition();
        this.updateIncidentLinks();
        
    }
}




export class LinkPreData {
    startIndex: number;
    endIndex: number;
    orientation: ORIENTATION;
    weight: string;
    color: Color;

    constructor(startIndex: number, endIndex: number, orientation: ORIENTATION, weight: string, color: Color){
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.orientation = orientation;
        this.color = color;
        this.weight = weight;
    }
}



export class LinkElement implements BoardElement {
    cameraCenter: CanvasCoord;
    // serverCenter: Coord;
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

    label: string = "";
    labelSVG: SVGForeignObjectElement;
    


    constructor(board: ClientBoard, serverId: number, startVertex: VertexElement, endVertex: VertexElement, directed: boolean, label: string, color: Color){
        this.id = board.elementCounter;
        this.cameraCenter = new CanvasCoord(0,0, board.camera);
        this.color = color;
        this.boardElementType = BoardElementType.Link;
        this.serverId = serverId;
        this.startVertex = startVertex;
        this.endVertex = endVertex;
        this.isDirected = directed;

        
        this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        board.linksGroup.appendChild(this.line);

        // Set line attributes
        this.line.setAttribute("x1", startVertex.cameraCenter.x.toString());
        this.line.setAttribute("y1", startVertex.cameraCenter.y.toString());
        this.line.setAttribute("x2", endVertex.cameraCenter.x.toString());
        this.line.setAttribute("y2", endVertex.cameraCenter.y.toString());
        this.line.setAttribute("stroke", getCanvasColor(this.color, board.isDarkMode()));
        this.line.setAttribute("stroke-width", "2");
        this.line.classList.add("link")
        this.line.style.transformBox = "fill-box";

        if (this.isDirected) {
            const markerId = `arrow-head-${this.color}`;
            this.line.setAttribute("marker-end", `url(#${markerId})`);
        }

        
        this.cameraCenter.setLocalPos( (startVertex.cameraCenter.x + endVertex.cameraCenter.x)/2, (startVertex.cameraCenter.y + endVertex.cameraCenter.y)/2  );

       

        // InnerLabel
        const innerLabelSVG = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
        board.linksGroup.appendChild(innerLabelSVG);
        innerLabelSVG.setAttribute("x", `${this.cameraCenter.x}`);
        innerLabelSVG.setAttribute("y", `${this.cameraCenter.y}`);
        innerLabelSVG.setAttribute("width", "50px");
        innerLabelSVG.setAttribute("height", "3em");
        innerLabelSVG.textContent = this.label;
        innerLabelSVG.classList.add("link-label");
        this.labelSVG = innerLabelSVG;

    


        board.elements.set(this.id, this);
        board.elementCounter += 1;
        this.board = board;

        board.resetGraph() 
    }

    updateExtremities(){
        this.cameraCenter.setLocalPos( (this.startVertex.cameraCenter.x + this.endVertex.cameraCenter.x)/2, (this.startVertex.cameraCenter.y + this.endVertex.cameraCenter.y)/2  );
        this.updateSVGposition();
    }

    updateSVGposition(){
        this.labelSVG.setAttribute("x", `${this.cameraCenter.x}`);
        this.labelSVG.setAttribute("y", `${this.cameraCenter.y}`);
    }

    setLabel(value: string) {
        this.label = value;
        this.labelSVG.innerHTML = katex.renderToString(this.label);
    }

    updateAfterCameraChange() {
        this.cameraCenter.updateAfterCameraChange();

        this.line.setAttribute("x1", this.startVertex.cameraCenter.x.toString());
        this.line.setAttribute("y1", this.startVertex.cameraCenter.y.toString());
        this.line.setAttribute("x2", this.endVertex.cameraCenter.x.toString());
        this.line.setAttribute("y2", this.endVertex.cameraCenter.y.toString());

        this.updateSVGposition();
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
        const v = this.startVertex;
        const w = this.endVertex;

        return pos.distToSegment(v.cameraCenter, w.cameraCenter) <= d;
        


        // const middle = v.cameraCenter.middle(w.cameraCenter)
        // pos.is_nearby_beziers_1cp(v.cameraCenter, middle, w.cameraCenter)

        // const linkcp_canvas = this.cp_canvas_pos;
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


        return pos.dist(this.cameraCenter) <= d
    }

    translate (cshift: CanvasVect){

    }

    select(){
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
    cameraCenter: CanvasCoord;
    id: number;
    serverId: number;
    boardElementType: BoardElementType;
    color: Color;
    isSelected: boolean = false;
    board: ClientBoard;

    shape: SVGRectElement;

    canvasCornerTopLeft : CanvasCoord;
    canvasCornerBottomLeft : CanvasCoord;
    canvasCornerBottomRight : CanvasCoord;
    canvasCornerTopRight : CanvasCoord;
    canvasC1: CanvasCoord;
    canvasC2: CanvasCoord;
    


    constructor(board: ClientBoard, serverId: number, c1: Coord, c2: Coord, color: Color){
        this.id = board.elementCounter;
        this.color = color;
        this.boardElementType = BoardElementType.Rectangle;
        this.serverId = serverId;


        this.canvasC1 = CanvasCoord.fromCoord(c1, board.camera)
        this.canvasC2 = CanvasCoord.fromCoord(c2, board.camera)


        this.canvasCornerBottomLeft = new CanvasCoord(Math.min(this.canvasC1.x, this.canvasC2.x), Math.max(this.canvasC1.y, this.canvasC2.y), board.camera);
        this.canvasCornerBottomRight = new CanvasCoord(Math.max(this.canvasC1.x, this.canvasC2.x), Math.max(this.canvasC1.y, this.canvasC2.y), board.camera);
        this.canvasCornerTopLeft = new CanvasCoord(Math.min(this.canvasC1.x, this.canvasC2.x), Math.min(this.canvasC1.y, this.canvasC2.y), board.camera);
        this.canvasCornerTopRight = new CanvasCoord(Math.max(this.canvasC1.x, this.canvasC2.x), Math.min(this.canvasC1.y, this.canvasC2.y), board.camera);

        
        this.shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        board.shapesGroup.appendChild(this.shape);

        // Set SVG Element attributes
        this.shape.setAttribute("x", this.canvasCornerTopLeft.x.toString());
        this.shape.setAttribute("y", this.canvasCornerTopLeft.y.toString())
        this.shape.setAttribute("width", (this.canvasCornerBottomRight.x - this.canvasCornerBottomLeft.x).toString());
        this.shape.setAttribute("height", (this.canvasCornerBottomRight.y - this.canvasCornerTopLeft.y).toString());
        this.shape.setAttribute("stroke", getCanvasColor(this.color, board.isDarkMode()));
        this.shape.setAttribute("stroke-width", "2");
        this.shape.setAttribute("fill", getCanvasColor(this.color, board.isDarkMode()));
        this.shape.setAttribute("fill-opacity", "0.1")
        this.shape.classList.add("shape", "deselected")
        this.shape.style.transformBox = "fill-box";

        


        this.cameraCenter = new CanvasCoord( (this.canvasC1.x + this.canvasC2.x)/2, (this.canvasC1.y + this.canvasC2.y)/2, board.camera);

        board.elements.set(this.id, this);
        board.elementCounter += 1;
        this.board = board;
    }

    private updateCanvasCorner(){
        this.canvasCornerTopRight.x = Math.max(this.canvasC1.x, this.canvasC2.x);
        this.canvasCornerTopRight.y = Math.min(this.canvasC1.y, this.canvasC2.y);
        this.canvasCornerTopLeft.x = Math.min(this.canvasC1.x, this.canvasC2.x);
        this.canvasCornerTopLeft.y = Math.min(this.canvasC1.y, this.canvasC2.y);
        this.canvasCornerBottomRight.x = Math.max(this.canvasC1.x, this.canvasC2.x);
        this.canvasCornerBottomRight.y = Math.max(this.canvasC1.y, this.canvasC2.y);
        this.canvasCornerBottomLeft.x = Math.min(this.canvasC1.x, this.canvasC2.x);
        this.canvasCornerBottomLeft.y = Math.max(this.canvasC1.y, this.canvasC2.y);

        this.shape.setAttribute("x", this.canvasCornerTopLeft.x.toString());
        this.shape.setAttribute("y", this.canvasCornerTopLeft.y.toString())
        this.shape.setAttribute("width", (this.canvasCornerBottomRight.x - this.canvasCornerBottomLeft.x).toString());
        this.shape.setAttribute("height", (this.canvasCornerBottomRight.y - this.canvasCornerTopLeft.y).toString());
    }

    updateAfterCameraChange() {
        this.canvasC1.updateAfterCameraChange();
        this.canvasC2.updateAfterCameraChange();
        this.cameraCenter.updateAfterCameraChange();

        this.updateCanvasCorner();
    }

    delete(){
        this.shape.remove();
    }

    setCorners(c1: Coord, c2: Coord){

        this.canvasC1.setServerPos(c1.x, c1.y);
        this.canvasC2.setServerPos(c2.x, c2.y);
        this.cameraCenter.setServerPos((c1.x + c2.x)/2, (c1.y+ c2.y)/2);

        // this.serverCenter.x = (c1.x + c2.x)/2;
        // this.serverCenter.y = (c1.y + c2.y)/2;

        // this.cameraCenter.setFromCoord(this.serverCenter, this.board.camera);
        // this.canvasC1.setFromCoord(this.c1, this.board.camera);
        // this.canvasC2.setFromCoord(this.c2, this.board.camera);

        this.updateCanvasCorner();
    }

    setColor (color: Color) {
        this.color = color;
        this.shape.setAttribute("stroke", getCanvasColor(this.color, this.board.isDarkMode()));
        this.shape.setAttribute("fill", getCanvasColor(this.color, this.board.isDarkMode()));
    }

   
    isInRect(c1: CanvasCoord, c2: CanvasCoord): boolean {
        
        const topLeft = new CanvasCoord(Math.min(c1.x, c2.x), Math.min(c1.y, c2.y), this.board.camera);
        const topRight = new CanvasCoord(Math.max(c1.x, c2.x), Math.min(c1.y, c2.y), this.board.camera);
        const bottomLeft = new CanvasCoord(Math.min(c1.x, c2.x), Math.max(c1.y, c2.y), this.board.camera);
        const bottomRight = new CanvasCoord(Math.max(c1.x, c2.x), Math.max(c1.y, c2.y), this.board.camera);
        if (topLeft.isInRect(this.canvasCornerTopLeft, this.canvasCornerBottomRight) || topRight.isInRect(this.canvasCornerTopLeft, this.canvasCornerBottomRight) || bottomLeft.isInRect(this.canvasCornerTopLeft, this.canvasCornerBottomRight) || bottomRight.isInRect(this.canvasCornerTopLeft, this.canvasCornerBottomRight)){
            return true;
        }

        if (this.canvasCornerBottomLeft.isInRect(c1,c2)
        || this.canvasCornerBottomRight.isInRect(c1,c2)
        || this.canvasCornerTopLeft.isInRect(c1,c2)
        || this.canvasCornerTopRight.isInRect(c1,c2) ){
            return true;
        }

        if (is_segments_intersection(this.canvasCornerTopLeft.serverPos, this.canvasCornerTopRight.serverPos, topLeft.serverPos, bottomLeft.serverPos)
        || is_segments_intersection(this.canvasCornerTopLeft.serverPos, this.canvasCornerTopRight.serverPos, topRight.serverPos, bottomRight.serverPos)
        || is_segments_intersection(this.canvasCornerBottomLeft.serverPos, this.canvasCornerBottomRight.serverPos, topLeft.serverPos, bottomLeft.serverPos)
        || is_segments_intersection(this.canvasCornerBottomLeft.serverPos, this.canvasCornerBottomRight.serverPos, topRight.serverPos, bottomRight.serverPos)){
            return true;
        }

        if (is_segments_intersection(this.canvasCornerTopLeft.serverPos, this.canvasCornerBottomLeft.serverPos, topLeft.serverPos, topRight.serverPos)
        || is_segments_intersection(this.canvasCornerTopLeft.serverPos, this.canvasCornerBottomLeft.serverPos, bottomLeft.serverPos, bottomRight.serverPos)
        || is_segments_intersection(this.canvasCornerBottomRight.serverPos, this.canvasCornerTopRight.serverPos, topLeft.serverPos, topRight.serverPos)
        || is_segments_intersection(this.canvasCornerBottomRight.serverPos, this.canvasCornerTopRight.serverPos, bottomLeft.serverPos, bottomRight.serverPos)){
            return true;
        }

        return false;
    }

    isClickOver (pos: CanvasCoord): boolean{
        return this.canvasCornerBottomLeft.x <= pos.x &&
            pos.x <= this.canvasCornerTopRight.x && 
            this.canvasCornerTopRight.y <= pos.y && 
            pos.y <= this.canvasCornerBottomLeft.y;
    }

    isNearby (pos: CanvasCoord, d: number): boolean{

        return this.canvasCornerBottomLeft.x <= pos.x && pos.x <= this.canvasCornerBottomRight.x && this.canvasCornerTopLeft.y <= pos.y && pos.y <= this.canvasCornerBottomRight.y;

    }

    translate (cshift: CanvasVect){
        this.cameraCenter.translateByCanvasVect(cshift);



        this.canvasC1.translateByCanvasVect(cshift);
        this.canvasC2.translateByCanvasVect(cshift);

        this.canvasCornerBottomLeft.translateByCanvasVect(cshift);
        this.canvasCornerBottomRight.translateByCanvasVect(cshift);
        this.canvasCornerTopLeft.translateByCanvasVect(cshift);
        this.canvasCornerTopRight.translateByCanvasVect(cshift);




        this.shape.setAttribute("x", this.canvasCornerTopLeft.x.toString());
        this.shape.setAttribute("y", this.canvasCornerTopLeft.y.toString())
        this.shape.setAttribute("width", (this.canvasCornerBottomRight.x - this.canvasCornerBottomLeft.x).toString());
        this.shape.setAttribute("height", (this.canvasCornerBottomRight.y - this.canvasCornerTopLeft.y).toString());
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