import { Coord } from "gramoloss";
import { BoardElementType, ClientBoard } from "../board";
import { CanvasCoord } from "../display/canvas_coord";
import { CanvasVect } from "../display/canvasVect";
import { Color, getCanvasColor } from "../display/colors_v2";
import { BoardElement } from "./element";

export class LocalPoint implements BoardElement {
    cameraCenter: CanvasCoord;
    serverId: number = 0;
    boardElementType: BoardElementType = BoardElementType.Local;
    color: Color = Color.Red;
    isSelected: boolean = false;

    board: ClientBoard;
    disk: SVGCircleElement;
    

    constructor(board: ClientBoard, pos: CanvasCoord) {
        this.board = board;
        this.cameraCenter = pos;
        this.color = board.colorSelected;

        // Create the disk svg
        this.disk = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        board.svgContainer.appendChild(this.disk);
        this.disk.setAttribute("cx", `${pos.x}`);    // Center x coordinate
        this.disk.setAttribute("cy", `${pos.y}`);    // Center y coordinate
        this.disk.setAttribute("r", "5");     // Radius
        this.disk.setAttribute("fill", getCanvasColor(this.color, board.isDarkMode())); // Use provided color instead of hardcoded red
        this.disk.style.transformBox = "fill-box";
    }

    hide() {
        this.disk.style.display = "none";
    }

    show() {
        this.disk.style.display = "block";
    }

    delete() {
        this.disk.remove();
    }

    setCanvasPos(pos: CanvasCoord){
        this.cameraCenter.setLocalPos(pos.x, pos.y);
        this.disk.setAttribute("cx", `${this.cameraCenter.x}`);  
        this.disk.setAttribute("cy", `${this.cameraCenter.y}`);  
    }

    updateAfterCameraChange(){
        this.cameraCenter.updateAfterCameraChange();

        this.disk.setAttribute("cx", `${this.cameraCenter.x}`);  
        this.disk.setAttribute("cy", `${this.cameraCenter.y}`);  
    }

    setColor(color: Color) {
        this.color = color;
        this.disk.setAttribute("fill", getCanvasColor(this.color, this.board.isDarkMode())); // Use provided color instead of hardcoded red
    }

    select() {
    }
    deselect() {

    }
    isInRect(corner1: CanvasCoord, corner2: CanvasCoord){
        return false;
    }

    isNearby(pos: CanvasCoord, d: number){
        return this.cameraCenter.dist(pos) <= d;
    }

    translate(cshift: CanvasVect){
        this.cameraCenter.translateByCanvasVect(cshift);
        this.disk.setAttribute("cx", `${this.cameraCenter.x}`);  
        this.disk.setAttribute("cy", `${this.cameraCenter.y}`);  
    }

}