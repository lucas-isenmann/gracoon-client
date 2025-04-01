import { Coord } from "gramoloss";
import { BoardElementType, ClientBoard } from "../board";
import { CanvasCoord } from "../display/canvas_coord";
import { CanvasVect } from "../display/canvasVect";
import { Color, getCanvasColor } from "../display/colors_v2";
import { BoardElement } from "../element";

export class Segment implements BoardElement {
    cameraCenter: CanvasCoord = new CanvasCoord(0,0);
    serverCenter: Coord = new Coord(0,0);
    serverId: number = 0;
    boardElementType: BoardElementType = BoardElementType.Local;
    color: Color = Color.Red;
    isSelected: boolean = false;

    c1: CanvasCoord = new CanvasCoord(0,0);
    c2: CanvasCoord = new CanvasCoord(0,0);

    board: ClientBoard;
    line: SVGLineElement;
    

    constructor(board: ClientBoard, pos: CanvasCoord, pos2: CanvasCoord, color: Color) {
        this.board = board;
        this.cameraCenter.copy_from(pos);
        board.camera.setFromCanvas(this.serverCenter, pos);
        this.color = board.colorSelected;
        this.c1.copy_from(pos);
        this.c1.copy_from(pos2);

        // Create the line svg
        this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        board.svgContainer.appendChild(this.line);
        this.line.setAttribute("x1", `${this.c1.x}`);  
        this.line.setAttribute("y1", `${this.c1.y}`);  
        this.line.setAttribute("x2", this.c2.x.toString());
        this.line.setAttribute("y2", this.c2.y.toString());
        this.line.setAttribute("stroke", getCanvasColor(this.color, board.isDarkMode()));
        this.line.setAttribute("stroke-width", "2");
        this.line.style.transformBox = "fill-box";
    }

    hide() {
        this.line.style.display = "none";
    }

    show() {
        this.line.style.display = "block";
    }

    delete() {
        this.line.remove();
    }

    setStartPoint(c1: CanvasCoord){
        this.c1.x = c1.x;
        this.c1.y = c1.y;
        this.line.setAttribute("x1", this.c1.x.toString());
        this.line.setAttribute("y1", this.c1.y.toString());
    }

    setEndPoint(c2: CanvasCoord){
        this.c2.x = c2.x;
        this.c2.y = c2.y;
        this.line.setAttribute("x2", this.c2.x.toString());
        this.line.setAttribute("y2", this.c2.y.toString());
    }

    updateAfterCameraChange(){
        
    }

    setColor(color: Color) {
        this.color = color;
        this.line.setAttribute("stroke", getCanvasColor(this.color, this.board.isDarkMode())); // Use provided color instead of hardcoded red
    }

    select() {
    }
    deselect() {

    }
    isInRect(corner1: CanvasCoord, corner2: CanvasCoord){
        return false;
    }

    isNearby(pos: CanvasCoord, d: number){
        return false;
    }

    translate(cshift: CanvasVect){
    }

}