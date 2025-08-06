import { ORIENTATION } from "gramoloss";
import { Color, getCanvasColor } from "../display/colors_v2";
import { BoardElement } from "./element";
import katex from "katex";
import { BoardElementType, ClientBoard } from "../board";
import { CanvasCoord } from "../display/canvas_coord";
import { CanvasVect } from "../display/canvasVect";
import { BoardVertex } from "./vertex";

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
    startVertex: BoardVertex;
    endVertex: BoardVertex;
    line: SVGLineElement;
    isDirected: boolean;
    board: ClientBoard;
    highlight: number | undefined;

    label: string = "";
    labelSVG: SVGForeignObjectElement;
    


    constructor(board: ClientBoard, serverId: number, startVertex: BoardVertex, endVertex: BoardVertex, directed: boolean, label: string, color: Color){
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


