import { BasicLink, BasicLinkData, Coord, Option, ORIENTATION, Vect } from "gramoloss";
import { ClientBoard, INDEX_TYPE, VERTEX_RADIUS } from "./board";
import { Camera } from "./display/camera";
import { CanvasVect } from "./display/canvasVect";
import { ClientVertex, ClientVertexData } from "./vertex";
import { CanvasCoord } from "./display/canvas_coord";
import { updateWeightDiv } from "./weightable";
import { Color, getCanvasColor } from "./display/colors_v2";
import { rgbTikzFromHexaColor } from "../tikz";
import { drawCircle, drawHead } from "./display/draw_basics";
import { DOWN_TYPE } from "../interactors/interactor";


export class LinkPreData extends BasicLinkData {
    startIndex: number;
    endIndex: number;
    orientation: ORIENTATION;

    constructor(startIndex: number, endIndex: number, orientation: ORIENTATION, weight: string, color: Color){
        super(undefined, weight, color);
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.orientation = orientation;
    }
}

export class ClientLinkData extends BasicLinkData {
    color: Color;
    cp_canvas_pos: CanvasCoord | string;
    is_selected: boolean;
    weightDiv: HTMLDivElement | undefined; // set to null until a non empty weight is used

    constructor(cp: Option<Coord>,  color: Color, weight: string, camera: Camera) {
        super(cp, weight, color);
        this.color = color;
        if (typeof cp == "undefined"){
            this.cp_canvas_pos = "";
        } else {
            this.cp_canvas_pos = camera.create_canvas_coord(cp);
        }
        this.is_selected = false;
        this.weightDiv = undefined;
    }
}




export class ClientLink extends BasicLink<ClientVertexData, ClientLinkData> {
    startVertex: ClientVertex;
    endVertex: ClientVertex;
    board: ClientBoard;

    constructor(index: number, startVertex: ClientVertex, endVertex: ClientVertex, orientation: ORIENTATION, linkData: ClientLinkData, board: ClientBoard){
        super(index, startVertex, endVertex, orientation, linkData);
        this.startVertex = startVertex;
        this.endVertex = endVertex;
        this.board = board;

        updateWeightDiv(this, board);
    }

   
    /**
     * Return true if the position is at distance <= 10 (?) from the curve
     */
    isPosNear(pos: CanvasCoord): boolean {
        const linkCpCanvas = this.data.cp_canvas_pos;
        const vCanvasPos = this.startVertex.data.canvas_pos;
        const wCanvasPos = this.endVertex.data.canvas_pos
        if (typeof linkCpCanvas != "string"){
            return pos.is_nearby_beziers_1cp(vCanvasPos, linkCpCanvas, wCanvasPos);
        }
        else {
            // OPT dont need beziers as it is a straight line
            const middle = vCanvasPos.middle(wCanvasPos);
            return pos.is_nearby_beziers_1cp(vCanvasPos, middle, wCanvasPos);
        }
    }


    set_cp(new_cp: Coord, camera: Camera){
        this.data.cp = new_cp;
        this.data.cp_canvas_pos = camera.create_canvas_coord(new_cp);
    }

    is_in_rect(c1: CanvasCoord, c2: CanvasCoord) {
        //V1: is in rect if one of its extremities is in the rectangle
        //TODO: be more clever and select also when there is an intersection between the edge and the rectangle
        return this.startVertex.is_in_rect(c1, c2) || this.endVertex.is_in_rect(c1, c2);
    }

    update_after_view_modification(camera: Camera){
        if ( typeof this.data.cp != "undefined"){
            this.data.cp_canvas_pos = camera.create_canvas_coord(this.data.cp);
        }
        this.setAutoWeightDivPos();
    }




    /**
     * Set the weight div position according to the element.
     */
    setAutoWeightDivPos(){
        if ( typeof this.data.weightDiv !== "undefined" ){
            const posu = this.startVertex.data.canvas_pos; 
            const posv = this.endVertex.data.canvas_pos; 
            const middle = (typeof this.data.cp_canvas_pos != "string") ? this.data.cp_canvas_pos: posu.middle(posv);
            const weightPosition = middle.add(posu.sub(posv).normalize().rotate_quarter().scale(14));

            this.data.weightDiv.style.top = String(weightPosition.y - this.data.weightDiv.clientHeight*3/4) + "px";
            this.data.weightDiv.style.left = String(weightPosition.x- this.data.weightDiv.clientWidth/2) + "px";
        }
    }

    

  


    translate_cp_by_canvas_vect(shift: CanvasVect, camera: Camera){
            if ( typeof this.data.cp != "undefined" && typeof this.data.cp_canvas_pos != "string"){
                this.data.cp_canvas_pos.translate_by_canvas_vect(shift);
                this.data.cp.x += shift.x/camera.zoom; 
                this.data.cp.y += shift.y/camera.zoom;
            }
    }

    /**
     * TODO: ORIENTED CASE
     * @returns 
     */
    getTikz() {
        let labelCode = "";
        // if (showLabels)
        if ( typeof this.data.weightDiv != "undefined" ){
            // labelCode = "node[midway, shift={(" + this.data.weightDiv.offsetLeft / 100 + "," + - this.data.weightDiv.offsetTop / 100 + ")}, scale = \\scaleE] {" + this.data.weight + "}";
        }

        const arrowTikz =  (this.orientation == ORIENTATION.DIRECTED) ? "[->,>=latex]" : "";

        const start = this.startVertex;
        const end = this.endVertex;

        const weightTikz = (this.data.weight == "") ? "" :  `node[scale=\\scaleL, fill=${this.data.color}, text=white] {${this.data.weight}}`;

        const cpTikz = (typeof this.data.cp != "undefined" ) ? `.. controls (${Math.round(this.data.cp.x)/100}, ${Math.round(this.data.cp.y)/100}) ..`: "--";
        return `\\draw${arrowTikz}[line width = \\scaleE, color = ${this.data.color}] (${start.getTikzCoordVar()}) ${cpTikz} ${weightTikz} (${end.getTikzCoordVar()}) ${labelCode};`;
    }

    /**
     * Sets the weight of the link, then updates the WeightDiv.
     */
    setWeight(newWeight: string) {
        console.log("set weight link")
        this.data.weight = newWeight;
        updateWeightDiv(this, this.board);
    }

    getIndex(): number{
        return this.index;
    }

    getWeight(): string{
        return this.data.weight;
    }


    setWeightDiv(div: HTMLDivElement){
        this.data.weightDiv = div;
    }





    translateByServerVect(shift: Vect, camera: Camera) {
        if (typeof this.data.cp !== "undefined" && typeof this.data.cp_canvas_pos !== "string"){
            const canvas_shift = camera.create_canvas_vect(shift);
            this.data.cp_canvas_pos.translate_by_canvas_vect(canvas_shift);
            this.data.cp.x += shift.x;
            this.data.cp.y += shift.y;
            // TODO: something with the weight_div
        }
    }


    draw(board: ClientBoard){
        const u = this.startVertex;
        const v = this.endVertex;

        const posu = u.data.canvas_pos; 
        const posv = v.data.canvas_pos; 
        const poscp = this.data.cp_canvas_pos;
        const color = getCanvasColor(this.data.color, this.board.isDarkMode());

        const isMouseOver = (this.board.elementOver instanceof ClientLink && this.board.elementOver.index == this.index);

        if (this.data.is_selected || isMouseOver) {
            board.ctx.strokeStyle = color;
            if (isMouseOver){
                board.ctx.globalAlpha = 0.5;
            }
            board.ctx.beginPath();
            board.ctx.moveTo(posu.x, posu.y);
            board.ctx.lineWidth = 8;
            if (isMouseOver){
                board.ctx.lineWidth = 12;
            }

            if ( typeof poscp == "string"){
                board.ctx.lineTo(posv.x, posv.y);
            }else {
                board.ctx.quadraticCurveTo(poscp.x, poscp.y, posv.x, posv.y);
                //board.ctx.bezierCurveTo(poscp.x, poscp.y, poscp.x, poscp.y, posv.x, posv.y);
            }
            board.ctx.stroke();
            board.ctx.globalAlpha = 1;
        }

        board.ctx.beginPath();
        board.ctx.moveTo(posu.x, posu.y);
        board.ctx.strokeStyle = color;
        board.ctx.lineWidth = 3;
        if ( typeof poscp == "string"){
            board.ctx.lineTo(posv.x, posv.y);
        }else {
            board.ctx.quadraticCurveTo(poscp.x, poscp.y, posv.x, posv.y);
            //board.ctx.bezierCurveTo(poscp.x, poscp.y, poscp.x, poscp.y, posv.x, posv.y);
        }
        board.ctx.stroke();

        
    if (typeof poscp != "string"){
            if ( typeof this.board.interactorLoaded != "undefined" && this.board.interactorLoaded.interactable_element_type.has(DOWN_TYPE.CONTROL_POINT)){
                drawCircle(poscp, "grey", 4, 1, board.ctx);
            }
        }
        if (this.orientation == ORIENTATION.DIRECTED) {
            let cp = posu.middle(posv);
            if (typeof poscp != "string"){
                cp = poscp
            }
            drawHead(board.ctx, cp, posv, (this.board.getIndexType() != INDEX_TYPE.NONE) ? 2*VERTEX_RADIUS : VERTEX_RADIUS  );
        }
    }

}
