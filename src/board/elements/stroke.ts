import { Coord } from "gramoloss";
import { CanvasCoord } from "../display/canvas_coord";
import { BoardElement } from "./element";
import { BoardElementType, ClientBoard } from "../board";
import { Color, getCanvasColor } from "../display/colors_v2";
import { CanvasVect } from "../display/canvasVect";


export class StrokeElement implements BoardElement {
    
    // BoardElement properties
    id: number;
    cameraCenter: CanvasCoord;
    serverId: number;
    boardElementType: BoardElementType = BoardElementType.Stroke;
    color: Color;
    isSelected: boolean = false;
    board: ClientBoard;

    // Specific properties
    canvasPositions: Array<CanvasCoord>;
    serverPositions: Array<Coord>;
    x: number;
    y: number;
    width: number;
    height: number;
    thickness: number;
    svg: SVGElement;

    constructor(board: ClientBoard, color: Color, initialPos: CanvasCoord, thickness: number) {
        this.id = board.elementCounter;
        board.elements.set(this.id, this);
        board.elementCounter += 1;
        this.board = board;
        this.serverId = this.id;
        this.cameraCenter = new CanvasCoord(initialPos.x, initialPos.y, board.camera);


        this.color = color;
        this.canvasPositions = [initialPos.copy()]
        this.serverPositions = [board.camera.createServerCoord(initialPos)]
        this.x = initialPos.x;
        this.y = initialPos.y;
        this.width = 0;
        this.height = 0;
        this.thickness = thickness;

        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.svg.classList.add("stroke");
        board.svgContainer.appendChild(this.svg);
        this.svg.setAttribute("stroke", getCanvasColor(this.color, board.isDarkMode()));
        this.svg.setAttribute("fill", "none")
        this.svg.setAttribute("stroke-width", thickness.toString());
        this.svg.setAttribute("d", `M ${initialPos.x} ${initialPos.y}`)
    }


    push(cpos:CanvasCoord){
        this.canvasPositions.push(cpos);
        this.x = Math.min(cpos.x, this.x);
        this.y = Math.min(cpos.y, this.y);
        this.width = Math.max(this.width, cpos.x - this.x);
        this.height = Math.max(this.height, cpos.y - this.y);

        const serverPos = this.board.camera.createServerCoord(cpos);
        this.serverPositions.push(serverPos);

        this.updatePathData();
        
    }

    updatePathData(){
        // Generate SVG path command
        let pathData = this.canvasPositions.reduce((path, point, index) => {
            const command = index === 0 ? 'M' : 'L';
            return `${path} ${command} ${point.x},${point.y}`;
        }, '');

        // Update SVG path element
        this.svg.setAttribute('d', pathData);
    }

    delete() {
        this.svg.remove();
    }

    updateAfterCameraChange(){
        for (let i = 0; i < this.canvasPositions.length; i ++){
            this.board.camera.setFromServer(this.canvasPositions[i], this.serverPositions[i])
        }
        this.updatePathData();
    }

    setColor(color: Color){
        this.color = color;
        this.svg.setAttribute("stroke", getCanvasColor(this.color, this.board.isDarkMode()));
    }

    translate (cshift: CanvasVect){
        console.log("transalte stroke")
        for (const point of this.canvasPositions){
            point.translateByCanvasVect(cshift);
        }
        this.x += cshift.x;
        this.y += cshift.y;
        this.updatePathData();
    }

    select(){
        this.svg.classList.add("selected");
        this.isSelected = true;
    }

    deselect(){
        this.svg.classList.remove("selected");
        this.isSelected = false;
    }

    isInRect(corner1: CanvasCoord, corner2: CanvasCoord): boolean{
        for (const point of this.canvasPositions){
            if (point.isInRect(corner1, corner2)){
                return true;
            }
        }
        return false;
    }

    isNearby(pos: CanvasCoord, d: number){
        for (let i = 0; i < this.canvasPositions.length-1; i++){
            if(pos.is_nearby_beziers_1cp(this.canvasPositions[i], this.canvasPositions[i].middle(this.canvasPositions[i+1]) , this.canvasPositions[i+1] )){
                return true;
            }
        }
        return false;
    }

}