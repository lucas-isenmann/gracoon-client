import { Area, Board, Coord, Option, TextZone, Vect } from "gramoloss";
import { DOWN_TYPE, RESIZE_TYPE } from "../interactors/interactor";
import { GraphModifyer } from "../modifyers/modifyer";
import { socket } from "../socket";
import { ClientArea } from "./area";
import { center_canvas_on_rectangle, View } from "./camera";
import { ClientGraph } from "./graph";
import { ClientLink, ClientLinkData, LinkPreData } from "./link";
import { ClientRectangle } from "./rectangle";
import { ClientRepresentation } from "./representations/client_representation";
import { is_click_over, resize_type_nearby, translate_by_canvas_vect } from "./resizable";
import { ClientStroke } from "./stroke";
import { ClientTextZone } from "./text_zone";
import { CanvasVect } from "./vect";
import { ClientVertex, ClientVertexData } from "./vertex";
import { CanvasCoord } from "./canvas_coord";
import { Var, VariableNumber, VariableBoolean } from "./variable";
import { drawBezierCurve, drawLine, draw_circle } from "../draw_basics";
import { Color } from "../colors_v2";
import { User } from "../user";
import { InteractorV2 } from "../side_bar/interactor_side_bar";
import { ELEMENT_DATA, ELEMENT_DATA_AREA, ELEMENT_DATA_CONTROL_POINT, ELEMENT_DATA_LINK, ELEMENT_DATA_RECTANGLE, ELEMENT_DATA_REPRESENTATION, ELEMENT_DATA_REPRESENTATION_SUBELEMENT, ELEMENT_DATA_STROKE, ELEMENT_DATA_TEXT_ZONE, ELEMENT_DATA_VERTEX } from "../interactors/pointed_element_data";
import { AreaChoice, AreaIndex } from "../generators/attribute";
import { EntireZone } from "../parametors/zone";
import { Self } from "../self_user";


export const SELECTION_COLOR = 'green' // avant c'était '#00ffff'
export let COLOR_BACKGROUND = "#1e1e1e";
export const GRID_COLOR = '#777777';
export const VERTEX_RADIUS = 8;
export const COLOR_ALIGNEMENT_LINE = "#444444";
export let COLOR_BORDER_VERTEX = "#ffffff";
export let COLOR_INNER_VERTEX_DEFAULT = "#000000";






export enum BoardElementType {
    Vertex = "Vertex",
    Link = "Link",
    ControlPoint = "ControlPoint",
    TextZone = "TextZone",
    Area = "Area",
    Stroke = "Stroke",
    Rectangle = "Rectangle",
    Representation = "Representation"
}

// These constants must correspond to the API of the server

export enum SocketMsgType {
    ADD_ELEMENT = "add_element",
    DELETE_ELEMENTS = "delete_elements",
    UPDATE_ELEMENT = "update_element",
    TRANSLATE_ELEMENTS = "translate_elements",
    RESIZE_ELEMENT = "resize_element",
    MERGE_VERTICES = "vertices_merge",
    PASTE_GRAPH = "paste_graph",
    APPLY_MODIFYER = "apply_modifyer",
    UNDO = "undo",
    REDO = "redo",
    LOAD_JSON = "load_json",
    GET_JSON = "get_json",
    SUBDIVIDE_LINK = "subdivide_link"
}



export class ClientBoard extends Board<ClientVertexData, ClientLinkData, ClientStroke, ClientArea, ClientTextZone, ClientRepresentation, ClientRectangle> {
    view: View;
    graph: ClientGraph;
    variables: Map<string, Var>;
    variablesDiv: HTMLDivElement;
    elementOver: undefined | ClientVertex | ClientLink | ClientStroke | ClientRectangle;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    selfUser: Self;
    colorSelected: Color;
    keyPressed: Set<string>;
    interactorLoaded: Option<InteractorV2>;
    interactorLoadedId: Option<string>;

    graphClipboard: Option<ClientGraph>;
    isGraphClipboardGenerated: boolean;
    clipboardInitPos: Option<CanvasCoord>;

    otherUsers: Map<string, User>;

    entireZone: EntireZone;


    constructor(){
        super();

        this.selfUser = new Self();
        this.otherUsers = new Map();
        this.colorSelected = Color.Neutral;
        this.keyPressed = new Set<string>();
        this.interactorLoaded = undefined;
        this.interactorLoadedId = undefined;
        this.isGraphClipboardGenerated = false;        

        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.canvas.id = "main";
        const ctx = this.canvas.getContext('2d');
        if (ctx == null) throw Error("Cannot get context 2d of canvas");
        this.ctx = ctx; 
        

        this.graph = new ClientGraph(this);
        this.view = new View();
        
        this.elementOver = undefined;

        this.variables = new Map();
        this.variablesDiv = document.createElement("div");
        this.variablesDiv.id = "variablesDiv";
        document.body.appendChild(this.variablesDiv);

        // setup the div of the loaded params of the whole graph
        this.entireZone = new EntireZone(this);

        // this.addVariable("h", 0, 20, 50, 0.1, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariable("h2", 0, 20, 50, 0.1, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariableBoolean("adaptToEdgeLength", false, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariableBoolean("middleOfEdge", false, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariable("ratio", 0, 0.5, 1, 0.01, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariable("durete", 0, 10, 100, 0.1, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariable("crossRatio", 0, 0.4, 0.5, 0.01, () => {
        //     this.afterVariableChange()
        // });
        // this.addVariable("width", 0, 3, 50, 0.1, () => {
        //     this.afterVariableChange();
        // })

    }

    afterVariableChange(){
        // const canvas = document.getElementById('main') as HTMLCanvasElement;
        // const ctx = canvas.getContext('2d');
        // const h = this.getVariableValue("h");
        // const h2 = this.getVariableValue("h2");
        // const adaptToEdgeLength = this.getVariableValue("adaptToEdgeLength");
        // const ratio = this.getVariableValue("ratio");
        // const durete = this.getVariableValue("durete");
        // const crossRatio = this.getVariableValue("crossRatio");
        // const width = this.getVariableValue("width");

        // this.draw();
        // if (typeof width == "number" && typeof crossRatio == "number" && typeof durete == "number" && typeof h == "number" && typeof h2 == "number" && typeof adaptToEdgeLength == "boolean" && typeof ratio == "number"){
        //     this.graph.drawCombinatorialMap(undefined, ctx, h, h2, crossRatio, adaptToEdgeLength, ratio, durete, width);
        // }
    }

    addVariable(id: string, min: number, value: number, max: number, step: number, onchangeHandler: () => void ){
        const variable = new VariableNumber(id, min, value, max, step, onchangeHandler);
        this.variablesDiv.appendChild(variable.div);
        this.variables.set(id, variable);
    }

    addVariableBoolean(id: string, value: boolean, onchangeHandler: () => void ){
        const variable = new VariableBoolean(id, value, onchangeHandler);
        this.variablesDiv.appendChild(variable.div);
        this.variables.set(id, variable);
    }

    getVariableValue(id: string): Option<number | boolean>{
        const v = this.variables.get(id);
        if (v){
            return v.getValue();
        } else {
            return undefined
        }
    }


    
    override delete_area(areaIndex: number): void {
        const area = this.areas.get(areaIndex);
        if (typeof area != "undefined"){
            area.clearDOM();
            super.delete_area(areaIndex);
        }

    }


    /**
     * Draw a Bezier Curve with 2 control points (therefore it is a cubic curve).
     */
    drawBezierCurve(ctx: CanvasRenderingContext2D, p1: Coord, c1: Coord, c2: Coord, p2: Coord, color: string, width: number){
        const canvasp1 = this.view.create_canvas_coord(p1);
        const canvasc1 = this.view.create_canvas_coord(c1);
        const canvasc2 = this.view.create_canvas_coord(c2);
        const canvasp2 = this.view.create_canvas_coord(p2);
        const scaledWidth = width*this.view.zoom;
        drawBezierCurve(ctx, canvasp1, canvasc1, canvasc2, canvasp2, color, scaledWidth);
    }

    drawLine(ctx: CanvasRenderingContext2D, p1: Coord, p2: Coord, color: string, width: number){
        const canvasP1 = this.view.create_canvas_coord(p1);
        const canvasP2 = this.view.create_canvas_coord(p2);
        const scaledWidth = width*this.view.zoom;
        drawLine(canvasP1, canvasP2, ctx, color, scaledWidth);
    }

    drawCircle(ctx: CanvasRenderingContext2D, center: Coord, radius: number, color: string){
        const canvasCenter = this.view.create_canvas_coord(center);
        draw_circle(canvasCenter, color, radius, 1, ctx)
    }
    

    /**
     * For the moment only everything in the graph.
     * TODO: select also all the other elements?
     * TODO: select only the vertices or only the links?
     * (depending on a board variable)
     */
    selectEverything() {
        for (const vertex of this.graph.vertices.values()){
            vertex.data.is_selected = true;
        } 
        for (const link of this.graph.links.values()){
            link.data.is_selected = true;
        }
    }


    /**
     * Draw a triangular grid. 
     * The length of the equilateral triangle is `grid_size` of view.
     * @param canvas The sidebar the item belongs
     * @param ctx The ctx of the canvas
     */
    drawTriangularGrid() {
        const grid_size = this.view.grid_size;
        const h = grid_size*Math.sqrt(3)/2;

        //   \ diagonals
        for (let x = (this.view.camera.x - this.view.camera.y/Math.sqrt(3)) % grid_size - Math.floor((this.canvas.width+this.canvas.height)/grid_size)*grid_size; x < this.canvas.width; x += grid_size) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = GRID_COLOR;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x + this.canvas.height , this.canvas.height*Math.sqrt(3));
            this.ctx.stroke();
        }

        //   / diagonals
        for (let x = (this.view.camera.x + this.view.camera.y/Math.sqrt(3)) % grid_size + Math.floor((this.canvas.width+this.canvas.height)/grid_size)*grid_size; x > 0 ; x -= grid_size) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = GRID_COLOR;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x - this.canvas.height , this.canvas.height*Math.sqrt(3));
            this.ctx.stroke();
        }

        // horizontal lines
        for (let y = this.view.camera.y % h; y < this.canvas.height; y += h) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = GRID_COLOR;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // debugging : draw the quadrilateral containing the point

        // for (let i = 0 ; i < 10 ; i ++){
        //     for (let j = 0 ; j < 10 ; j ++){
        //         let pos = new Coord(i*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2);
        //         pos = pos.add(this.view.camera);
        //         let cpos = new CanvasCoord(pos.x, pos.y);
        //         draw_circle(cpos, "red", 10, 1, ctx);
        //     }
        // }


        // const px = ((mouse_pos.x - this.view.camera.x) - (mouse_pos.y - this.view.camera.y)/Math.sqrt(3))/grid_size;
        // const py = (mouse_pos.y - this.view.camera.y)/h;
        // const i = Math.floor(px);
        // const j = Math.floor(py);

        // let pos = new Coord(i*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2);
        // pos = pos.add(this.view.camera);
        // let cpos = new CanvasCoord(pos.x, pos.y);
        // draw_circle(cpos, "blue", 10, 1, ctx);

        // let pos2 = new Coord((i+1)*grid_size + (j+1)*grid_size/2, Math.sqrt(3)*(j+1)*grid_size/2);
        // pos2 = pos2.add(this.view.camera);
        // let cpos2 = new CanvasCoord(pos2.x, pos2.y);
        // draw_circle(cpos2, "blue", 10, 1, ctx);


    }

    /**
     * The alignement lines with other vertices.
     */
    drawAlignements() {
        if (this.view.alignement_horizontal) {
            drawLine(new CanvasCoord(0, this.view.alignement_horizontal_y), new CanvasCoord(window.innerWidth, this.view.alignement_horizontal_y), this.ctx, COLOR_ALIGNEMENT_LINE, 3);
        }
        if (this.view.alignement_vertical) {
            drawLine(new CanvasCoord(this.view.alignement_vertical_x, 0), new CanvasCoord(this.view.alignement_vertical_x, window.innerHeight), this.ctx, COLOR_ALIGNEMENT_LINE, 3);
        }
    }


    drawInteractor() {
        if (this.view.is_drawing_interactor && typeof this.interactorLoaded != "undefined"){
            this.interactorLoaded.draw(this, this.selfUser.canvasPos)
        }
    }


    drawRectangularSelection() {
        if (this.view.is_rectangular_selecting) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = SELECTION_COLOR;
            this.ctx.rect(this.view.selection_corner_1.x, this.view.selection_corner_1.y, this.view.selection_corner_2.x - this.view.selection_corner_1.x, this.view.selection_corner_2.y - this.view.selection_corner_1.y);
            this.ctx.stroke();

            this.ctx.globalAlpha = 0.07;
            this.ctx.fillStyle = SELECTION_COLOR;
            this.ctx.fill();

            this.ctx.globalAlpha = 1;
        }
    }

    drawFollowing(){
        if( typeof this.selfUser.following != "undefined"){
            const following_user = this.otherUsers.get(this.selfUser.following);
            if( typeof following_user != "undefined"){
                this.ctx.beginPath();
                this.ctx.strokeStyle = following_user.multicolor.color;
                this.ctx.lineWidth = 10;
                this.ctx.rect(0,0,1000,1000);
                this.ctx.stroke();
            }
            else{
                this.selfUser.following = undefined;
            }
        }
    }

    draw() {
        // console.time("draw")
        this.drawBackground();
        if ( this.view.display_triangular_grid ) this.drawTriangularGrid();
        this.representations.forEach(rep => rep.draw(this.ctx, this.view));
        this.rectangles.forEach(rectangle => rectangle.draw());
        this.strokes.forEach(stroke => stroke.draw(this));
        this.areas.forEach(area => area.draw(this));
        this.drawAlignements();
        this.graph.draw();

        this.otherUsers.forEach(user => user.draw(this.canvas, this.ctx));
        this.drawRectangularSelection();
        this.drawInteractor();
        if (typeof this.graphClipboard != "undefined"){
            this.graphClipboard.draw();
        }
        // console.timeEnd("draw");
    }

    /**
     * Only request a draw.
     */
    requestDraw(){
        const board = this;
        requestAnimationFrame(function () { board.draw() })
    }
    

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // view.window_height = window.innerHeight;
        // view.window_width = window.innerWidth;
        const board = this;
        requestAnimationFrame(function () { board.draw() })
    }

    drawBackground() {
        this.ctx.beginPath();
        this.ctx.fillStyle = COLOR_BACKGROUND;
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fill();
    
        if (this.view.grid_show) {
            this.drawRectangularGrid();
        }
    }



    drawRectangularGrid() {
        const grid_size = this.view.grid_size;

        for (let i = this.view.camera.x % grid_size; i < this.canvas.width; i += grid_size) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = GRID_COLOR;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }

        for (let i = this.view.camera.y % grid_size; i < this.canvas.height; i += grid_size) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = GRID_COLOR;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }



    /**
     * Return true if an element has been erased.
     * Emit delete_elements alone.
     */
    eraseAt(e: CanvasCoord, eraseDistance: number) : boolean{
        for (const [index, s] of this.strokes.entries()) {
            if (s.is_nearby(e, this.view) !== false) {
                this.emit_delete_elements([[BoardElementType.Stroke, index]]);
                return true;
            }
        }
        for (const [index, vertex] of this.graph.vertices.entries()) {
            if (vertex.is_nearby(e, Math.pow(eraseDistance + VERTEX_RADIUS, 2))) {
                this.emit_delete_elements([[BoardElementType.Vertex, index]]);
                return true;
            }
        }
        for (const index of this.graph.links.keys()) {
            if (this.graph.is_click_over_link(index, e, this.view)) {
                this.emit_delete_elements([[BoardElementType.Link, index]]);
                return true;
            }
        }
        for(const [index,area] of this.areas.entries()){
            if( is_click_over(area,e) ){
                this.emit_delete_elements([[BoardElementType.Area, index]]);
                return true;
            }
        }
        return false;
    }

    clearAreas(){
        for (const area of this.areas.values()){
            area.clearDOM();
        }
        this.areas.clear();
    }

    clear() {
        this.clearAreas();
        for( const text_zone of this.text_zones.values()){
            text_zone.div.remove();
        }
        this.text_zones.clear();
    }

    update_after_camera_change(){
        for (const stroke of this.strokes.values()){
            stroke.update_after_camera_change(this.view);
        }
        for ( const text_zone of this.text_zones.values()){
            text_zone.update_after_camera_change(this.view);
        }
        for (const rep of this.representations.values()){
            rep.update_after_camera_change(this.view);
        }
        for (const rect of this.rectangles.values()){
            rect.update_after_camera_change(this.view);
        }
        for (const area of this.areas.values()){
            area.update_after_camera_change(this.view);
        }
    }

    select_elements_in_rect(corner1: CanvasCoord, corner2: CanvasCoord) {
        this.graph.select_vertices_in_rect(corner1, corner2);
        this.graph.select_links_in_rect(corner1, corner2);

        for (const stroke of this.strokes.values()){
            if (stroke.is_in_rect(corner1,corner2)){
                stroke.is_selected = true;   
            }
        }
    }


    create_text_zone(canvas_pos: CanvasCoord): number{
        let index = 0;
        while (this.text_zones.has(index)) {
            index += 1;
        }
        const pos = this.view.create_server_coord(canvas_pos);
        const text_zone = new ClientTextZone(pos, 200, "salut", this, index);
        this.text_zones.set(index, text_zone);
        return index;
    }

    
    /**
     * Return true if this.elementOver has changed.
     */
    updateElementOver(pos: CanvasCoord): boolean {
        const before = this.elementOver;
        this.elementOver = undefined;
        
        for (const rectangle of this.rectangles.values()){
            if (is_click_over(rectangle, pos)){
                this.elementOver = rectangle;
                break;
            }
        }

        for (const link of this.graph.links.values()){
            if (link.isPosNear(pos)){
                this.elementOver = link;
                break;
            }
        }
        for (const stroke of this.strokes.values()){
            if (stroke.is_nearby(pos, this.view)){
                this.elementOver = stroke;
                break;
            }
        }
        for (const vertex of this.graph.vertices.values()){
            if (vertex.is_nearby(pos, 150)){
                this.elementOver = vertex;
                break;
            }
        }
        return before !== this.elementOver;
    }


    get_element_nearby(pos: CanvasCoord, interactable_element_type: Set<DOWN_TYPE>): Option<ELEMENT_DATA> {

        if (interactable_element_type.has(DOWN_TYPE.REPRESENTATION_ELEMENT)){
            for (const [index, rep] of this.representations.entries()){
                const resizeType = resize_type_nearby(rep, pos, 10);
                if (typeof resizeType != "undefined"){
                    return new ELEMENT_DATA_REPRESENTATION(rep, index, resizeType);
                }
                const subElementIndex = rep.click_over(pos, this.view);
                if (typeof subElementIndex != "string"){
                    return new ELEMENT_DATA_REPRESENTATION_SUBELEMENT(rep, index, subElementIndex)
                }
            }
        }

        if (interactable_element_type.has(DOWN_TYPE.REPRESENTATION)){
            for (const [index, rep] of this.representations.entries()){
                if ( is_click_over(rep, pos)){
                    return new ELEMENT_DATA_REPRESENTATION(rep, index, undefined);
                }
            }
        }

        if (interactable_element_type.has(DOWN_TYPE.RECTANGLE)){
            for (const [index, rect] of this.rectangles.entries()){
                const resizeType = resize_type_nearby(rect, pos, 10);
                if (typeof resizeType != "undefined"){
                    return new ELEMENT_DATA_RECTANGLE(rect, index, resizeType);
                }
            }
            
            for (const [index, rect] of this.rectangles.entries()){
                if ( is_click_over(rect, pos)){
                    return new ELEMENT_DATA_RECTANGLE(rect, index, undefined);
                }
            }

        }

        if (interactable_element_type.has(DOWN_TYPE.VERTEX)) {
            for (const [index, v] of this.graph.vertices.entries()) {
                if (v.is_nearby(pos, 150)) {
                    return new ELEMENT_DATA_VERTEX(v);
                }
            }
        }
       
        for (const [index, link] of this.graph.links.entries()) {
            if (interactable_element_type.has(DOWN_TYPE.CONTROL_POINT) && typeof link.data.cp_canvas_pos != "string" && link.data.cp_canvas_pos.is_nearby(pos, 150)) {
                return new ELEMENT_DATA_CONTROL_POINT(link);
            }
            if (interactable_element_type.has(DOWN_TYPE.LINK) && this.graph.is_click_over_link(index, pos, this.view)) {
                return new ELEMENT_DATA_LINK(link);
            }
        }

        if(interactable_element_type.has(DOWN_TYPE.RESIZE)){
            for (const [index, area] of this.areas.entries()){
                const resizeType = resize_type_nearby(area, pos, 10);
                if (typeof resizeType != "undefined"){
                    return new ELEMENT_DATA_AREA(area, index, resizeType);
                }
            }
        }        

        for(const [index, area] of this.areas.entries()){
            if(interactable_element_type.has(DOWN_TYPE.AREA) && is_click_over(area, pos)){
                return new ELEMENT_DATA_AREA(area, index, undefined);
            }
        }

        if (interactable_element_type.has(DOWN_TYPE.STROKE)) {
            for(const [index,s] of this.strokes.entries()){
                if(typeof s.is_nearby(pos, this.view) == "number"){     
                    return new ELEMENT_DATA_STROKE(s, index);
                }
            }
        }

        if ( interactable_element_type.has(DOWN_TYPE.TEXT_ZONE)){
            for (const [index, textZone] of this.text_zones.entries()){
                if ( textZone.is_nearby(pos)){
                    return new ELEMENT_DATA_TEXT_ZONE(textZone, index);
                }
            }
        }

        return undefined;
    }

    deselect_all_strokes() {
        this.strokes.forEach(s => {
            s.is_selected = false;
        });
    }


    clear_all_selections() {
        this.graph.deselect_all_vertices();
        this.graph.deselect_all_links();
        this.deselect_all_strokes();
    }

    update_canvas_pos(view: View) {
        for (const v of this.graph.vertices.values()) {
            v.update_after_view_modification(view);
        }
        for (const link of this.graph.links.values()) {
            link.update_after_view_modification(view);
            
        }
        // for (const area of this.areas.values()){
        //     area.update_canvas_pos(view);
        // }
        for( const stroke of this.strokes.values()){
            stroke.update_canvas_pos(view);
        }
    }

    translate_area(shift: CanvasVect, area: ClientArea, verticesContained: Set<number>){
        this.graph.vertices.forEach((vertex, vertexIndex) => {
            if (verticesContained.has(vertexIndex)){
                vertex.translate_by_canvas_vect(shift, this.view);
            }
        })
        for( const link of this.graph.links.values()){
            if ( typeof link.data.cp != "undefined"){
                const v1 = link.startVertex;
                const v2 = link.endVertex;
                if(verticesContained.has(link.startVertex.index) && verticesContained.has(link.endVertex.index)){
                    link.translate_cp_by_canvas_vect(shift, this.view);
                }
                else if(verticesContained.has(link.startVertex.index)){ // and thus not v2
                    const newPos = v1.data.pos;
                    const previousPos = this.view.create_server_coord_from_subtranslated(v1.data.canvas_pos, shift);
                    const fixedPos = v2.data.pos;
                    link.transformCP(newPos, previousPos, fixedPos);
                    link.data.cp_canvas_pos = this.view.create_canvas_coord(link.data.cp);
                }else if(verticesContained.has(link.endVertex.index)) { // and thus not v1
                    const newPos = v2.data.pos;
                    const previousPos = this.view.create_server_coord_from_subtranslated(v2.data.canvas_pos, shift);
                    const fixedPos = v1.data.pos;
                    link.transformCP(newPos, previousPos, fixedPos);
                    link.data.cp_canvas_pos = this.view.create_canvas_coord(link.data.cp);
                }
            }
        }
        translate_by_canvas_vect(area, shift, this.view);
    }


    emitSubdivideLink(linkIndex: number, pos: Coord, weight: string, color: Color, callback: (response: number) => void) {
        socket.emit(SocketMsgType.SUBDIVIDE_LINK, linkIndex, pos, weight, color, callback);
    }

    emit_redo() {
        socket.emit(SocketMsgType.REDO);
    }

    emit_undo() {
        socket.emit(SocketMsgType.UNDO);
    }

    emit_translate_elements(indices: Array<[BoardElementType,number]>, shift: Vect){
        socket.emit(SocketMsgType.TRANSLATE_ELEMENTS, indices, shift);
    }

    emit_delete_elements(indices: Array<[BoardElementType,number]>){
        socket.emit(SocketMsgType.DELETE_ELEMENTS, indices);
    }

    emit_update_element(type: BoardElementType, index: number, attribute: string, value: any){
        socket.emit(SocketMsgType.UPDATE_ELEMENT, type, index, attribute, value);
    }

    emit_vertices_merge(index1: number, index2: number){
        socket.emit(SocketMsgType.MERGE_VERTICES, index1, index2);
    }

    emit_paste_graph(graph: ClientGraph){
        console.log([...graph.links.entries()]);
        socket.emit(SocketMsgType.PASTE_GRAPH, [...graph.vertices.entries()], [...graph.links.entries()]);
    }

    emit_resize_element(type: BoardElementType, index: number, pos: Coord, resize_type: RESIZE_TYPE){
        socket.emit(SocketMsgType.RESIZE_ELEMENT, type, index, pos.x, pos.y, resize_type);
    }

    emit_apply_modifyer(modifyer: GraphModifyer){
        console.log("Emit: apply modifier")
        const attributes_data = new Array<string | number>();
        let sendVerticesSelection = false;
        for (const attribute of modifyer.attributes){
            if ( attribute instanceof AreaIndex ){
                if (attribute.value == AreaChoice.INDUCED_GRAPH_BY_SELECTED_VERTICES){
                    sendVerticesSelection = true;
                }
            }
            attributes_data.push(attribute.value);
        }
        if ( sendVerticesSelection){
            const verticesSelection = new Array<number>();
            for (const vertex of this.graph.vertices.values()){
                if (vertex.data.is_selected){
                    verticesSelection.push(vertex.index);
                }
            }
            socket.emit(SocketMsgType.APPLY_MODIFYER, modifyer.name, attributes_data, verticesSelection);
        }
        else {
            socket.emit(SocketMsgType.APPLY_MODIFYER, modifyer.name, attributes_data);
        }
    }

    // Note: sometimes element is a server class, sometimes a client
    // Normally it should be only server
    // TODO: improve that
    emit_add_element(element: ClientVertexData | LinkPreData | ClientStroke | Area | TextZone, callback: (response: number) => void  ){
        switch(element.constructor){
            case ClientVertexData: {
                const vertexData = element as ClientVertexData;
                socket.emit(SocketMsgType.ADD_ELEMENT, BoardElementType.Vertex, {pos: vertexData.pos, color: vertexData.color, weight: vertexData.weight}, callback);
                break;
            }
            case LinkPreData: {
                const data = element as LinkPreData;
                socket.emit(SocketMsgType.ADD_ELEMENT, BoardElementType.Link, {start_index: data.startIndex, end_index: data.endIndex, orientation: data.orientation, weight: data.weight, color: data.color}, callback);
                break;
            }
            case ClientStroke: {
                const stroke = element as ClientStroke;
                socket.emit(SocketMsgType.ADD_ELEMENT , BoardElementType.Stroke, {points: [... stroke.positions.entries()], color: stroke.color, width: stroke.width}, callback);
                break;
            }
            case TextZone: {
                const text_zone = element as TextZone;
                socket.emit(SocketMsgType.ADD_ELEMENT, BoardElementType.TextZone, {pos: text_zone.pos}, callback);
                break;
            }
            case Area: {
                const area = element as Area;
                socket.emit(SocketMsgType.ADD_ELEMENT, BoardElementType.Area, {c1: area.c1, c2: area.c2, label: area.label, color: area.color }, callback);
                break;
            }
        }
    }

    // method change_camera -> update_canvas_pos de tous les éléments



    
    setGraphClipboard(graph: ClientGraph, pos_at_click: CanvasCoord, is_coming_from_clipboard: boolean){
        this.graphClipboard = graph;
        this.clipboardInitPos = pos_at_click;
        this.isGraphClipboardGenerated = is_coming_from_clipboard;
        this.canvas.style.cursor = "grab";
    }
    
   pasteGeneratedGraph() {
        if ( typeof this.graphClipboard != "undefined"){
            this.emit_paste_graph(this.graphClipboard);
        }
    }
    
    clearGraphClipboard(){
        this.graphClipboard = undefined;
        this.canvas.style.cursor = "auto";
        this.isGraphClipboardGenerated = false;
        this.clipboardInitPos = undefined;
    }

    translateGraphClipboard(previousCanvasShift: CanvasVect, pos: CanvasCoord){
        if (typeof this.graphClipboard == "undefined" || typeof this.clipboardInitPos == "undefined") return;
        const shift = CanvasVect.from_canvas_coords(this.clipboardInitPos, pos);
        this.graphClipboard.translate_by_canvas_vect( shift.sub(previousCanvasShift), this.view);
        previousCanvasShift.set_from(shift);
        this.draw()
    }



    /**
     * Set the the canvasPos of users from their ServerPos in function of the camera.
     */
    updateOtherUsersCanvasPos() {
        for (const user of this.otherUsers.values()){
            if ( typeof user.pos != "undefined"){
                user.canvas_pos = this.view.create_canvas_coord(user.pos);
            }
        }
    }


    update_user_list_div() {
        const div = document.getElementById("user_list");
        if (div == null) return;
        div.innerHTML = "";
        if (this.otherUsers.size === 0) {
            div.style.visibility = "hidden";
            // div.style.marginLeft = "0px";
            div.style.padding = "0px";
        }
        else {
            div.style.visibility = "visible";
            div.style.padding = "2px";
            // div.style.marginLeft = "10px";
        }
    
        for (let u of this.otherUsers.values()) {
            let newDiv = document.createElement("div");
            newDiv.classList.add("user");
            newDiv.style.color = u.multicolor.contrast;
            newDiv.innerHTML = u.label.substring(0, 1);
            newDiv.title = "Click to follow " + u.label;
            newDiv.style.background = u.multicolor.color;
            newDiv.style.borderColor = u.multicolor.color;
            newDiv.dataset.label = u.label;
    
            const board = this;
            newDiv.onclick = function () {
                if(board.selfUser.following === u.id){
                    board.selfUser.unfollow(u.id);
                }
                else{
                    board.selfUser.follow(u.id, board.otherUsers);
                }
            }
            div.appendChild(newDiv);
        }
    }



    /**
     * For the moment it only center the view on the vertices
     */
    centerViewOnEverything(){
        let top_left_corner = new CanvasCoord(-this.canvas.width/2, -this.canvas.height/2);
        let bot_right_corner = new CanvasCoord(this.canvas.width/2, this.canvas.height/2);

        if(this.graph.vertices.size > 1){
            const v : ClientVertex = this.graph.vertices.values().next().value;
            let xMin = v.data.canvas_pos.x;
            let yMin = v.data.canvas_pos.y;
            let xMax = v.data.canvas_pos.x;
            let yMax = v.data.canvas_pos.y;

            for(const u of this.graph.vertices.values()){
                xMin = Math.min(xMin, u.data.canvas_pos.x);
                yMin = Math.min(yMin, u.data.canvas_pos.y);
                xMax = Math.max(xMax, u.data.canvas_pos.x);
                yMax = Math.max(yMax, u.data.canvas_pos.y);
            }

            top_left_corner = new CanvasCoord(xMin, yMin);
            bot_right_corner = new CanvasCoord(xMax, yMax);
        }
        else if(this.graph.vertices.size === 1){
            const v: ClientVertex = this.graph.vertices.values().next().value;
            let xMin = v.data.canvas_pos.x - this.canvas.width/2;
            let yMin = v.data.canvas_pos.y - this.canvas.height/2;
            let xMax = v.data.canvas_pos.x + this.canvas.width/2;
            let yMax = v.data.canvas_pos.y + this.canvas.height/2;
            top_left_corner = new CanvasCoord(xMin, yMin);
            bot_right_corner = new CanvasCoord(xMax, yMax);
        }

        center_canvas_on_rectangle(this.view, top_left_corner, bot_right_corner, this);
        this.update_after_camera_change();
    }







    toggle_dark_mode(){
        if(this.view.dark_mode == false){
            this.view.dark_mode = true;
            COLOR_BACKGROUND = "#1e1e1e";
            COLOR_BORDER_VERTEX = "#ffffff";
            document.documentElement.style.setProperty(`--background_color_div`, "#ffffff"); 
            document.documentElement.style.setProperty(`--color_div`, "#000000"); 
            document.documentElement.style.setProperty(`--background_color_page`, COLOR_BACKGROUND); 
            
            document.querySelectorAll("img").forEach( img => {
                img.style.filter = "";
            })
        }
        else{
            this.view.dark_mode = false;
            COLOR_BACKGROUND = "#fafafa";
            COLOR_BORDER_VERTEX = "#000000";
            
            document.documentElement.style.setProperty(`--background_color_div`, "#202124"); 
            document.documentElement.style.setProperty(`--color_div`, "#ffffff"); 
            document.documentElement.style.setProperty(`--background_color_page`, COLOR_BACKGROUND); 
    
            document.querySelectorAll("img").forEach( img => {
                img.style.filter = "invert(100%) sepia(0%) saturate(2%) hue-rotate(115deg) brightness(102%) contrast(100%)";
            })
        }
    }
}