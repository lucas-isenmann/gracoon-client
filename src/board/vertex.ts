import { BasicVertex, BasicVertexData,  Coord, Vect, Vertex } from "gramoloss";
import { drawCircle } from "./display/draw_basics";
import { Camera } from "./display/camera";
import { CanvasVect } from "./display/canvasVect";
import { CanvasCoord } from "./display/canvas_coord";
import { ClientBoard, INDEX_TYPE, VERTEX_RADIUS } from "./board";
import { updateWeightDiv } from "./weightable";
import { Color, getCanvasColor } from "./display/colors_v2";
import { rgbTikzFromHexaColor } from "../tikz";
import { highlightColors } from "./display/highlight_colors";

export class ParameterValue {
    value: string;

    constructor(value: string){
        this.value = value;
    }
}



export class ClientVertex extends BasicVertex<ClientVertexData> {
    board: ClientBoard;

    constructor(index: number, data: ClientVertexData, board: ClientBoard){
        super(index, data);
        this.board = board;
        updateWeightDiv(this, board);
        this.updateIndexString();
    }

    static from(other: Vertex<ClientVertexData>, board: ClientBoard): ClientVertex{
        return new ClientVertex(other.index, other.data, board);
    }

    getIndex(): number{
        return this.index;
    }

    getWeight(): string{
        return this.data.weight;
    }

    setWeight(newWeight: string){
        this.data.weight = newWeight;
        updateWeightDiv(this, this.board);
    }


    setWeightDiv(div: HTMLDivElement){
        this.data.weightDiv = div;
    }


    /**
     * Set the div pos according to the vertex canvas pos.
     */
    setAutoWeightDivPos(){
        if ( typeof this.data.weightDiv !== "undefined" ){

            const angles = new Array<[number,number]>();
            const neighbors = new Array<[number, Coord]>();
            for (const neighbor of this.board.graph.getNeighbors(this)){
                neighbors.push([neighbor.index, neighbor.data.pos])
            }
            for (const neighbor of this.board.graph.getOutNeighbors(this)){
                neighbors.push([neighbor.index, neighbor.data.pos])
            }
            for (const neighbor of this.board.graph.getInNeighbors(this)){
                neighbors.push([neighbor.index, neighbor.data.pos])
            }


            for (const neighbor of neighbors){
                if (this.index == neighbor[0]) continue;
                const deltaX = neighbor[1].x - this.data.pos.x;
                const deltaY = neighbor[1].y - this.data.pos.y;
                let angle = Math.atan2(deltaY, deltaX);
                if (angle < 0){
                    angle += 2*Math.PI;
                }
                angles.push([neighbor[0], angle]);
            }



            const distance = 20;


            if (angles.length == 0){
                this.data.weightDiv.style.top = String(this.data.canvas_pos.y + distance - this.data.weightDiv.clientHeight/2) + "px";
                this.data.weightDiv.style.left = String(this.data.canvas_pos.x- this.data.weightDiv.clientWidth/2) + "px";
                return;
            }
            if (angles.length == 1){
                const angleRadians = angles[0][1] + Math.PI;
                const newX = this.data.canvas_pos.x + distance * Math.cos(angleRadians);
                const newY = this.data.canvas_pos.y + distance * Math.sin(angleRadians);

                this.data.weightDiv.style.top = String(newY - this.data.weightDiv.clientHeight / 2) + "px";
                this.data.weightDiv.style.left = String(newX - this.data.weightDiv.clientWidth / 2) + "px";
                return;
            }

            angles.sort((a, b) => a[1] - b[1]);

            // console.log("---")
            // Find the index i maximizing the angle difference
            let maxAngleDiff = -10;
            let maxIndex = -1;
            for (let i = 0; i < angles.length; i++) {
                // console.log(angles[i][1]*360/(2*Math.PI));
                const j = (i+1) % angles.length;
                let angleDiff = angles[j][1] - angles[i][1];
                if (angleDiff < 0) { angleDiff += 2*Math.PI}
                if (angleDiff > maxAngleDiff) {
                    maxAngleDiff = angleDiff;
                    maxIndex = i;
                }
            }

            // Calculate the angle between angles[maxIndex+1] and angles[maxIndex]
            const angleRadians = angles[maxIndex][1] + maxAngleDiff/2;

            // Calculate the new position of weightDiv
            const newX = this.data.canvas_pos.x + distance * Math.cos(angleRadians);
            const newY = this.data.canvas_pos.y + distance * Math.sin(angleRadians);

            // Position the weightDiv
            this.data.weightDiv.style.top = String(newY - this.data.weightDiv.clientHeight / 2) + "px";
            this.data.weightDiv.style.left = String(newX - this.data.weightDiv.clientWidth / 2) + "px";




            // this.data.weightDiv.style.top = String(this.data.canvas_pos.y + 20 - this.data.weightDiv.clientHeight/2) + "px";
            // this.data.weightDiv.style.left = String(this.data.canvas_pos.x- this.data.weightDiv.clientWidth/2) + "px";
        }
    }


    


    setPos(board: ClientBoard, nx: number, ny: number) {
        this.data.pos.x = nx;
        this.data.pos.y = ny;
        this.data.canvas_pos = board.camera.create_canvas_coord(this.data.pos );
        this.setAutoWeightDivPos();
        this.setAutoWeightDivPosNeighbors();
    }


    setAutoWeightDivPosNeighbors(){
        for (const neighbor of this.board.graph.getNeighbors(this)){
            if (neighbor.index != this.index) {
                neighbor.setAutoWeightDivPos();
            }
        }
        for (const neighbor of this.board.graph.getOutNeighbors(this)){
            if (neighbor.index != this.index) {
                const neighbor2 = this.board.graph.vertices.get(neighbor.index);
                if (typeof neighbor2 != "undefined"){
                    neighbor2.setAutoWeightDivPos();
                }
            }
        }
        for (const neighbor of this.board.graph.getInNeighbors(this)){
            if (neighbor.index != this.index) {
                const neighbor2 = this.board.graph.vertices.get(neighbor.index);
                if (typeof neighbor2 != "undefined"){
                    neighbor2.setAutoWeightDivPos();
                }
            }
        }
    }


    update_after_view_modification(camera: Camera){
        this.data.canvas_pos = camera.create_canvas_coord(this.data.pos);
        this.setAutoWeightDivPos();
        this.setAutoWeightDivPosNeighbors();
    }


    is_nearby(pos: CanvasCoord, rsquared: number) {
        return this.data.canvas_pos.dist2(pos) <= rsquared;
    }

    translate_by_canvas_vect(shift: CanvasVect, camera: Camera){
        this.data.canvas_pos.translate_by_canvas_vect(shift);
        this.data.pos.x += shift.x/camera.zoom;
        this.data.pos.y += shift.y/camera.zoom;
        this.setAutoWeightDivPos();
        this.setAutoWeightDivPosNeighbors();
    }

    translate_by_server_vect(shift: Vect, camera: Camera){
        const canvas_shift = camera.create_canvas_vect(shift);
        this.data.canvas_pos.translate_by_canvas_vect(canvas_shift);
        this.data.pos.x += shift.x;
        this.data.pos.y += shift.y;
        this.setAutoWeightDivPos();
        this.setAutoWeightDivPosNeighbors();
    }

    is_in_rect(c1: CanvasCoord, c2: CanvasCoord) {
        return this.data.canvas_pos.is_in_rect(c1,c2);
    }

    getTikzCoordVar() {
        return `v${this.index}`;
    }

    tikzify_coordinate() {
        return `\\coordinate (${this.getTikzCoordVar()}) at (${Math.round(this.data.pos.x)/100}, ${Math.round(this.data.pos.y)/100});`;
    }

    tikzify_node(): string {
        const weightTikz = (this.data.weight == "") ? "" : `\n\t\t\\node[label={[scale=\\weightSize]below: ${this.data.weight}}] at (${this.getTikzCoordVar()}) {};`;

        return `\\node[scale = \\vertexSize, label={[text=white, scale=\\vertexIdSize]center: ${this.data.indexString}}, nodes={${this.data.color}}{}{}{}] at  (${this.getTikzCoordVar()})  {};${weightTikz}`;
    }

    tikzify_label() {
        // TODO
        let labelCode = "";
        // https://tex.stackexchange.com/questions/58878/tikz-set-node-label-position-more-precisely
        // shift={(1,0.3)} COMMENT 2

        // labelCode = "\\node[shift={(" + round(this.label.getExactLabelOffsetX() * 10) / 1000 + "," + -round(this.label.getExactLabelOffsetY() * 10) / 1000 + ")}, scale=\\vertexSize] at  (v" + Vertices.indexOf(this) + ") {" + this.label.text + "};";

        return labelCode;
    }



    /**
     *  Draw the vertex on the context.
     */
    draw(board: ClientBoard) {
        let vertex_radius = VERTEX_RADIUS;
        if (board.getIndexType() != INDEX_TYPE.NONE) {
            vertex_radius = 2 * VERTEX_RADIUS;
        }

        const color = getCanvasColor(this.data.color, board.isDarkMode());


        if ( board.elementOver instanceof ClientVertex && board.elementOver.index == this.index){
            drawCircle(this.data.canvas_pos, color, vertex_radius*1.5, 0.5, board.ctx);
        }

        if (this.data.is_selected ) {
            board.ctx.beginPath();
            board.ctx.arc(this.data.canvas_pos.x, this.data.canvas_pos.y, vertex_radius*1.8, 0, 2 * Math.PI);
            board.ctx.lineWidth = 4;
            board.ctx.strokeStyle = color;
            board.ctx.stroke();
        } else {
            /* DISABLED for new draw of vertices
            drawCircle(vertex.pos.canvas_pos, COLOR_BORDER_VERTEX, vertex_radius, 1, ctx);
            */
        }

        // Draw Highlight
        if (typeof this.data.highlight != "undefined" ) {
            board.ctx.beginPath();
            board.ctx.arc(this.data.canvas_pos.x, this.data.canvas_pos.y, vertex_radius*2.2, 0, 2 * Math.PI);
            board.ctx.lineWidth = 4;
            const color = highlightColors[this.data.highlight % highlightColors.length];
            board.ctx.strokeStyle = color;
            board.ctx.stroke();
        }        
        
        drawCircle(this.data.canvas_pos, color, vertex_radius - 2, 1, board.ctx);

        // DRAW INDEX 
        if (board.getIndexType() != INDEX_TYPE.NONE) {
            board.ctx.font = "17px Arial";
            const measure = board.ctx.measureText(this.data.indexString);
            board.ctx.fillStyle = (board.isDarkMode()) ? "black" : "white";
            const pos = this.data.canvas_pos;
            board.ctx.fillText(this.data.indexString, pos.x - measure.width / 2, pos.y + 5);
        }

        // DRAW PARAMETER VALUES
        for( const pv of this.data.parameter_values.values()){
            board.ctx.font = "17px Arial";
            const measure = board.ctx.measureText(pv.value);
            board.ctx.fillStyle = "white"
            const pos = this.data.canvas_pos
            board.ctx.fillText(pv.value, pos.x - measure.width / 2, pos.y + 25);
        }
    }


    /**
     * Update the indexString according to the indexType of board
     */
    updateIndexString(){
        const letters = "abcdefghijklmnopqrstuvwxyz";
        if (this.board.getIndexType() == INDEX_TYPE.NONE) {
            this.data.indexString = "";
        } else if (this.board.getIndexType() == INDEX_TYPE.NUMBER_STABLE) {
            this.data.indexString = String(this.index)
        } else if (this.board.getIndexType() == INDEX_TYPE.ALPHA_STABLE) {
            this.data.indexString = letters.charAt(this.index % letters.length);
        }
        else if (this.board.getIndexType() == INDEX_TYPE.NUMBER_UNSTABLE) {
            let counter = 0;
            for (const key of this.board.graph.vertices.keys()) {
                if (key < this.index) {
                    counter++;
                }
            }
            this.data.indexString = String(counter)
        }
        else if (this.board.getIndexType() == INDEX_TYPE.ALPHA_UNSTABLE) {
            let counter = 0;
            for (const key of this.board.graph.vertices.keys()) {
                if (key < this.index) {
                    counter++;
                }
            }
            this.data.indexString = letters.charAt(counter % letters.length);
        }
    }

}





export class ClientVertexData extends BasicVertexData {
    color: Color;
    canvas_pos: CanvasCoord;
    highlight: undefined | number;
    is_selected: boolean;
    indexString: string;
    parameter_values: Map<string,ParameterValue>;
    weightDiv: HTMLDivElement | undefined; // set to undefined until a non empty weight is used

    constructor(x:number, y:number, weight: string, camera: Camera, color: Color) {
        super(new Coord(x,y), weight, color);
        this.color = color;
        this.canvas_pos = camera.create_canvas_coord(this.pos );
        this.is_selected = false;
        this.highlight = undefined;
        this.indexString = "";
        // this.color = COLOR_INNER_VERTEX_DEFAULT;
        this.parameter_values = new Map();
        this.weightDiv = undefined;
    }
   

    

    update_param(param_id: string, value: string){
        this.parameter_values.set(param_id, new ParameterValue(value));
    }

   



}
