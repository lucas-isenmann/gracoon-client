import { BasicVertex, BasicVertexData,  Coord, Vect, Vertex } from "gramoloss";
import {  VERTEX_RADIUS } from "../draw";
import { draw_circle } from "../draw_basics";
import { local_board } from "../setup";
import { INDEX_TYPE, View } from "./camera";
import { CanvasVect } from "./vect";
import { CanvasCoord } from "./canvas_coord";
import { BoardElementType } from "./board";
import { initWeightDiv } from "./weightable";
import { Color, getCanvasColor } from "../colors_v2";

export class ParameterValue {
    value: string;

    constructor(value: string){
        this.value = value;
    }
}



export class ClientVertex extends BasicVertex<ClientVertexData> {

    constructor(index: number, data: ClientVertexData){
        super(index, data);
    }

    static from(other: Vertex<ClientVertexData>): ClientVertex{
        return new ClientVertex(other.index, other.data);
    }

    getIndex(): number{
        return this.index;
    }

    getWeight(): string{
        return this.data.weight;
    }

    setWeight(newWeight: string){
        this.data.weight = newWeight;
    }

    getWeightDiv(){
        return this.data.weightDiv;
    }

    setWeightDiv(div: HTMLDivElement){
        this.data.weightDiv = div;
    }


    /**
         * Set the div pos according to the vertex canvas pos.
         */
    setAutoWeightDivPos(){
        if ( typeof this.data.weightDiv !== "undefined" ){
            this.data.weightDiv.style.top = String(this.data.canvas_pos.y + 20 - this.data.weightDiv.clientHeight/2) + "px";
            this.data.weightDiv.style.left = String(this.data.canvas_pos.x- this.data.weightDiv.clientWidth/2) + "px";
        }
    }


    afterSetWeight(){
        if (typeof this.data.weightDiv === "undefined"){
            initWeightDiv(this, BoardElementType.Vertex);
        } else {
            this.data.weightDiv.innerHTML = this.data.weight;
            // this.weightDiv.innerHTML = katex.renderToString(this.weight);
        }
        this.setAutoWeightDivPos();
    }


    setPos(nx: number, ny: number) {
        this.data.pos.x = nx;
        this.data.pos.y = ny;
        this.data.canvas_pos = local_board.view.create_canvas_coord(this.data.pos );
        this.setAutoWeightDivPos();
    }

    // clone(): ClientVertex {
    //     const newVertex = new ClientVertex(this.data.pos.x, this.data.pos.y, this.data.weight, local_board.view);
    //     newVertex.data.color = this.data.color;
    //     newVertex.data.is_selected = this.data.is_selected;
    //     newVertex.data.index_string = this.data.index_string;
    //     for (const [index, paramValue] of this.data.parameter_values){
    //         newVertex.data.parameter_values.set(index, paramValue);
    //     }
    //     return newVertex;
    // }


    update_after_view_modification(view: View){
        this.data.canvas_pos = view.create_canvas_coord(this.data.pos);
        this.setAutoWeightDivPos();
    }


    is_nearby(pos: CanvasCoord, rsquared: number) {
        return this.data.canvas_pos.dist2(pos) <= rsquared;
    }

    translate_by_canvas_vect(shift: CanvasVect, view: View){
        this.data.canvas_pos.translate_by_canvas_vect(shift);
        this.data.pos.x += shift.x/view.zoom;
        this.data.pos.y += shift.y/view.zoom;
        this.setAutoWeightDivPos();
    }

    translate_by_server_vect(shift: Vect, view: View){
        const canvas_shift = view.create_canvas_vect(shift);
        this.data.canvas_pos.translate_by_canvas_vect(canvas_shift);
        this.data.pos.x += shift.x;
        this.data.pos.y += shift.y;
        this.setAutoWeightDivPos();
    }

    is_in_rect(c1: CanvasCoord, c2: CanvasCoord) {
        return this.data.canvas_pos.is_in_rect(c1,c2);
    }

    get_tikz_coordinate(index: number) {
        return `v${index}`;
    }
    tikzify_coordinate(index: number) {
        return `\\coordinate (${this.get_tikz_coordinate(index)}) at (${Math.round(this.data.pos.x)/100}, ${Math.round(this.data.pos.y)/100});`;
    }

    tikzify_node(index: number) {
        // const c = "c" + COLORS.indexOf(this.color);
        // if (this.color == DEFAULT_COLOR) {
        //   c = "white";
        // }

        return `\\node[scale = \\scaleV, nodes={white}{}{}{}] at  (${this.get_tikz_coordinate(index)})  {};`;
    }

    tikzify_label() {
        // TODO
        let labelCode = "";
        // https://tex.stackexchange.com/questions/58878/tikz-set-node-label-position-more-precisely
        // shift={(1,0.3)} COMMENT 2

        // labelCode = "\\node[shift={(" + round(this.label.getExactLabelOffsetX() * 10) / 1000 + "," + -round(this.label.getExactLabelOffsetY() * 10) / 1000 + ")}, scale=\\scaleV] at  (v" + Vertices.indexOf(this) + ") {" + this.label.text + "};";

        return labelCode;
    }



    /**
     *  Draw the vertex on the context.
     */
    draw(ctx: CanvasRenderingContext2D) {
        let vertex_radius = VERTEX_RADIUS;
        if (local_board.view.index_type != INDEX_TYPE.NONE) {
            vertex_radius = 2 * VERTEX_RADIUS;
        }

        const color = getCanvasColor(this.data.color, local_board.view.dark_mode);

        if (this.data.is_selected) {
            ctx.beginPath();
            ctx.arc(this.data.canvas_pos.x, this.data.canvas_pos.y, vertex_radius*1.8, 0, 2 * Math.PI);
            ctx.lineWidth = 4;
            ctx.strokeStyle = color;
            ctx.stroke();
        } else {
            /* DISABLED for new draw of vertices
            draw_circle(vertex.pos.canvas_pos, COLOR_BORDER_VERTEX, vertex_radius, 1, ctx);
            */
        }
        
        
        draw_circle(this.data.canvas_pos, color, vertex_radius - 2, 1, ctx);

        // DRAW INDEX 
        if (local_board.view.index_type != INDEX_TYPE.NONE) {
            ctx.font = "17px Arial";
            const measure = ctx.measureText(this.data.index_string);
            if ( local_board.view.dark_mode){
                ctx.fillStyle = "black";
            } else {
                ctx.fillStyle = "white";
            }
            const pos = this.data.canvas_pos
            ctx.fillText(this.data.index_string, pos.x - measure.width / 2, pos.y + 5);
        }

        // DRAW PARAMETER VALUES
        for( const pv of this.data.parameter_values.values()){
            ctx.font = "17px Arial";
            const measure = ctx.measureText(pv.value);
            ctx.fillStyle = "white"
            const pos = this.data.canvas_pos
            ctx.fillText(pv.value, pos.x - measure.width / 2, pos.y + 25);
        }
    }



}





export class ClientVertexData extends BasicVertexData {
    color: Color;
    canvas_pos: CanvasCoord;
    is_selected: boolean;
    index_string: string;
    parameter_values: Map<string,ParameterValue>;
    weightDiv: HTMLDivElement | undefined; // set to undefined until a non empty weight is used

    constructor(x:number, y:number, weight: string, view: View, color: Color) {
        super(new Coord(x,y), weight, color);
        this.canvas_pos = view.create_canvas_coord(this.pos );
        this.is_selected = false;
        this.index_string = "";
        // this.color = COLOR_INNER_VERTEX_DEFAULT;
        this.parameter_values = new Map();
        this.weightDiv = undefined;
    }
   

    

    update_param(param_id: string, value: string){
        this.parameter_values.set(param_id, new ParameterValue(value));
    }

   



}
