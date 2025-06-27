import {  Coord, EmbeddedGraph, GeneratorId, Option, ORIENTATION, TextZone, Vect } from "gramoloss";
import { DOWN_TYPE, RESIZE_TYPE } from "../interactors/interactor";
import { GraphModifyer } from "../modifyers/modifyer";
import { socket } from "../socket";
import { Camera } from "./display/camera";
import { CanvasVect } from "./display/canvasVect";
import { CanvasCoord } from "./display/canvas_coord";
import { Var, VariableNumber, VariableBoolean } from "./variable";
import { drawBezierCurve, drawLine, drawCircle } from "./display/draw_basics";
import { Color, colorsData, getCanvasColor } from "./display/colors_v2";
import { User } from "../user";
import { PreInteractor } from "../side_bar/pre_interactor";
import { ELEMENT_DATA, ELEMENT_DATA_CONTROL_POINT, ELEMENT_DATA_LINK, ELEMENT_DATA_RECTANGLE, ELEMENT_DATA_REPRESENTATION, ELEMENT_DATA_REPRESENTATION_SUBELEMENT, ELEMENT_DATA_STROKE, ELEMENT_DATA_TEXT_ZONE, ELEMENT_DATA_VERTEX } from "../interactors/pointed_element_data";
import { Self } from "../self_user";
import { Grid, GridType } from "./display/grid";
import { makeid } from "../utils";
import { BoardElement, LinkElement, LinkPreData, ShapeElement, VertexElement, VertexPreData } from "./element";
import { Graph2, LinkData2, VertexData2 } from "./graph2";
import { TextZoneElement } from "./elements/textZone";
import { StrokeElement } from "./elements/stroke2";
import { VerticesSubset } from "./vertices_subset";
import { ShapePreData } from "./elements/rectangle";
import { EntireZone } from "../parametors/zone";


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
    Representation = "Representation",
    Local = "Local"
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
    GetParameterInfo = "get-parameter-info",
    PARSE_DOT = "import_file"
}

export enum INDEX_TYPE {
    NONE,
    NUMBER_STABLE,
    NUMBER_UNSTABLE,
    ALPHA_STABLE,
    ALPHA_UNSTABLE
}


export class ClientBoard  {
    camera: Camera;
    variables: Map<string, Var>;
    variablesDiv: HTMLDivElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    selfUser: Self;
    colorSelected: Color;
    keyPressed: Set<string>;
    interactorLoaded: Option<PreInteractor>;
    interactorLoadedId: Option<string>;

    elements: Map<number, BoardElement>;
    svgContainer: SVGElement;
    elementCounter: number = 0;

    g: Graph2;

    shapesGroup: SVGElement;
    linksGroup: SVGElement;
    verticesGroup: SVGElement;


    isGraphClipboardGenerated: boolean;
    clipboardInitPos: Option<CanvasCoord>;

    otherUsers: Map<string, User>;


    private agregId: string;

    // Display parameters
    private darkMode: boolean;
    isDrawingInteractor: boolean;
    grid: Grid;
    isAligning: boolean;
    alignement_horizontal_y: Option<number>;
    alignement_vertical_x: Option<number>;


    constructor(container: HTMLElement){

        this.g = new Graph2();

        this.elements = new Map();
        this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        container.appendChild(this.svgContainer);
        // this.svgContainer.style.position = 'absolute';
        this.svgContainer.setAttribute("width", "100vw");
        this.svgContainer.setAttribute("height", "100vh");
        this.svgContainer.setAttribute("viewBox", " 0 100 100");


        this.selfUser = new Self();
        this.otherUsers = new Map();
        this.colorSelected = Color.Neutral;
        this.keyPressed = new Set<string>();
        this.interactorLoaded = undefined;
        this.interactorLoadedId = undefined;
        this.isGraphClipboardGenerated = false;  
        this.agregId = makeid(5);    
        
        // Display parameters
        this.darkMode = true;
        this.isDrawingInteractor = true;
        this.grid = new Grid();
        this.isAligning = false;


    


        this.canvas = document.createElement("canvas");
        container.appendChild(this.canvas);
        this.canvas.id = "main";
        const ctx = this.canvas.getContext('2d');
        if (ctx == null) throw Error("Cannot get context 2d of canvas");
        this.ctx = ctx; 

         // Create layers for shapes, links and vertices
        this.shapesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.linksGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.verticesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        this.shapesGroup.setAttribute("id", "shapes-layer");
        this.linksGroup.setAttribute("id", "links-layer");
        this.verticesGroup.setAttribute("id", "vertices-layer");

        this.svgContainer.appendChild(this.shapesGroup);
        this.svgContainer.appendChild(this.linksGroup);
        this.svgContainer.appendChild(this.verticesGroup);

        

        // Init arrow head markers
        // One for each color
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

        for (const color of colorsData){
            const markerId = `arrow-head-${color[0]}`;
            const arrowMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
            
            arrowMarker.setAttribute("id", markerId);
            arrowMarker.setAttribute("viewBox", "0 0 10 10");
            arrowMarker.setAttribute("refX", "30");
            arrowMarker.setAttribute("refY", "5");
            arrowMarker.setAttribute("markerWidth", "6");
            arrowMarker.setAttribute("markerHeight", "6");
            arrowMarker.setAttribute("orient", "auto");
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
            path.setAttribute("fill", getCanvasColor(color[0], this.darkMode));
            
            arrowMarker.appendChild(path);
            defs.appendChild(arrowMarker);
        }

        this.svgContainer.insertBefore(defs, this.svgContainer.firstChild);

       






        this.camera = new Camera();
        
        

        this.variables = new Map();
        this.variablesDiv = document.createElement("div");
        this.variablesDiv.id = "variables-div";
        document.body.appendChild(this.variablesDiv);

        // setup the div of the loaded params of the whole graph
        // this.entireZone = new EntireZone(this);
        new EntireZone(this);


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

    resetGraph(){
        // console.log("reset Graph")
        this.g = new Graph2();
        for (const element of this.elements.values()){
            if (element instanceof VertexElement){
                this.g.setVertex(element.serverId, new VertexData2(element.cameraCenter, element.color, element.innerLabel, element.outerLabel) );
            }
        }
        for (const element of this.elements.values()){
            if (element instanceof LinkElement){
                this.g.addLink(element.startVertex.serverId, element.endVertex.serverId, element.isDirected ? ORIENTATION.DIRECTED : ORIENTATION.UNDIRECTED, new LinkData2(element.color, element.label));
            }
        }
    }


    highlight(indices: Array<[BoardElementType, number, number]>) {
        for (const [type, serverId, highlightValue] of indices){
            for (const element of this.elements.values()){
                if (element.boardElementType == type && element.serverId == serverId  ){
                    if (element instanceof VertexElement || element instanceof LinkElement){
                        element.setHighlight(highlightValue)
                    }
                    break;
                }
            }
        }
    }

    highlightVertex(serverId: number, value: number){
        for (const element of this.elements.values()){
            if (element.serverId == serverId && element instanceof VertexElement ){
                element.setHighlight(value)
                break;
            }
        }
    }

    highlightLink(serverId: number, value: number){
        for (const element of this.elements.values()){
            if (element.serverId == serverId && element instanceof LinkElement ){
                element.setHighlight(value)
                break;
            }
        }
    }


    /**
     * Add graph to the clipboard
     * @param graph The graph to paste
     * @param mousePos The position where the mouse is currently 
     * @todo when no mouse ???
     */
    addGraphToClipboard(graph: EmbeddedGraph, mousePos: CanvasCoord){
        this.clearClipboard();
        this.clipboardInitPos = mousePos;
        
        // const newVertices = new Map();
        // for (const [index, v] of graph.vertices){
        //     const data = new ClientVertexData((v.data.pos.x + mousePos.x -this.camera.camera.x)/this.camera.zoom, (v.data.pos.y + mousePos.y- this.camera.camera.y)/this.camera.zoom, "", this.camera, Color.Neutral);
        //     const newVertex = new ClientVertex(index, data, this);
        //     this.clipboard.push(newVertex);
        //     newVertices.set(newVertex.index, newVertex);
        // }

        // for (const [index, link] of graph.links){
        //     const cp = undefined;
        //     const data = new ClientLinkData(cp, Color.Neutral, "", this.camera);
        //     const startVertex = newVertices.get(link.startVertex.index);
        //     const endVertex = newVertices.get(link.endVertex.index);
        //     if (typeof startVertex == "undefined" || typeof endVertex == "undefined") continue;
        //     const newLink = new ClientLink(index, startVertex, endVertex, link.orientation, data, this );
        //     this.clipboard.push(newLink);
        // }
    }

    copySelectedElements(mousePos: CanvasCoord){
        this.clearClipboard();
        this.clipboardInitPos = mousePos;
        this.canvas.style.cursor = "grab";

        // TODO generalize to elements of board

        // // Vertices
        // const newVertices = new Map();
        // for (const [index, v] of this.graph.vertices.entries()) {
        //     if (v.data.is_selected){
        //         const data = new ClientVertexData(v.data.pos.x, v.data.pos.y, v.data.weight, this.camera, v.data.color);
        //         const newVertex = new ClientVertex(index, data, this);
        //         this.clipboard.push(newVertex);
        //         newVertices.set(newVertex.index, newVertex);
        //     }
        // }

        // // Links
        // for (const [index, link] of this.graph.links.entries()){
        //     if (link.data.is_selected){
        //         const cp = (typeof link.data.cp == "undefined") ? undefined : link.data.cp.copy();
        //         const data = new ClientLinkData(cp, link.data.color, link.data.weight, this.camera);
        //         const startVertex = newVertices.get(link.startVertex.index);
        //         const endVertex = newVertices.get(link.endVertex.index);
        //         if (typeof startVertex == "undefined" || typeof endVertex == "undefined") continue;
        //         const newLink = new ClientLink(index, startVertex, endVertex, link.orientation, data, this );
        //         this.clipboard.push(newLink);
        //     }
        // }

        // // Strokes
        // for (const [index, stroke] of this.strokes.entries()){
        //     if (stroke.isSelected){
        //         const positionsCopied = new Array();
        //         for (const pos of stroke.positions){
        //             positionsCopied.push(pos.copy());
        //         }
        //         const newStroke = new ClientStroke(positionsCopied, stroke.color, stroke.width, this.camera, index);
        //         this.clipboard.push(newStroke);
        //     }
        // }

        // // Rectangles
        // for (const [index, rectangle] of this.rectangles.entries()){
        //     if (rectangle.isSelected){
        //         console.log("rectnagle", index);
        //         const newRectangle = new ClientRectangle(rectangle.c1.copy(), rectangle.c2.copy(), rectangle.color, this, rectangle.index);
        //         this.clipboard.push(newRectangle);
        //     }
        // }
    }

    clearClipboard(){
        // this.clipboard.splice(0,this.clipboard.length);
        // this.clipboardInitPos = undefined;
        // this.canvas.style.cursor = "default";
    }

    translateClipboard(previousCanvasShift: CanvasVect, pos: CanvasCoord){
        // if (this.clipboard.length == 0) return;
        // if (typeof this.clipboardInitPos == "undefined") return;
        // const shift = CanvasVect.from_canvas_coords(this.clipboardInitPos, pos);
        // const cShift = shift.sub(previousCanvasShift);
        // for (const element of this.clipboard){
        //     if (element instanceof ClientStroke || element instanceof ClientVertex){
        //         element.translate_by_canvas_vect( cShift , this.camera);
        //     } else if (element instanceof ClientLink){
        //         element.translate_cp_by_canvas_vect(cShift, this.camera);
        //     } if (element instanceof ClientRectangle){
        //         translate_by_canvas_vect(element, cShift, this.camera);
        //     }
        // }

        // previousCanvasShift.set_from(shift);
        // this.draw()
    }


    drawClipboard(){
        // for (const element of this.clipboard){
        //     element.draw(this);
        // }
    }

    sendRequestPasteClipboard(){
        // const data = new Array();

        // for (const element of this.clipboard){
        //     if (element instanceof ClientVertex){
        //         data.push( {
        //             type: "Vertex",
        //             index: element.index, 
        //             x: element.data.pos.x, 
        //             y: element.data.pos.y, 
        //             color: element.data.color, 
        //             weight: element.data.weight
        //         })
        //     } else if (element instanceof ClientLink){
        //         data.push( {
        //             type: "Link",
        //             index: element.index, 
        //             startIndex: element.startVertex.index, 
        //             endIndex: element.endVertex.index,
        //             orientation: element.orientation,
        //             color: element.data.color,
        //             weight: element.data.weight,
        //             cp: element.data.cp
        //         })
        //     } else if (element instanceof ClientStroke){
        //         data.push({
        //             type: "Stroke",
        //             index: element.index,
        //             color: element.color,
        //             width: element.width,
        //             positions: element.positions
        //         })
        //     } else if (element instanceof ClientRectangle){
        //         data.push({
        //             type: "Rectangle",
        //             index: element.index,
        //             color: element.color,
        //             x1: element.c1.x,
        //             x2: element.c2.x,
        //             y1: element.c1.y,
        //             y2: element.c2.y
        //         })
        //     }
        // }
        
        // socket.emit(SocketMsgType.PASTE_GRAPH, data);
    }


    getVertex(serverId: number): undefined | VertexElement {
        for (const element of this.elements.values()){
            if (element instanceof VertexElement && element.serverId == serverId){
                return element;
            }
        }
        return undefined;
    }

    getLink(serverId: number): undefined | LinkElement {
        for (const element of this.elements.values()){
            if (element instanceof LinkElement && element.serverId == serverId){
                return element;
            }
        }
        return undefined;
    }


   


    nearbyLink(pos: CanvasCoord): Option<LinkElement>{
        for (const element of this.elements.values()){
            if (element instanceof LinkElement && element.isNearby(pos, 30)){
                return element;
            }
        }
        return undefined
    }
    
    // return a CanvasCoord near mouse_canvas_coord which aligned on other vertices or on the grid
    alignPosition(pos_to_align: CanvasCoord, excluded_indices: Set<number>, canvas: HTMLCanvasElement, camera: Camera): CanvasCoord {
        const aligned_pos = new CanvasCoord(pos_to_align.x, pos_to_align.y);
        if (this.isAligning) {
            this.alignement_horizontal_y = undefined;
            this.alignement_vertical_x = undefined;
            for (const element of this.elements.values()){
                if (excluded_indices.has(element.serverId) == false) {
                    if (Math.abs(element.cameraCenter.y - pos_to_align.y) <= 15) { 
                        aligned_pos.y = element.serverCenter.y;
                        this.alignement_horizontal_y = camera.canvasCoordY(element.serverCenter);
                        break
                    }
                    if (Math.abs(element.cameraCenter.x - pos_to_align.x) <= 15) {
                        aligned_pos.x = element.serverCenter.x;
                        this.alignement_vertical_x = camera.canvasCoordX(element.serverCenter);
                        break;
                    }
                }
            }
        }
        if ( this.grid.type == GridType.GridRect ) {
            const grid_size = this.grid.grid_size;
            for (let x = camera.camera.x % grid_size; x < canvas.width; x += grid_size) {
                if (Math.abs(x - pos_to_align.x) <= 15) {
                    aligned_pos.x = x;
                    break;
                }
            }
            for (let y = camera.camera.y % grid_size; y < canvas.height; y += grid_size) {
                if (Math.abs(y - pos_to_align.y) <= 15) {
                    aligned_pos.y = y;
                    break;
                }
            }
        } else  if ( this.grid.type == GridType.GridVerticalTriangular ) {
            const grid_size = this.grid.grid_size;
            const h = grid_size*Math.sqrt(3)/2;

            // find the corners of the quadrilateral containing the point
            const px = ((pos_to_align.x-camera.camera.x)- (pos_to_align.y-camera.camera.y)/Math.sqrt(3))/grid_size;
            const py = (pos_to_align.y-camera.camera.y)/h;
            const i = Math.floor(px);
            const j = Math.floor(py);
            const corners = [
                new Coord(i*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2), // top left
                new Coord((i+1)*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2), // top right
                new Coord(i*grid_size + (j+1)*grid_size/2, Math.sqrt(3)*(j+1)*grid_size/2), // bottom left
                new Coord((i+1)*grid_size + (j+1)*grid_size/2, Math.sqrt(3)*(j+1)*grid_size/2) // bottom right
            ]
            
            // align on the corners if the point is near enough
            for (let corner of corners){
                corner = corner.add(camera.camera);
                if (Math.sqrt(corner.dist2(pos_to_align)) <= 2*15){
                    aligned_pos.x = corner.x;
                    aligned_pos.y = corner.y;
                    return aligned_pos;
                }
            }

            // projection on the \ diagonal starting at the top left corner
            const projection1 = pos_to_align.orthogonal_projection(corners[0], new Vect(1 , Math.sqrt(3))) ; 
            if (projection1.dist2(pos_to_align) <= 15*15){
                aligned_pos.x = projection1.x;
                aligned_pos.y = projection1.y;
            }

            // projection on the \ diagonal starting at the top right corner
            const projection2 = pos_to_align.orthogonal_projection(corners[1], new Vect(1 , Math.sqrt(3))) ; 
            if (projection2.dist2(pos_to_align) <= 15*15){
                aligned_pos.x = projection2.x;
                aligned_pos.y = projection2.y;
            }

            // projection on the / diagonal starting at the top right corner
            const projection = pos_to_align.orthogonal_projection(corners[1], new Vect(-1 , Math.sqrt(3))) ; 
            if (projection.dist2(pos_to_align) <= 15*15){
                aligned_pos.x = projection.x;
                aligned_pos.y = projection.y;
            }

            // align on the horizontal lines
            for (let k of [0,3]){ // 0 and 3 are the indices of the top left and bottom right corner
                // of the quadrilateral containing the point
                let y = corners[k].y;
                if (Math.abs(y - pos_to_align.y) <= 15) {
                    aligned_pos.y = y;
                    break;
                }
            }
            
        } else if (this.grid.type == GridType.GridPolar){
            const size = this.grid.grid_size;
            const center = CanvasCoord.fromCoord(this.grid.polarCenter, this.camera);
            const p = aligned_pos;

            let d = Math.sqrt(p.dist2(center));
            if (d != 0){
                const i = Math.floor(d/(2*size));
                let alignToCenter = false;
                if ( d - i*2*size <= 20){
                    if (i == 0) {
                        alignToCenter = true;
                    }
                    aligned_pos.x = center.x + (aligned_pos.x-center.x)*(i*2*size)/d;
                    aligned_pos.y = center.y + (aligned_pos.y-center.y)*(i*2*size)/d;
                } else if ( (i+1)*2*size - d <= 20){
                    aligned_pos.x = center.x + (aligned_pos.x-center.x)*((i+1)*2*size)/d;
                    aligned_pos.y = center.y + (aligned_pos.y-center.y)*((i+1)*2*size)/d;
                }
                
                if (alignToCenter == false){
                    for (let j = 0 ; j < this.grid.polarDivision; j ++){
                        const angle = 2*Math.PI*j/this.grid.polarDivision;
                        const end = new Vect(1,0);
                        end.rotate(angle);
                        const projection = aligned_pos.orthogonal_projection(center, end);
                        if ( Math.sqrt(aligned_pos.dist2(projection)) <= 20){
                            aligned_pos.x = projection.x;
                            aligned_pos.y = projection.y;
                        }
                    }
                }
            }
        }
        return aligned_pos;
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


    
    // override delete_area(areaIndex: number): void {
    //     const area = this.areas.get(areaIndex);
    //     if (typeof area != "undefined"){
    //         area.clearDOM();
    //         super.delete_area(areaIndex);
    //     }

    // }


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

    drawLine(p1: Coord, p2: Coord, color: string, width: number){
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
    // selectEverything() {
    //     for (const vertex of this.graph.vertices.values()){
    //         vertex.data.is_selected = true;
    //     } 
    //     for (const link of this.graph.links.values()){
    //         link.data.is_selected = true;
    //     }
    // }


    

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
        this.drawBackground();
        this.grid.draw(this.canvas, this.ctx, this.camera);
        // this.representations.forEach(rep => rep.draw(this.ctx, this.camera));
        // this.areas.forEach(area => area.draw(this));
        this.drawAlignements();

        this.otherUsers.forEach(user => user.draw(this.canvas, this.ctx));
        this.drawInteractor();
        
        this.drawClipboard();

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

    deleteTextZone(serverId: number){
        for (const [key, element] of this.elements){
            if (element instanceof TextZoneElement && element.serverId == serverId){
                element.delete();
                this.elements.delete(key);
            }
        }
    }

    deleteVertex(serverId: number){
        // console.log("Board: delete vertex", serverId)
        for (const [key, element] of this.elements){
            if (element instanceof VertexElement && element.serverId == serverId){
                element.delete();
                this.elements.delete(key);
            }
            if (element instanceof LinkElement && (element.startVertex.serverId == serverId || element.endVertex.serverId == serverId)){
                element.delete();
                this.elements.delete(key);
            }
        }
    }

    deleteStroke(serverId: number){
        console.log("Board: delete stroke")
        for (const [key, element] of this.elements){
            if (element instanceof StrokeElement && element.serverId == serverId){
                element.delete();
                this.elements.delete(key);
            }
        }
    }

    deleteShape(serverId: number){
        console.log("Board: delete shape")
        for (const [key, element] of this.elements){
            if (element instanceof ShapeElement && element.serverId == serverId){
                element.delete();
                this.elements.delete(key);
            }
        }
    }

    deleteLink(serverId: number){
        // console.log("Board: delete link", serverId)
        for (const [key, element] of this.elements){
            if (element instanceof LinkElement && element.serverId == serverId){
                element.delete();
                this.elements.delete(key);
            }
        }
    }

    



    /**
     * Return true if an element has been erased.
     * Emit delete_elements alone.
     */
    eraseAt(e: CanvasCoord, eraseDistance: number) : boolean{
        for (const element of this.elements.values()){
            if (element.isNearby(e, eraseDistance)){
                this.emit_delete_elements([[element.boardElementType, element.serverId]]);
                return true;
            }
        }

        // for (const [index, s] of this.strokes.entries()) {
        //     if (s.is_nearby(e, this.camera) !== false) {
        //         this.emit_delete_elements([[BoardElementType.Stroke, index]]);
        //         return true;
        //     }
        // }
        // for (const [index, vertex] of this.graph.vertices.entries()) {
        //     if (vertex.is_nearby(e, Math.pow(eraseDistance + VERTEX_RADIUS, 2))) {
        //         this.emit_delete_elements([[BoardElementType.Vertex, index]]);
        //         return true;
        //     }
        // }
        // for (const index of this.graph.links.keys()) {
            // if (this.graph.is_click_over_link(index, e, this.camera)) {
        //         this.emit_delete_elements([[BoardElementType.Link, index]]);
        //         return true;
        //     }
        // }
        // for(const [index,area] of this.areas.entries()){
        //     if( is_click_over(area,e) ){
        //         this.emit_delete_elements([[BoardElementType.Area, index]]);
        //         return true;
        //     }
        // }
        // for(const [index,rectangle] of this.rectangles.entries()){
        //     if( is_click_over(rectangle, e) ){
        //         this.emit_delete_elements([[BoardElementType.Rectangle, index]]);
        //         return true;
        //     }
        // }
        return false;
    }

    // clearAreas(){
    //     for (const area of this.areas.values()){
    //         area.clearDOM();
    //     }
    //     this.areas.clear();
    // }

    setColor(type: BoardElementType, serverId: number, color: Color){
        console.log("setColor", type, serverId, color)
        for (const element of this.elements.values()){
            if (element.boardElementType == type && element.serverId == serverId){
                element.setColor(color);
            }
        }
    }

    clear() {
        console.log("clear")
        for (const [key, element] of this.elements){
            element.delete();
            this.elements.delete(key)
        }
        
        // this.clearAreas();
        // this.rectangles.clear();
    }

    translateCamera(shift: CanvasVect){
        this.camera.translate_camera(shift);
        this.updateAfterCameraChange();
        if(typeof this.selfUser.following != "undefined"){
            this.selfUser.unfollow(this.selfUser.following);
        }
        socket.emit("my_view", this.camera.camera.x, this.camera.camera.y, this.camera.zoom);
    }

    updateAfterCameraChange(){
        this.grid.updateToZoom(this.camera.zoom);

        for (const element of this.elements.values()){
            element.updateAfterCameraChange()
        }

        
        // for (const rep of this.representations.values()){
        //     rep.update_after_camera_change(this.camera);
        // }
        

        // for (const v of this.graph.vertices.values()) {
        //     v.update_after_view_modification(this.camera);
        // }
        // for (const link of this.graph.links.values()) {
        //     link.update_after_view_modification(this.camera);
        // }
        this.updateOtherUsersCanvasPos()
    }


    selectElementsInRect(corner1: CanvasCoord, corner2: CanvasCoord) {
        for (const element of this.elements.values()) {
            if (element.isInRect(corner1, corner2)) {
                element.select();
            }
        }
    }

    /**
     * 
     */
    addVerticesSubsetFromSelection(){
        const selectedVertices = [];
        for (const element of this.elements.values()){
            if (element instanceof VertexElement && element.isSelected){
                selectedVertices.push(element.id);
            }
        }
        if (selectedVertices.length > 0){
            new VerticesSubset(this, selectedVertices, 30);

            
        }
    }


    /**
     * 
     * @returns x, y, width, height
     */
    getSelectionBoundingBox() {
        let noSelection = true;
        let x = 0;
        let y = 0;
        let maxX = 0;
        let maxY = 0;
        for (const element of this.elements.values()) {
            if (element.isSelected && element instanceof LinkElement == false){
                // console.log("selected:", element.serverCenter)
                if (noSelection){
                    noSelection = false;
                    x = element.serverCenter.x;
                    y = element.serverCenter.y;
                    maxX = x;
                    maxY = y;
                }
                x = x < element.serverCenter.x ? x : element.serverCenter.x;
                y = y < element.serverCenter.y ? y : element.serverCenter.y;
                maxX = maxX > element.serverCenter.x ? maxX : element.serverCenter.x;
                maxY = maxY > element.serverCenter.y ? maxY : element.serverCenter.y;
            }
        }
        // console.log(x,y, maxX, maxY)
        return [x, y, maxX-x, maxY-y]
    }


    getSelectionCenter(): Coord{
        const [x,y,w,h] = this.getSelectionBoundingBox();
        return new Coord(x+w/2, y+h/2);
    }

    initRotateSelection(){
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof VertexElement){
                element.startRotate();
            }
        }
    }

    localRotateSelection(center: Coord, angle: number){
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof VertexElement){
                element.setAngle(center, angle);
            }
        }
    }

    endLocalRotateSelection(center: Coord, angle: number){
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof VertexElement){
                element.setAngle(center, angle);
            }
        }
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof VertexElement){
                const shift = element.posBeforeRotate.vectorTo(element.serverCenter);
                const cshift = this.camera.create_canvas_vect(shift);
                element.translate(cshift.opposite())
                this.emit_translate_elements([[BoardElementType.Vertex, element.serverId]], shift)
            }
        }
    }

    localResizeSelection(center: Coord, ratio: number){
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof VertexElement){
                element.applyScale(center, ratio);
            }
        }
    }

    endLocalResizeSelection(center: Coord, ratio: number){
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof VertexElement){
                element.applyScale(center, ratio);
            }
        }
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof VertexElement){
                const shift = element.posBeforeRotate.vectorTo(element.serverCenter);
                const cshift = this.camera.create_canvas_vect(shift);
                element.translate(cshift.opposite())
                this.emit_translate_elements([[BoardElementType.Vertex, element.serverId]], shift)
            }
        }
    }



    
    /**
     * Return true if this.elementOver has changed.
     */
    // updateElementOver(pos: CanvasCoord): boolean {
        // const before = this.elementOver;
        // this.elementOver = undefined;
        
        // for (const rectangle of this.rectangles.values()){
        //     if (is_click_over(rectangle, pos)){
        //         this.elementOver = rectangle;
        //         break;
        //     }
        // }

        
        // for (const stroke of this.strokes.values()){
        //     if (stroke.is_nearby(pos, this.camera)){
        //         this.elementOver = stroke;
        //         break;
        //     }
        // }
        
        // return before !== this.elementOver;
    // }


    getSpecificElementNearby(pos: CanvasCoord, type: BoardElementType, d: number): Option<BoardElement>{
        for (const element of this.elements.values()){
            if ( element.boardElementType == type && element.isNearby(pos, d)){
                return element;
            }
        }
        return undefined;
    }


    get_element_nearby(pos: CanvasCoord, interactable_element_type: Set<DOWN_TYPE>): Option<ELEMENT_DATA> {

        // if (interactable_element_type.has(DOWN_TYPE.REPRESENTATION_ELEMENT)){
        //     for (const [index, rep] of this.representations.entries()){
        //         const resizeType = resize_type_nearby(rep, pos, 10);
        //         if (typeof resizeType != "undefined"){
        //             return new ELEMENT_DATA_REPRESENTATION(rep, index, resizeType);
        //         }
        //         const subElementIndex = rep.click_over(pos, this.camera);
        //         if (typeof subElementIndex != "string"){
        //             return new ELEMENT_DATA_REPRESENTATION_SUBELEMENT(rep, index, subElementIndex)
        //         }
        //     }
        // }

        // if (interactable_element_type.has(DOWN_TYPE.REPRESENTATION)){
        //     for (const [index, rep] of this.representations.entries()){
        //         if ( is_click_over(rep, pos)){
        //             return new ELEMENT_DATA_REPRESENTATION(rep, index, undefined);
        //         }
        //     }
        // }

        // if (interactable_element_type.has(DOWN_TYPE.RECTANGLE)){
        //     for (const [index, rect] of this.rectangles.entries()){
        //         const resizeType = resize_type_nearby(rect, pos, 10);
        //         if (typeof resizeType != "undefined"){
        //             return new ELEMENT_DATA_RECTANGLE(rect, index, resizeType);
        //         }
        //     }
            
        //     for (const [index, rect] of this.rectangles.entries()){
        //         if ( is_click_over(rect, pos)){
        //             return new ELEMENT_DATA_RECTANGLE(rect, index, undefined);
        //         }
        //     }

        // }

        for (const element of this.elements.values()){
            if ( interactable_element_type.has(DOWN_TYPE.VERTEX) && element instanceof VertexElement){
                if (element.isNearby(pos, 15)){
                    return new ELEMENT_DATA_VERTEX(element);
                }
            }
            if ( interactable_element_type.has(DOWN_TYPE.LINK) && element instanceof LinkElement){
                if (element.isNearby(pos, 15)){
                    return new ELEMENT_DATA_LINK(element);
                }
            }
            if (interactable_element_type.has(DOWN_TYPE.RECTANGLE) && element instanceof ShapeElement){
                if (element.isClickOver(pos)){
                    return new ELEMENT_DATA_RECTANGLE(element, undefined);
                }
            }

            if (interactable_element_type.has(DOWN_TYPE.STROKE) && element instanceof StrokeElement){
                if (element.isNearby(pos, 15)){
                    return new ELEMENT_DATA_STROKE(element);
                }
            }

        }
       
        // for (const [index, link] of this.graph.links.entries()) {
        //     if (interactable_element_type.has(DOWN_TYPE.CONTROL_POINT) && typeof link.data.cp_canvas_pos != "string" && link.data.cp_canvas_pos.is_nearby(pos, 150)) {
        //         return new ELEMENT_DATA_CONTROL_POINT(link);
        //     }
        //     // if (interactable_element_type.has(DOWN_TYPE.LINK) && this.graph.is_click_over_link(index, pos, this.camera)) {
        //     //     return new ELEMENT_DATA_LINK(link);
        //     // }
        // }

        // if(interactable_element_type.has(DOWN_TYPE.RESIZE)){
        //     for (const [index, area] of this.areas.entries()){
        //         const resizeType = resize_type_nearby(area, pos, 10);
        //         if (typeof resizeType != "undefined"){
        //             return new ELEMENT_DATA_AREA(area, index, resizeType);
        //         }
        //     }
        // }        

        // for(const [index, area] of this.areas.entries()){
        //     if(interactable_element_type.has(DOWN_TYPE.AREA) && is_click_over(area, pos)){
        //         return new ELEMENT_DATA_AREA(area, index, undefined);
        //     }
        // }

        // if (interactable_element_type.has(DOWN_TYPE.STROKE)) {
        //     for(const [index,s] of this.strokes.entries()){
        //         if (s.is_nearby(pos, this.camera)){     
        //             return new ELEMENT_DATA_STROKE(s, index);
        //         }
        //     }
        // }

        // if ( interactable_element_type.has(DOWN_TYPE.TEXT_ZONE)){
        //     for (const [index, textZone] of this.text_zones.entries()){
        //         if ( textZone.is_nearby(pos)){
        //             return new ELEMENT_DATA_TEXT_ZONE(textZone, index);
        //         }
        //     }
        // }

        return undefined;
    }

 

    selectConnectedComponent(vIndex: number){
        // const c = this.graph.getConnectedComponentOf(vIndex);
        // const vertexIndices = new Set();
        // const linkIndices = new Set();
        // for (const index of c.vertices.keys()){
        //     vertexIndices.add(index);
        // }
        // for (const index of c.links.keys()){
        //     linkIndices.add(index);
        // }
        // for (const vertex of this.graph.vertices.values()){
        //     if (vertexIndices.has(vertex.index)){
        //         vertex.data.is_selected = true;
        //     }
        // }
        // for (const link of this.graph.links.values()){
        //     if (linkIndices.has(link.index)){
        //         link.data.is_selected = true;
        //     }
        // }
    }

    deselectAll(){
        this.clearAllSelections();
    }

    unhighlightAll(){
        for (const element of this.elements.values()){
            if (element instanceof VertexElement || element instanceof LinkElement){
                element.unHighlight();
            }
        }
        // for (const v of this.graph.vertices.values()){
        //     v.data.highlight = undefined;
        // }
        // for (const l of this.graph.links.values()){
        //     l.data.highlight = undefined;
        // }
    }

    getSelectedVertices(): Set<number> {
        const set = new Set<number>();
        for (const element of this.elements.values()){
            if (element instanceof VertexElement){
                if (element.isSelected){
                    set.add(element.serverId);
                }
            }
        }
        return set;
    }

    getSelectedElements(): Array<[BoardElementType, number]> {
        const t = new Array<[BoardElementType, number]>();
        for (const element of this.elements.values()){
            if (element.isSelected){
                t.push([element.boardElementType, element.serverId]);
            }
        }
        return t;
    }

    clearAllSelections() {
        for (const element of this.elements.values()){
            element.deselect();
        }
    }

    setC1(serverId: number, x: number, y: number){
        console.log("set C1, ", x, y)
        for (const element of this.elements.values()){
            if (element instanceof ShapeElement && element.serverId == serverId){
                element.setCorners(new CanvasCoord(x,y), new CanvasCoord(element.c2.x, element.c2.y));
            }
        }
    }

    setC2(serverId: number, x: number, y: number){
        console.log("set C2, ", x, y)
        for (const element of this.elements.values()){
            if (element instanceof ShapeElement && element.serverId == serverId){
                element.setCorners(new CanvasCoord(element.c1.x, element.c1.y), new CanvasCoord(x,y));
            }
        }
    }

    translateElement(type: BoardElementType, serverId: number, cshift: CanvasVect){
        for (const element of this.elements.values()){
            if (element.boardElementType == type && element.serverId == serverId){
                element.translate(cshift);
            }
        }
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
        socket.emit(SocketMsgType.GENERATE_GRAPH, this.camera.createServerCoord(new CanvasCoord(this.canvas.width/2,this.canvas.height/2 )), generatorId, params );
    }

    emitRedo() {
        socket.emit(SocketMsgType.REDO);
    }

    emitUndo() {
        socket.emit(SocketMsgType.UNDO);
    }

    emit_translate_elements(indices: Array<[BoardElementType,number]>, shift: Vect){
        socket.emit(SocketMsgType.TRANSLATE_ELEMENTS, indices, shift);
    }

    emit_delete_elements(indices: Array<[BoardElementType,number]>){
        // console.log("emit delete elements: ", indices);
        socket.emit(SocketMsgType.DELETE_ELEMENTS, this.agregId, indices);
    }

    emitUpdateElement(type: BoardElementType, index: number, attribute: string, value: any){
        socket.emit(SocketMsgType.UPDATE_ELEMENT, this.agregId, type, index, attribute, value);
    }

    emitVerticesMerge(index1: number, index2: number){
        console.log("emit merge")
        socket.emit(SocketMsgType.MERGE_VERTICES, index1, index2);
    }

    emitPasteGraph(graph: Graph2){

        const data = new Array();
        for (const vertex of graph.vertices.values()){
            data.push( {
                type: "Vertex",
                index: vertex.index, 
                x: vertex.data.pos.x, 
                y: vertex.data.pos.y, 
                color: vertex.data.color, 
                weight: vertex.data.innerLabel
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
                weight: "",
                cp: undefined
            })
        }
        
        
        socket.emit(SocketMsgType.PASTE_GRAPH, data);
    }




    emitResizeElement(type: BoardElementType, index: number, pos: Coord, resize_type: RESIZE_TYPE){
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
            
            attributes_data.push(attribute.value);
        }
        if ( sendVerticesSelection){
            const verticesSelection = new Array<number>();
            for (const vertex of this.elements.values()){
                if (vertex instanceof VertexElement && vertex.isSelected){
                    verticesSelection.push(vertex.serverId);
                }
            }
            socket.emit(SocketMsgType.APPLY_MODIFYER, modifyer.name, attributes_data, verticesSelection);
        }
        else {
            socket.emit(SocketMsgType.APPLY_MODIFYER, modifyer.name, attributes_data);
        }
    }


    createVertexPreData(c: Coord): VertexPreData{
        return new VertexPreData(c, this.colorSelected, "");
    }

    createLinkPreData(startIndex: number, endIndex: number, orientation: ORIENTATION): LinkPreData{
        return new LinkPreData(startIndex, endIndex, orientation, "", this.colorSelected)
    }

    // Note: sometimes element is a server class, sometimes a client
    // Normally it should be only server
    // TODO: improve that
    emitAddElement(element: VertexPreData | LinkPreData | StrokeElement | TextZone | ShapePreData, callback: (response: number) => void  ){
        if (element instanceof ShapePreData){
            socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.Rectangle, {c1: element.pos, c2: element.pos, color: element.color}, callback);
        }
        switch(element.constructor){
            case VertexPreData: {
                const vertexData = element as VertexPreData;
                socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.Vertex, {pos: vertexData.pos, color: vertexData.color, weight: vertexData.weight}, callback);
                break;
            }
            case LinkPreData: {
                const data = element as LinkPreData;
                socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.Link, {start_index: data.startIndex, end_index: data.endIndex, orientation: data.orientation, weight: data.weight, color: data.color}, callback);
                break;
            }
            case StrokeElement: {
                const stroke = element as StrokeElement;
                socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.Stroke, {points: [... stroke.serverPositions.entries()], color: stroke.color, width: stroke.thickness}, callback);
                break;
            }
            case TextZone: {
                const text_zone = element as TextZone;
                socket.emit(SocketMsgType.ADD_ELEMENT, this.agregId, BoardElementType.TextZone, {pos: text_zone.pos}, callback);
                break;
            }
        }
    }




    
//     setGraphClipboard(graph: ClientGraph, pos_at_click: CanvasCoord, is_coming_from_clipboard: boolean){
//         this.graphClipboard = graph;
//         this.clipboardInitPos = pos_at_click;
//         this.isGraphClipboardGenerated = is_coming_from_clipboard;
//         this.canvas.style.cursor = "grab";
//     }
    
//    pasteGeneratedGraph() {
//         if ( typeof this.graphClipboard != "undefined"){
//             this.emitPasteGraph(this.graphClipboard);
//         }
//     }
    
//     clearGraphClipboard(){
//         this.graphClipboard = undefined;
//         this.canvas.style.cursor = "auto";
//         this.isGraphClipboardGenerated = false;
//         this.clipboardInitPos = undefined;
//     }

//     translateGraphClipboard(previousCanvasShift: CanvasVect, pos: CanvasCoord){
//         if (typeof this.graphClipboard == "undefined" || typeof this.clipboardInitPos == "undefined") return;
//         const shift = CanvasVect.from_canvas_coords(this.clipboardInitPos, pos);
//         this.graphClipboard.translate_by_canvas_vect( shift.sub(previousCanvasShift), this.camera);
//         previousCanvasShift.set_from(shift);
//         this.draw()
//     }



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

        const v = this.elements.values().next().value;

        if (typeof v != "undefined"){
            let xMin = v.cameraCenter.x;
            let yMin = v.cameraCenter.y;
            let xMax = v.cameraCenter.x;
            let yMax = v.cameraCenter.y;
    
            for(const u of this.elements.values()){
                xMin = Math.min(xMin, u.cameraCenter.x);
                yMin = Math.min(yMin, u.cameraCenter.y);
                xMax = Math.max(xMax, u.cameraCenter.x);
                yMax = Math.max(yMax, u.cameraCenter.y);
            }

            top_left_corner = new CanvasCoord(xMin, yMin);
            bot_right_corner = new CanvasCoord(xMax, yMax);
        }
        

        this.centerCameraOnRectangle(top_left_corner, bot_right_corner);
    }


    centerCameraOnRectangle(c1: CanvasCoord, c2: CanvasCoord){
        this.camera.centerOnRectangle(c1, c2, this.canvas);
        this.updateAfterCameraChange();
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
    }


    setGridType(type: Option<GridType>) {
        this.grid.type = type;
    }

}