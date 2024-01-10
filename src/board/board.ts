import { Area, Board, Coord, GeneratorId, Option, Rectangle, TextZone, Vect } from "gramoloss";
import { DOWN_TYPE, RESIZE_TYPE } from "../interactors/interactor";
import { GraphModifyer } from "../modifyers/modifyer";
import { socket } from "../socket";
import { ClientArea } from "./area";
import { Camera } from "./display/camera";
import { ClientGraph } from "./graph";
import { ClientLink, ClientLinkData, LinkPreData } from "./link";
import { ClientRectangle } from "./rectangle";
import { ClientRepresentation } from "./representations/client_representation";
import { is_click_over, resize_type_nearby, translate_by_canvas_vect } from "./resizable";
import { ClientStroke } from "./stroke";
import { ClientTextZone } from "./text_zone";
import { CanvasVect } from "./display/canvasVect";
import { ClientVertex, ClientVertexData } from "./vertex";
import { CanvasCoord } from "./display/canvas_coord";
import { Var, VariableNumber, VariableBoolean } from "./variable";
import { drawBezierCurve, drawLine, drawCircle } from "./display/draw_basics";
import { Color } from "./display/colors_v2";
import { User } from "../user";
import { PreInteractor } from "../side_bar/pre_interactor";
import { ELEMENT_DATA, ELEMENT_DATA_AREA, ELEMENT_DATA_CONTROL_POINT, ELEMENT_DATA_LINK, ELEMENT_DATA_RECTANGLE, ELEMENT_DATA_REPRESENTATION, ELEMENT_DATA_REPRESENTATION_SUBELEMENT, ELEMENT_DATA_STROKE, ELEMENT_DATA_TEXT_ZONE, ELEMENT_DATA_VERTEX } from "../interactors/pointed_element_data";
import { AreaChoice, AreaIndex } from "../generators/attribute";
import { EntireZone } from "../parametors/zone";
import { Self } from "../self_user";
import { Grid, GridType } from "./display/grid";
import { makeid } from "../utils";
import { CrossMode, TwistMode } from "./stanchion";


export const SELECTION_COLOR = 'gray' // avant c'était '#00ffff'
export let COLOR_BACKGROUND = "#1e1e1e";
export const VERTEX_RADIUS = 8;
export const COLOR_ALIGNEMENT_LINE = "#333333";
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

export function boardElementType(element: ClientVertex | ClientLink){
    if (element instanceof ClientVertex){
        return BoardElementType.Vertex;
    } else {
        return BoardElementType.Link;
    }
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
    SUBDIVIDE_LINK = "subdivide_link",
    GENERATE_GRAPH = "generate-graph",
    GetParameterInfo = "get-parameter-info"
}

export enum INDEX_TYPE {
    NONE,
    NUMBER_STABLE,
    NUMBER_UNSTABLE,
    ALPHA_STABLE,
    ALPHA_UNSTABLE
}


export class ClientBoard extends Board<ClientVertexData, ClientLinkData, ClientStroke, ClientArea, ClientTextZone, ClientRepresentation, ClientRectangle> {
    camera: Camera;
    graph: ClientGraph;
    variables: Map<string, Var>;
    variablesDiv: HTMLDivElement;
    elementOver: undefined | ClientVertex | ClientLink | ClientStroke | ClientRectangle;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    selfUser: Self;
    colorSelected: Color;
    keyPressed: Set<string>;
    interactorLoaded: Option<PreInteractor>;
    interactorLoadedId: Option<string>;

    graphClipboard: Option<ClientGraph>;
    isGraphClipboardGenerated: boolean;
    clipboardInitPos: Option<CanvasCoord>;
    clipboard: Array<ClientVertex | ClientLink | ClientStroke | ClientRectangle>;

    otherUsers: Map<string, User>;

    entireZone: EntireZone;

    private agregId: string;

    // Display parameters
    private indexType: INDEX_TYPE;
    private darkMode: boolean;
    isDrawingInteractor: boolean;
    grid: Grid;
    is_aligning: boolean;
    alignement_horizontal_y: Option<number>;
    alignement_vertical_x: Option<number>;


    constructor(){
        super();

        this.selfUser = new Self();
        this.otherUsers = new Map();
        this.colorSelected = Color.Neutral;
        this.keyPressed = new Set<string>();
        this.interactorLoaded = undefined;
        this.interactorLoadedId = undefined;
        this.isGraphClipboardGenerated = false;  
        this.agregId = makeid(5);    
        this.clipboard = new Array();
        
        // Display parameters
        this.indexType = INDEX_TYPE.NONE;
        this.darkMode = true;
        this.isDrawingInteractor = true;
        this.grid = new Grid();
        this.is_aligning = false;



        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.canvas.id = "main";
        const ctx = this.canvas.getContext('2d');
        if (ctx == null) throw Error("Cannot get context 2d of canvas");
        this.ctx = ctx; 
        


        this.camera = new Camera();
        this.graph = new ClientGraph(this);
        
        
        this.elementOver = undefined;

        this.variables = new Map();
        this.variablesDiv = document.createElement("div");
        this.variablesDiv.id = "variablesDiv";
        document.body.appendChild(this.variablesDiv);

        // setup the div of the loaded params of the whole graph
        this.entireZone = new EntireZone(this);


        const board = this;
        this.canvas.onmouseleave = ((e) => {
            board.isDrawingInteractor = false;
            board.draw();
        });
    
        this.canvas.onmouseenter = ((e) => {
            board.isDrawingInteractor = true;
            board.draw();
        })


    }

    copySelectedElements(mousePos: CanvasCoord){
        this.clearClipboard();
        this.clipboardInitPos = mousePos;
        this.canvas.style.cursor = "grab";

        // TODO generalize to elements of board

        // Vertices
        const newVertices = new Map();
        for (const [index, v] of this.graph.vertices.entries()) {
            if (v.data.is_selected){
                const data = new ClientVertexData(v.data.pos.x, v.data.pos.y, v.data.weight, this.camera, v.data.color);
                const newVertex = new ClientVertex(index, data, this);
                this.clipboard.push(newVertex);
                newVertices.set(newVertex.index, newVertex);
            }
        }

        // Links
        for (const [index, link] of this.graph.links.entries()){
            if (link.data.is_selected){
                const cp = (typeof link.data.cp == "undefined") ? undefined : link.data.cp.copy();
                const data = new ClientLinkData(cp, link.data.color, link.data.weight, this.camera);
                const startVertex = newVertices.get(link.startVertex.index);
                const endVertex = newVertices.get(link.endVertex.index);
                if (typeof startVertex == "undefined" || typeof endVertex == "undefined") continue;
                const newLink = new ClientLink(index, startVertex, endVertex, link.orientation, data, this );
                this.clipboard.push(newLink);
            }
        }

        // Strokes
        for (const [index, stroke] of this.strokes.entries()){
            if (stroke.isSelected){
                const positionsCopied = new Array();
                for (const pos of stroke.positions){
                    positionsCopied.push(pos.copy());
                }
                const newStroke = new ClientStroke(positionsCopied, stroke.color, stroke.width, this.camera, index);
                this.clipboard.push(newStroke);
            }
        }

        // Rectangles
        for (const [index, rectangle] of this.rectangles.entries()){
            if (rectangle.isSelected){
                console.log("rectnagle", index);
                const newRectangle = new ClientRectangle(rectangle.c1.copy(), rectangle.c2.copy(), rectangle.color, this, rectangle.index);
                this.clipboard.push(newRectangle);
            }
        }
    }

    clearClipboard(){
        this.clipboard.splice(0,this.clipboard.length);
        this.clipboardInitPos = undefined;
        this.canvas.style.cursor = "default";
    }

    translateClipboard(previousCanvasShift: CanvasVect, pos: CanvasCoord){
        if (this.clipboard.length == 0) return;
        if (typeof this.clipboardInitPos == "undefined") return;
        const shift = CanvasVect.from_canvas_coords(this.clipboardInitPos, pos);
        const cShift = shift.sub(previousCanvasShift);
        for (const element of this.clipboard){
            if (element instanceof ClientStroke || element instanceof ClientVertex){
                element.translate_by_canvas_vect( cShift , this.camera);
            } else if (element instanceof ClientLink){
                element.translate_cp_by_canvas_vect(cShift, this.camera);
            } if (element instanceof ClientRectangle){
                translate_by_canvas_vect(element, cShift, this.camera);
            }
        }

        previousCanvasShift.set_from(shift);
        this.draw()
    }


    drawClipboard(){
        for (const element of this.clipboard){
            element.draw(this);
        }
    }

    sendRequestPasteClipboard(){
        const data = new Array();

        for (const element of this.clipboard){
            if (element instanceof ClientVertex){
                data.push( {
                    type: "Vertex",
                    index: element.index, 
                    x: element.data.pos.x, 
                    y: element.data.pos.y, 
                    color: element.data.color, 
                    weight: element.data.weight
                })
            } else if (element instanceof ClientLink){
                data.push( {
                    type: "Link",
                    index: element.index, 
                    startIndex: element.startVertex.index, 
                    endIndex: element.endVertex.index,
                    orientation: element.orientation,
                    color: element.data.color,
                    weight: element.data.weight,
                    cp: element.data.cp
                })
            } else if (element instanceof ClientStroke){
                data.push({
                    type: "Stroke",
                    index: element.index,
                    color: element.color,
                    width: element.width,
                    positions: element.positions
                })
            } else if (element instanceof ClientRectangle){
                data.push({
                    type: "Rectangle",
                    index: element.index,
                    color: element.color,
                    x1: element.c1.x,
                    x2: element.c2.x,
                    y1: element.c1.y,
                    y2: element.c2.y
                })
            }
        }
        
        socket.emit(SocketMsgType.PASTE_GRAPH, data);
    }


    selectElement(element: ClientRectangle | ClientStroke){
        if (element.isSelected) {
            if (this.keyPressed.has("Control")) { 
                element.isSelected = false;
            }
        }
        else {
            if (this.keyPressed.has("Control")) { 
                element.isSelected = true;
            }
            else {
                this.clear_all_selections();
                element.isSelected = true;
            }
        }
    }

    setIndexType(newIndexType: INDEX_TYPE){
        if (this.indexType != newIndexType){
            this.indexType = newIndexType;
            this.graph.compute_vertices_index_string();
        }
    }

    getIndexType(): INDEX_TYPE {
        return this.indexType;
    }

    afterVariableChange(){
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
        const canvasp1 = this.camera.create_canvas_coord(p1);
        const canvasc1 = this.camera.create_canvas_coord(c1);
        const canvasc2 = this.camera.create_canvas_coord(c2);
        const canvasp2 = this.camera.create_canvas_coord(p2);
        const scaledWidth = width*this.camera.zoom;
        drawBezierCurve(this.ctx, canvasp1, canvasc1, canvasc2, canvasp2, color, scaledWidth);
    }

    drawLine(ctx: CanvasRenderingContext2D, p1: Coord, p2: Coord, color: string, width: number){
        const canvasP1 = this.camera.create_canvas_coord(p1);
        const canvasP2 = this.camera.create_canvas_coord(p2);
        const scaledWidth = width*this.camera.zoom;
        drawLine(canvasP1, canvasP2, this.ctx, color, scaledWidth);
    }

    drawLineUnscaled(p1: Coord, p2: Coord, color: string, width: number){
        const canvasP1 = this.camera.create_canvas_coord(p1);
        const canvasP2 = this.camera.create_canvas_coord(p2);
        drawLine(canvasP1, canvasP2, this.ctx, color, width);
    }

    drawCanvasLine(p1: CanvasCoord, p2: CanvasCoord, color: string, width: number){
        const scaledWidth = width*this.camera.zoom;
        drawLine(p1, p2, this.ctx, color, scaledWidth);
    }

    drawCircle(center: Coord, radius: number, color: string, alpha: number){
        const canvasCenter = this.camera.create_canvas_coord(center);
        drawCircle(canvasCenter, color, radius, alpha, this.ctx)
    }

    drawCanvasCircle(center: CanvasCoord, radius: number, color: string, alpha: number){
        drawCircle(center, color, radius, alpha, this.ctx)
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
     * The alignement lines with other vertices.
     */
    drawAlignements() {
        if (typeof this.alignement_horizontal_y == "number" ) {
            drawLine(new CanvasCoord(0, this.alignement_horizontal_y), new CanvasCoord(window.innerWidth, this.alignement_horizontal_y), this.ctx, COLOR_ALIGNEMENT_LINE, 3);
        }
        if (typeof this.alignement_vertical_x == "number") {
            drawLine(new CanvasCoord(this.alignement_vertical_x, 0), new CanvasCoord(this.alignement_vertical_x, window.innerHeight), this.ctx, COLOR_ALIGNEMENT_LINE, 3);
        }
    }


    drawInteractor() {
        if (this.isDrawingInteractor && typeof this.interactorLoaded != "undefined"){
            this.interactorLoaded.draw(this, this.selfUser.canvasPos)
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
        this.grid.draw(this.canvas, this.ctx, this.camera);
        this.representations.forEach(rep => rep.draw(this.ctx, this.camera));
        this.rectangles.forEach(rectangle => rectangle.draw());
        this.strokes.forEach(stroke => stroke.draw(this));
        this.areas.forEach(area => area.draw(this));
        this.drawAlignements();
        this.graph.draw();

        this.otherUsers.forEach(user => user.draw(this.canvas, this.ctx));
        this.drawInteractor();
        if (typeof this.graphClipboard != "undefined"){
            this.graphClipboard.draw();
        }
        this.drawClipboard();
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
        // camera.window_height = window.innerHeight;
        // camera.window_width = window.innerWidth;
        const board = this;
        requestAnimationFrame(function () { board.draw() })
    }

    drawBackground() {
        this.ctx.beginPath();
        this.ctx.fillStyle = COLOR_BACKGROUND;
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fill();
    }



    



    /**
     * Return true if an element has been erased.
     * Emit delete_elements alone.
     */
    eraseAt(e: CanvasCoord, eraseDistance: number) : boolean{
        for (const [index, s] of this.strokes.entries()) {
            if (s.is_nearby(e, this.camera) !== false) {
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
            if (this.graph.is_click_over_link(index, e, this.camera)) {
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
        for(const [index,rectangle] of this.rectangles.entries()){
            if( is_click_over(rectangle, e) ){
                this.emit_delete_elements([[BoardElementType.Rectangle, index]]);
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
        this.rectangles.clear();
    }

    translateCamera(shift: CanvasVect){
        this.camera.translate_camera(shift);
        this.update_after_camera_change();
        if(typeof this.selfUser.following != "undefined"){
            this.selfUser.unfollow(this.selfUser.following);
        }
        socket.emit("my_view", this.camera.camera.x, this.camera.camera.y, this.camera.zoom);
    }

    update_after_camera_change(){
        this.grid.updateToZoom(this.camera.zoom);
        for (const stroke of this.strokes.values()){
            stroke.update_after_camera_change(this.camera);
        }
        for ( const text_zone of this.text_zones.values()){
            text_zone.update_after_camera_change(this.camera);
        }
        for (const rep of this.representations.values()){
            rep.update_after_camera_change(this.camera);
        }
        for (const rect of this.rectangles.values()){
            rect.update_after_camera_change(this.camera);
        }
        for (const area of this.areas.values()){
            area.update_after_camera_change(this.camera);
        }

        for (const v of this.graph.vertices.values()) {
            v.update_after_view_modification(this.camera);
        }
        for (const link of this.graph.links.values()) {
            link.update_after_view_modification(this.camera);
        }
        this.updateOtherUsersCanvasPos()
    }

    select_elements_in_rect(corner1: CanvasCoord, corner2: CanvasCoord) {
        this.graph.select_vertices_in_rect(corner1, corner2);
        this.graph.select_links_in_rect(corner1, corner2);

        for (const stroke of this.strokes.values()){
            if (stroke.is_in_rect(corner1,corner2)){
                stroke.isSelected = true;   
            }
        }
        for (const rectangle of this.rectangles.values()){
            if (rectangle.isInRect(corner1, corner2)){
                rectangle.isSelected = true;
            }
        }
    }


    create_text_zone(canvas_pos: CanvasCoord): number{
        let index = 0;
        while (this.text_zones.has(index)) {
            index += 1;
        }
        const pos = this.camera.create_server_coord(canvas_pos);
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
            if (stroke.is_nearby(pos, this.camera)){
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
                const subElementIndex = rep.click_over(pos, this.camera);
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
            if (interactable_element_type.has(DOWN_TYPE.LINK) && this.graph.is_click_over_link(index, pos, this.camera)) {
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
                if (s.is_nearby(pos, this.camera)){     
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
            s.isSelected = false;
        });
    }

    selectConnectedComponent(vIndex: number){
        const c = this.graph.get_connected_component_of(vIndex);
        const vertexIndices = new Set();
        const linkIndices = new Set();
        for (const index of c.vertices.keys()){
            vertexIndices.add(index);
        }
        for (const index of c.links.keys()){
            linkIndices.add(index);
        }
        for (const vertex of this.graph.vertices.values()){
            if (vertexIndices.has(vertex.index)){
                vertex.data.is_selected = true;
            }
        }
        for (const link of this.graph.links.values()){
            if (linkIndices.has(link.index)){
                link.data.is_selected = true;
            }
        }
    }


    clear_all_selections() {
        this.graph.deselect_all_vertices();
        this.graph.deselect_all_links();
        this.deselect_all_strokes();
        for (const rectangle of this.rectangles.values()){
            rectangle.isSelected = false;
        }
    }

   

    translate_area(shift: CanvasVect, area: ClientArea, verticesContained: Set<number>){
        this.graph.vertices.forEach((vertex, vertexIndex) => {
            if (verticesContained.has(vertexIndex)){
                vertex.translate_by_canvas_vect(shift, this.camera);
            }
        })
        for( const link of this.graph.links.values()){
            if ( typeof link.data.cp != "undefined"){
                const v1 = link.startVertex;
                const v2 = link.endVertex;
                if(verticesContained.has(link.startVertex.index) && verticesContained.has(link.endVertex.index)){
                    link.translate_cp_by_canvas_vect(shift, this.camera);
                }
                else if(verticesContained.has(link.startVertex.index)){ // and thus not v2
                    const newPos = v1.data.pos;
                    const previousPos = this.camera.create_server_coord_from_subtranslated(v1.data.canvas_pos, shift);
                    const fixedPos = v2.data.pos;
                    link.transformCP(newPos, previousPos, fixedPos);
                    link.data.cp_canvas_pos = this.camera.create_canvas_coord(link.data.cp);
                }else if(verticesContained.has(link.endVertex.index)) { // and thus not v1
                    const newPos = v2.data.pos;
                    const previousPos = this.camera.create_server_coord_from_subtranslated(v2.data.canvas_pos, shift);
                    const fixedPos = v1.data.pos;
                    link.transformCP(newPos, previousPos, fixedPos);
                    link.data.cp_canvas_pos = this.camera.create_canvas_coord(link.data.cp);
                }
            }
        }
        translate_by_canvas_vect(area, shift, this.camera);
    }


    /**
     * Regenerate the agregation id
     */
    regenAgregId(){
        this.agregId = makeid(5);
    }


    emitSubdivideLink(linkIndex: number, pos: Coord, weight: string, color: Color, callback: (response: number) => void) {
        socket.emit(SocketMsgType.SUBDIVIDE_LINK, linkIndex, pos, weight, color, callback);
    }

    emitGenerateGraph(generatorId: GeneratorId, params: Array<any>) {
        socket.emit(SocketMsgType.GENERATE_GRAPH, this.camera.create_server_coord(new CanvasCoord(this.canvas.width/2,this.canvas.height/2 )), generatorId, params );
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
        console.log("emit delete elements: ", indices);
        socket.emit(SocketMsgType.DELETE_ELEMENTS, this.agregId, indices);
    }

    emit_update_element(type: BoardElementType, index: number, attribute: string, value: any){
        socket.emit(SocketMsgType.UPDATE_ELEMENT, this.agregId, type, index, attribute, value);
    }

    emit_vertices_merge(index1: number, index2: number){
        socket.emit(SocketMsgType.MERGE_VERTICES, index1, index2);
    }

    emit_paste_graph(graph: ClientGraph){
        
        const data = new Array();
        for (const vertex of graph.vertices.values()){
            data.push( {
                type: "Vertex",
                index: vertex.index, 
                x: vertex.data.pos.x, 
                y: vertex.data.pos.y, 
                color: vertex.data.color, 
                weight: vertex.data.weight
            })
        }
        
        for (const link of graph.links.values()){
            data.push( {
                type: "Link",
                index: link.index, 
                startIndex: link.startVertex.index, 
                endIndex: link.endVertex.index,
                orientation: link.orientation,
                color: link.data.color,
                weight: link.data.weight,
                cp: link.data.cp
            })
        }
        
        
        socket.emit(SocketMsgType.PASTE_GRAPH, data);
    }




    emit_resize_element(type: BoardElementType, index: number, pos: Coord, resize_type: RESIZE_TYPE){
        socket.emit(SocketMsgType.RESIZE_ELEMENT, type, index, pos.x, pos.y, resize_type);
    }

    emitGetParameterInfo(paramId: string, callback: (response: string) => void){
        socket.emit(SocketMsgType.GetParameterInfo, paramId, callback);
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
    emit_add_element(element: ClientVertexData | LinkPreData | ClientStroke | Area | TextZone | Rectangle, callback: (response: number) => void  ){
        if (element instanceof Rectangle){
            socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.Rectangle, {c1: element.c1, c2: element.c2, color: element.color}, callback);
        }
        switch(element.constructor){
            case ClientVertexData: {
                const vertexData = element as ClientVertexData;
                socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.Vertex, {pos: vertexData.pos, color: vertexData.color, weight: vertexData.weight}, callback);
                break;
            }
            case LinkPreData: {
                const data = element as LinkPreData;
                socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.Link, {start_index: data.startIndex, end_index: data.endIndex, orientation: data.orientation, weight: data.weight, color: data.color}, callback);
                break;
            }
            case ClientStroke: {
                const stroke = element as ClientStroke;
                socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.Stroke, {points: [... stroke.positions.entries()], color: stroke.color, width: stroke.width}, callback);
                break;
            }
            case TextZone: {
                const text_zone = element as TextZone;
                socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.TextZone, {pos: text_zone.pos}, callback);
                break;
            }
            case Area: {
                const area = element as Area;
                socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.Area, {c1: area.c1, c2: area.c2, label: area.label, color: area.color }, callback);
                break;
            }
        }
    }




    
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
        this.graphClipboard.translate_by_canvas_vect( shift.sub(previousCanvasShift), this.camera);
        previousCanvasShift.set_from(shift);
        this.draw()
    }



    /**
     * Set the the canvasPos of users from their ServerPos in function of the camera.
     */
    updateOtherUsersCanvasPos() {
        for (const user of this.otherUsers.values()){
            if ( typeof user.pos != "undefined"){
                user.canvas_pos = this.camera.create_canvas_coord(user.pos);
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

        this.centerCameraOnRectangle(top_left_corner, bot_right_corner);
    }


    centerCameraOnRectangle(c1: CanvasCoord, c2: CanvasCoord){
        this.camera.centerOnRectangle(c1, c2, this.canvas);
        this.update_after_camera_change();
    }




    isDarkMode(){
        return this.darkMode;
    }

    toggle_dark_mode(){
        if(this.darkMode == false){
            this.darkMode = true;
            COLOR_BACKGROUND = "#1e1e1e";
            COLOR_BORDER_VERTEX = "#ffffff";
            document.documentElement.style.setProperty(`--background_color_div`, "#ffffff"); 
            document.documentElement.style.setProperty(`--color_div`, "#000000"); 
            document.documentElement.style.setProperty(`--background_color_page`, COLOR_BACKGROUND); 
            
            document.querySelectorAll("img").forEach( img => {
                img.style.filter = "";
            })

            // document.querySelectorAll("div.element-label, div.text_zone").forEach( (div) => {
            //     (div as HTMLDivElement).style.color = "white";
            // })

        }
        else{
            this.darkMode = false;
            COLOR_BACKGROUND = "#fafafa";
            COLOR_BORDER_VERTEX = "#000000";
            
            document.documentElement.style.setProperty(`--background_color_div`, "#202124"); 
            document.documentElement.style.setProperty(`--color_div`, "#ffffff"); 
            document.documentElement.style.setProperty(`--background_color_page`, COLOR_BACKGROUND); 
    
            document.querySelectorAll("img").forEach( img => {
                img.style.filter = "invert(100%) sepia(0%) saturate(2%) hue-rotate(115deg) brightness(102%) contrast(100%)";
            })

            // document.querySelectorAll("div.element-label, div.text_zone").forEach( (div) => {
            //     (div as HTMLDivElement).style.color = "black";
            // })
        }
        this.draw();
    }


    setGridType(type: Option<GridType>) {
        this.grid.type = type;
    }

}