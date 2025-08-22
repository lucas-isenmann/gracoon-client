import { Coord, Option } from "gramoloss";
import { ClientBoard } from "../board";
import { CanvasCoord } from "../display/canvas_coord";
import { Multicolor } from "../display/multicolor";
import { BoardLocalElement } from "./local_element";


export class Colleague implements BoardLocalElement {
    id: string;
    label: string;
    multicolor: Multicolor;
    canvasPos: CanvasCoord;
    timerRefresh : number; // Date since the last change of position
    idTimeout : number | undefined = undefined; // Id of the time_out to kill when position is changed, "" if empty. 
    
    backgroundRect: SVGElement;
    arrowPath: SVGElement;
    brightSidesPath: SVGElement;

    constructor(id: string, label: string, color: string, board: ClientBoard, pos?: Coord) {
        this.id = id;
        this.label = label;
        this.multicolor = new Multicolor(color);
        if (typeof pos !== 'undefined') {
            this.canvasPos = board.camera.createCanvasCoord(pos);
        } else {
            this.canvasPos = new CanvasCoord(-100, -100, board.camera);
        }
        this.timerRefresh = Date.now();

        // Create the disk svg
        


        // Create SVG container
        // const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // svg.setAttribute("width", "30");  // Adjust based on your needs
        // svg.setAttribute("height", "24"); // Adjust based on your needs

        // Background rectangle
        this.backgroundRect = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.backgroundRect.setAttribute("fill", "none");
        this.backgroundRect.setAttribute("stroke", this.multicolor.darken);
        this.backgroundRect.setAttribute("stroke-width", "1");
        this.backgroundRect.setAttribute("opacity", "0.35");

        // Arrow path
        this.arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.arrowPath.setAttribute("fill", this.multicolor.color);

        // Bright sides path
        this.brightSidesPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.brightSidesPath.setAttribute("fill", "none");
        this.brightSidesPath.setAttribute("stroke", this.multicolor.lighten);
        this.brightSidesPath.setAttribute("stroke-width", "1");

        // Add all elements to SVG
        board.svgContainer.appendChild(this.backgroundRect);
        board.svgContainer.appendChild(this.arrowPath);
        board.svgContainer.appendChild(this.brightSidesPath);

        this.updateSVGPos();

    }


    updateSVGPos(){
        this.backgroundRect.setAttribute("d", `
            M ${this.canvasPos.x - 2},${this.canvasPos.y + 1}
            L ${this.canvasPos.x - 2},${this.canvasPos.y + 21}
            Z
        `);

        this.arrowPath.setAttribute("d", `
            M ${this.canvasPos.x},${this.canvasPos.y}
            L ${this.canvasPos.x + 13},${this.canvasPos.y + 13}
            L ${this.canvasPos.x + 5},${this.canvasPos.y + 13}
            L ${this.canvasPos.x},${this.canvasPos.y + 20}
            Z
        `);

        this.brightSidesPath.setAttribute("d", `
            M ${this.canvasPos.x},${this.canvasPos.y}
            L ${this.canvasPos.x + 13},${this.canvasPos.y + 13}
            L ${this.canvasPos.x + 5},${this.canvasPos.y + 13}
            L ${this.canvasPos.x},${this.canvasPos.y + 20}
            Z
        `);
    }


    setPos(newPos: Option<Coord>, board: ClientBoard) {
        if (typeof newPos == "undefined"){
            this.canvasPos.setLocalPos(-100,-100);
            return;
        }
        if( typeof this.canvasPos == "undefined" || ( this.canvasPos.serverPos.x != newPos.x || this.canvasPos.serverPos.y != newPos.y ) ){ // If the user position is updated
            this.timerRefresh = Date.now();
            if( typeof this.idTimeout !== "undefined"){
                clearTimeout(this.idTimeout); // We clear the current timeout 
                this.idTimeout = undefined;
            }
            // We set a new timeout that starts after 2 seconds. 
            this.idTimeout = setTimeout(() => {
                // We draw the canvas every 100ms
                const interval_id = setInterval(()=>{
                    if(Date.now() - this.timerRefresh > 4000){
                        // The interval kill itself after the user does not move for 4secs 
                        clearInterval(interval_id); 
                    }
                }, 100);
            }, 2000);

            this.canvasPos.setServerPos(newPos.x, newPos.y);
            this.updateSVGPos();
        }
       
    }

    updateAfterCameraChange() {
        this.canvasPos.updateAfterCameraChange();
        this.updateSVGPos();
    }

    delete(){
        this.arrowPath.remove();
        this.backgroundRect.remove();
        this.brightSidesPath.remove();
    }

    setColor(color: string){
        this.multicolor = new Multicolor(color);
        this.backgroundRect.setAttribute("stroke", this.multicolor.darken);
        this.arrowPath.setAttribute("fill", this.multicolor.color);
        this.brightSidesPath.setAttribute("stroke", this.multicolor.lighten);
    }
    
}





