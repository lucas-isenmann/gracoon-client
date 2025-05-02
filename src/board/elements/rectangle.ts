import { Coord } from "gramoloss";
import { BoardElementType, ClientBoard } from "../board";
import { CanvasCoord } from "../display/canvas_coord";
import { CanvasVect } from "../display/canvasVect";
import { Color, getCanvasColor } from "../display/colors_v2";
import { BoardElement } from "../element";

export class Rectangle implements BoardElement {
    cameraCenter: CanvasCoord = new CanvasCoord(0,0);
    serverCenter: Coord = new Coord(0,0);
    serverId: number = 0;
    boardElementType: BoardElementType = BoardElementType.Local;
    color: Color = Color.Red;
    isSelected: boolean = false;

    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x: number;
    y: number;
    width: number;
    height: number;

    board: ClientBoard;
    svg: SVGRectElement;
    

    constructor(board: ClientBoard, pos: CanvasCoord, pos2: CanvasCoord, color: Color) {
        this.board = board;
        this.cameraCenter.copy_from(pos);
        board.camera.setFromCanvas(this.serverCenter, pos);
        this.color = color;
        this.x1 = pos.x;
        this.y1 = pos.y;
        this.x2 = pos2.x;
        this.y2 = pos2.y;
        this.x = Math.min(this.x1, this.x2);
        this.y = Math.min(this.y1, this.y2);
        this.width = Math.max(this.x1, this.x2) - this.x;
        this.height = Math.max(this.y1, this.y2) - this.y;


        // Create the rect svg
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        board.svgContainer.appendChild(this.svg);
        this.svg.setAttribute("stroke", getCanvasColor(this.color, board.isDarkMode()));
        this.svg.setAttribute("stroke-width", "2");
        this.svg.style.transformBox = "fill-box";
        this.svg.setAttribute("fill", getCanvasColor(this.color, board.isDarkMode()));
        this.svg.setAttribute("fill-opacity", "0.1")
        this.updateSvgPos();
    }

    updateSvgPos(){
        this.x = Math.min(this.x1, this.x2);
        this.y = Math.min(this.y1, this.y2);
        this.width = Math.max(this.x1, this.x2) - this.x;
        this.height = Math.max(this.y1, this.y2) - this.y;
        this.svg.setAttribute("x", this.x.toString());
        this.svg.setAttribute("y", this.y.toString())
        this.svg.setAttribute("width", this.width.toString());
        this.svg.setAttribute("height", this.height.toString());
    }

    hide() {
        this.svg.style.display = "none";
    }

    show() {
        this.svg.style.display = "block";
    }

    delete() {
        this.svg.remove();
    }

    setStartPoint(c1: CanvasCoord){
        this.x1 = c1.x;
        this.y1 = c1.y;
        this.updateSvgPos();
    }

    setEndPoint(c2: CanvasCoord){
        this.x2 = c2.x;
        this.y2 = c2.y;
        this.updateSvgPos();
    }

    updateAfterCameraChange(){
        
    }

    setColor(color: Color) {
        this.color = color;
        this.svg.setAttribute("stroke", getCanvasColor(this.color, this.board.isDarkMode())); // Use provided color instead of hardcoded red
    }

    select() { }

    deselect() {    }
    
    isInRect(corner1: CanvasCoord, corner2: CanvasCoord){
        return false;
    }

    isNearby(pos: CanvasCoord, d: number){
        return false;
    }

    translate(cshift: CanvasVect){
    }

}