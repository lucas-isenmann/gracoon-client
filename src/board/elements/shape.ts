import { Coord, is_segments_intersection } from "gramoloss";
import { BoardElementType, ClientBoard } from "../board";
import { CanvasCoord } from "../display/canvas_coord";
import { Color, getCanvasColor } from "../display/colors_v2";
import { BoardElement } from "./element";
import { CanvasVect } from "../display/canvasVect";

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