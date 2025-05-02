import { Coord } from "gramoloss";
import { BoardElementType, ClientBoard } from "../board";
import { CanvasCoord } from "../display/canvas_coord";
import { CanvasVect } from "../display/canvasVect";
import { Color, getCanvasColor } from "../display/colors_v2";
import { BoardElement } from "../element";

export class TargetPoint implements BoardElement {
    cameraCenter: CanvasCoord = new CanvasCoord(0,0);
    serverCenter: Coord = new Coord(0,0);
    serverId: number = 0;
    boardElementType: BoardElementType = BoardElementType.Local;
    color: Color = Color.Red;
    isSelected: boolean = false;

    board: ClientBoard;
    disk: SVGCircleElement;
    

    constructor(board: ClientBoard, pos: CanvasCoord) {
        this.board = board;
        this.cameraCenter.copy_from(pos);
        board.camera.setFromCanvas(this.serverCenter, pos);
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
        this.cameraCenter.x = pos.x;
        this.cameraCenter.y = pos.y;
        this.board.camera.setFromCanvas(this.serverCenter, pos)
        this.disk.setAttribute("cx", `${this.cameraCenter.x}`);  
        this.disk.setAttribute("cy", `${this.cameraCenter.y}`);  
    }

    updateAfterCameraChange(){
        this.cameraCenter.setFromCoord(this.serverCenter, this.board.camera);

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
        return this.cameraCenter.is_nearby(pos, d*d);
    }

    translate(cshift: CanvasVect){
        this.cameraCenter.x += cshift.x;
        this.cameraCenter.y += cshift.y;

        this.board.camera.setFromCanvas( this.serverCenter, this.cameraCenter)

        this.disk.setAttribute("cx", `${this.cameraCenter.x}`);  
        this.disk.setAttribute("cy", `${this.cameraCenter.y}`);  
    }

}