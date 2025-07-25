import { Coord } from "gramoloss";
import katex from "katex";
import { BoardElementType, ClientBoard } from "../board";
import { CanvasCoord } from "../display/canvas_coord";
import { CanvasVect } from "../display/canvasVect";
import { Color, getCanvasColor } from "../display/colors_v2";
import { highlightColors } from "../display/highlight_colors";
import { BoardElement } from "./element";
import { LinkElement } from "./link";

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
