import { bezierValue, Coord, Vect, Vertex } from "gramoloss";
import katex from "katex";
import { COLOR_INNER_VERTEX_DEFAULT, VERTEX_RADIUS } from "../draw";
import { draw_circle, real_color } from "../draw_basics";
import { DOWN_TYPE } from "../interactors/interactor";
import { interactor_loaded } from "../interactors/interactor_manager";
import { local_board } from "../setup";
import { display_weight_input, text_interactorV2, validate_weight } from "../side_bar/interactors/text";
import { solutionQuadratic } from "../utils";
import { INDEX_TYPE, View } from "./camera";
import { CanvasVect } from "./vect";
import { CanvasCoord } from "./canvas_coord";

export class ParameterValue {
    value: string;

    constructor(value: string){
        this.value = value;
    }
}







export class ClientVertex extends Vertex<ClientVertex> {
    canvas_pos: CanvasCoord;
    is_selected: boolean;
    index_string: string;
    parameter_values: Map<string,ParameterValue>;
    weight_div: HTMLDivElement = null; // set to null until a non empty weight is used

    constructor(x:number, y:number, weight: string, view: View) {
        super(x,y,weight);
        this.canvas_pos = view.create_canvas_coord(this.pos );
        this.is_selected = false;
        this.index_string = "";
        this.color = COLOR_INNER_VERTEX_DEFAULT;
        this.parameter_values = new Map();

        if ( weight != "" ){
            this.weight_div = document.createElement("div");
            this.weight_div.classList.add("weight_link");
            document.body.appendChild(this.weight_div);
            this.weight_div.innerHTML = katex.renderToString(weight);
            this.auto_weight_div_pos();
        }
    }

    auto_weight_div_pos(){
        if ( this.weight != ""){
            this.weight_div.style.top = String(this.canvas_pos.y + 20 - this.weight_div.clientHeight/2) + "px";
            this.weight_div.style.left = String(this.canvas_pos.x- this.weight_div.clientWidth/2) + "px";
        }
    }

    // TODO use this method when creating a vertex in graph
    // TODO same with wheel
    init_weight_interactors(this_index: number) {
        // TODO check if null
        this.weight_div.onclick = (e) => {
            if( interactor_loaded.id == text_interactorV2.id){
                validate_weight();
                display_weight_input(this_index, new CanvasCoord(this.canvas_pos.x , this.canvas_pos.y+20),DOWN_TYPE.VERTEX);
            }
        }
    }

    update_param(param_id: string, value: string){
        this.parameter_values.set(param_id, new ParameterValue(value));
    }

    update_after_view_modification(view: View){
        this.canvas_pos = view.create_canvas_coord(this.pos);
        this.auto_weight_div_pos();
    }


    is_nearby(pos: CanvasCoord, rsquared: number) {
        return this.canvas_pos.dist2(pos) <= rsquared;
    }

    translate_by_canvas_vect(shift: CanvasVect, view: View){
        this.canvas_pos.translate_by_canvas_vect(shift);
        this.pos.x += shift.x/view.zoom;
        this.pos.y += shift.y/view.zoom;
        this.auto_weight_div_pos();
    }

    translate_by_server_vect(shift: Vect, view: View){
        const canvas_shift = view.create_canvas_vect(shift);
        this.canvas_pos.translate_by_canvas_vect(canvas_shift);
        this.pos.x += shift.x;
        this.pos.y += shift.y;
        this.auto_weight_div_pos();
    }

    is_in_rect(c1: CanvasCoord, c2: CanvasCoord) {
        return this.canvas_pos.is_in_rect(c1,c2);
    }

    get_tikz_coordinate(index: number) {
        return `v${index}`;
    }
    tikzify_coordinate(index: number) {
        return `\\coordinate (${this.get_tikz_coordinate(index)}) at (${Math.round(this.pos.x)/100}, ${Math.round(this.pos.y)/100});`;
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

    setPos(nx: number, ny: number) {
        this.pos.x = nx;
        this.pos.y = ny;
        this.canvas_pos = local_board.view.create_canvas_coord(this.pos );
        this.auto_weight_div_pos();
    }

    clone(): ClientVertex {
        const newVertex = new ClientVertex(this.pos.x, this.pos.y, this.weight, local_board.view);
        newVertex.color = this.color;
        newVertex.is_selected = this.is_selected;
        newVertex.index_string = this.index_string;
        for (const [index, paramValue] of this.parameter_values){
            newVertex.parameter_values.set(index, paramValue);
        }
        return newVertex;
    }


    /// Draw the vertex on the context.
    draw(ctx: CanvasRenderingContext2D) {
        let vertex_radius = VERTEX_RADIUS;
        if (local_board.view.index_type != INDEX_TYPE.NONE) {
            vertex_radius = 2 * VERTEX_RADIUS;
        }

        const color = real_color(this.color, local_board.view.dark_mode);

        if (this.is_selected) {
            ctx.beginPath();
            ctx.arc(this.canvas_pos.x, this.canvas_pos.y, vertex_radius*1.8, 0, 2 * Math.PI);
            ctx.lineWidth = 4;
            ctx.strokeStyle = color;
            ctx.stroke();
        } else {
            /* DISABLED for new draw of vertices
            draw_circle(vertex.pos.canvas_pos, COLOR_BORDER_VERTEX, vertex_radius, 1, ctx);
            */
        }
        
        
        draw_circle(this.canvas_pos, color, vertex_radius - 2, 1, ctx);

        // DRAW INDEX 
        if (local_board.view.index_type != INDEX_TYPE.NONE) {
            ctx.font = "17px Arial";
            const measure = ctx.measureText(this.index_string);
            if ( local_board.view.dark_mode){
                ctx.fillStyle = "black";
            } else {
                ctx.fillStyle = "white";
            }
            const pos = this.canvas_pos
            ctx.fillText(this.index_string, pos.x - measure.width / 2, pos.y + 5);
        }

        // DRAW PARAMETER VALUES
        for( const pv of this.parameter_values.values()){
            ctx.font = "17px Arial";
            const measure = ctx.measureText(pv.value);
            ctx.fillStyle = "white"
            const pos = this.canvas_pos
            ctx.fillText(pv.value, pos.x - measure.width / 2, pos.y + 25);
        }
    }


}
