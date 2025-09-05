import { Board, Coord, EmbeddedGraph, GeneratorId, linesIntersection, Option, ORIENTATION, TextZone, Vect } from "gramoloss";
import { DOWN_TYPE, RESIZE_TYPE } from "../interactors/interactor";
import { GraphModifyer } from "../modifyers/modifyer";
import { socket } from "../socket";
import { Camera } from "./display/camera";
import { CanvasVect } from "./display/canvasVect";
import { CanvasCoord } from "./display/canvas_coord";
import { Var, VariableNumber, VariableBoolean } from "./variable";
import { Color, colorsData, getCanvasColor } from "./display/colors_v2";
import { PreInteractor } from "../side_bar/pre_interactor";
import { ELEMENT_DATA, ELEMENT_DATA_CONTROL_POINT, ELEMENT_DATA_LINK, ELEMENT_DATA_RECTANGLE, ELEMENT_DATA_REPRESENTATION, ELEMENT_DATA_REPRESENTATION_SUBELEMENT, ELEMENT_DATA_STROKE, ELEMENT_DATA_VERTEX } from "../interactors/pointed_element_data";
import { Self } from "../self_user";
import { Grid, GridType } from "./display/grid";
import { makeid } from "../utils";
import { BoardElement } from "./elements/element";
import { Graph2, LinkData2, VertexData2 } from "./graph2";
import { TextZoneElement } from "./elements/textZone";
import { StrokeElement } from "./elements/stroke";
import { VerticesSubset } from "./elements/vertices_subset";
import { EntireZone } from "../parametors/zone";
import { Interactor } from "../side_bar/side_bar";
import { ShapeElement } from "./elements/shape";
import { BoardLinkElement, LinkPreData } from "./elements/link";
import { BoardVertex, VertexPreData } from "./elements/vertex";
import { BoardLocalElement } from "./local_elements/local_element";
import { Colleague } from "./local_elements/colleague";
import { ShapePreData } from "./elements/shape";


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
    selfUser: Self;
    colorSelected: Color;
    keyPressed: Set<string>;


    // Interactors
    interactors: Map<string, Interactor> = new Map();
    interactorLoaded: Option<PreInteractor>;
    interactorLoadedId: Option<string>;

    elements: Map<number, BoardElement>;
    svgContainer: SVGElement;
    elementCounter: number = 0;

    g: Graph2;

    shapesGroup: SVGElement;
    linksGroup: SVGElement;
    verticesGroup: SVGElement;
    labelsGroup: SVGGElement = document.createElementNS("http://www.w3.org/2000/svg", "g");


    // Clipboard
    isGraphClipboardGenerated: boolean;
    clipboardInitPos: Option<CanvasCoord>;

    // LocalElements
    localElements: Map<string, BoardLocalElement> = new Map();


    private agregId: string;

    // Display parameters
    private darkMode: boolean;
    isDrawingInteractor: boolean;
    isAligning: boolean;
    alignementHorizontalY: Option<number>;
    alignementVerticalX: Option<number>;

    alignmentLineVert: SVGLineElement;
    alignmentLineHori: SVGLineElement;

    // Grids
    grid: Grid;
    gridSquarePattern: SVGElement;
    gridVerticalTriangularPattern: SVGElement;
    gridVerticalTriangularPatternPath: SVGElement;
    gridLayer: SVGElement;
    gridPolarCircles: Array<SVGCircleElement> = new Array();
    gridPolarLines: Array<SVGLineElement> = new Array();

    // Elements attributes
    attributesDiv: HTMLDivElement = document.createElement("div");
    outerLabelInput: HTMLInputElement = document.createElement("input");
    innerLabelInput: HTMLInputElement = document.createElement("input");


    // Graph
    showInnerLabels: boolean = false;


    // Parameters
    loadedParametersDiv: HTMLDivElement = document.createElement("div")


    constructor(container: HTMLElement){

        this.g = new Graph2();

        this.elements = new Map();
        this.svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        container.appendChild(this.svgContainer);
        // this.svgContainer.style.position = 'absolute';
        this.svgContainer.setAttribute("width", "100vw");
        this.svgContainer.setAttribute("height", "100vh");
        this.svgContainer.setAttribute("viewBox", " 0 100 100");


        this.selfUser = new Self(this);
        this.colorSelected = Color.Neutral;
        this.keyPressed = new Set<string>();
        this.interactorLoaded = undefined;
        this.interactorLoadedId = undefined;
        this.agregId = makeid(5);    
        
        // Display parameters
        this.camera = new Camera();
        this.darkMode = true;
        this.isDrawingInteractor = true;
        this.grid = new Grid(this.camera);
        this.isAligning = false;


        this.isGraphClipboardGenerated = false;  
        
        

        // Init arrow head markers
        // One for each color
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");


        // Rectangular Grid
        const squarePattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        squarePattern.setAttribute("id", "smallGrid");
        squarePattern.setAttribute("width", this.grid.gridSize.toString())
        squarePattern.setAttribute("height", this.grid.gridSize.toString());
        squarePattern.setAttribute("patternUnits", "userSpaceOnUse")
        const squarePatternPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        squarePatternPath.setAttribute("d", `M ${this.grid.gridMaxSize} 0 L 0 0 0 ${this.grid.gridMaxSize}`);
        squarePatternPath.setAttribute("stroke", "rgb(77, 77, 77)")
        squarePatternPath.setAttribute("fill", "none")
        squarePatternPath.setAttribute("stroke-width", "0.5")
        squarePattern.appendChild(squarePatternPath);
        defs.appendChild(squarePattern);

        this.gridSquarePattern = squarePattern;

        // Vertical Triangular Grid
        const verticalTriangularPattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        verticalTriangularPattern.setAttribute("id", "VerticalTriangular");
        const w = this.grid.gridSize;
        const h = w*Math.sqrt(3);
        verticalTriangularPattern.setAttribute("width", w.toString())
        verticalTriangularPattern.setAttribute("height", h.toString());
        verticalTriangularPattern.setAttribute("patternUnits", "userSpaceOnUse")
        const verticalTriangularPatternPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        verticalTriangularPatternPath.setAttribute("d", `M 0 0 L ${w} 0 
            M 0 ${h/2} L ${w} ${h/2} 
            M 0 0 L ${w/2} ${h/2} L ${w} 0 
            M 0 ${h} L ${w/2} ${h/2} L ${w} ${h} 
            M 0 ${h} L ${w} ${h}`);

        verticalTriangularPatternPath.setAttribute("stroke", "rgb(77, 77, 77)")
        verticalTriangularPatternPath.setAttribute("fill", "none")
        verticalTriangularPatternPath.setAttribute("stroke-width", "0.5")
        verticalTriangularPattern.appendChild(verticalTriangularPatternPath);
        defs.appendChild(verticalTriangularPattern);

        this.gridVerticalTriangularPatternPath = verticalTriangularPatternPath;
        this.gridVerticalTriangularPattern = verticalTriangularPattern;
        

        // Polar Grid - Circles
        for (let i = 0; i < 20; i ++){
            const polarCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            polarCircle.setAttribute("cx", `${this.grid.polarCenter.x}`); 
            polarCircle.setAttribute("cy", `${this.grid.polarCenter.y}`);
            polarCircle.setAttribute("r", `${this.grid.gridSize*2*(i+1)}`); 
            polarCircle.setAttribute("fill", "transparent")
            polarCircle.setAttribute("stroke", "rgb(77, 77, 77)");
            polarCircle.setAttribute("display", "none")
            this.svgContainer.appendChild(polarCircle);
            this.gridPolarCircles.push(polarCircle);
        }

        // Polar Grid - Lines
        for (let i = 0; i < this.grid.polarDivision; i ++){
            const polarLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            polarLine.setAttribute("x1", `${this.grid.polarCenter.x}`); 
            polarLine.setAttribute("y1", `${this.grid.polarCenter.y}`);
            polarLine.setAttribute("x2",`${this.grid.polarCenter.x + Math.cos(i*2*3.14/this.grid.polarDivision)*1000 }` )
            polarLine.setAttribute("y2",`${this.grid.polarCenter.y + Math.sin(i*2*3.14/this.grid.polarDivision)*1000 }` )
            polarLine.setAttribute("stroke", "rgb(77, 77, 77)"); 
            polarLine.setAttribute("display", "none")
            this.svgContainer.appendChild(polarLine);
            this.gridPolarLines.push(polarLine);
        }

        
        

        // Arrow heads of different colors
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

       
        // Grid Layer
        const gridLayer = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        gridLayer.setAttribute("width", "100%");
        gridLayer.setAttribute("height", "100%");
        gridLayer.setAttribute("fill", "url(#smallGrid)")
        gridLayer.setAttribute("display", "none")
        this.svgContainer.appendChild(gridLayer)
        this.gridLayer = gridLayer;


        // Vertical Line Alignment
        const alignmentLineVert = document.createElementNS("http://www.w3.org/2000/svg", "line")
        alignmentLineVert.setAttribute("x1", "0");
        alignmentLineVert.setAttribute("y1", "0");
        alignmentLineVert.setAttribute("x2", "0");
        alignmentLineVert.setAttribute("y2", "100%");
        alignmentLineVert.setAttribute("stroke", COLOR_ALIGNEMENT_LINE)
        this.svgContainer.appendChild(alignmentLineVert)
        this.alignmentLineVert = alignmentLineVert;

         // Horizontal Line Alignment
        const alignmentLineHori = document.createElementNS("http://www.w3.org/2000/svg", "line")
        alignmentLineHori.setAttribute("x1", "0");
        alignmentLineHori.setAttribute("y1", "0");
        alignmentLineHori.setAttribute("x2", "100%");
        alignmentLineHori.setAttribute("y2", "0");
        alignmentLineHori.setAttribute("stroke", COLOR_ALIGNEMENT_LINE)
        this.svgContainer.appendChild(alignmentLineHori)
        this.alignmentLineHori = alignmentLineHori;


        
         // Create layers for shapes, links and vertices
        this.shapesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.linksGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.verticesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

        this.shapesGroup.setAttribute("id", "shapes-layer");
        this.linksGroup.setAttribute("id", "links-layer");
        this.labelsGroup.setAttribute("id", "labels-layer");
        this.verticesGroup.setAttribute("id", "vertices-layer");

        this.svgContainer.appendChild(this.shapesGroup);
        this.svgContainer.appendChild(this.linksGroup);
        this.svgContainer.appendChild(this.labelsGroup);
        this.svgContainer.appendChild(this.verticesGroup);
        



        this.variables = new Map();
        this.variablesDiv = document.createElement("div");
        this.variablesDiv.id = "variables-div";
        document.body.appendChild(this.variablesDiv);

        // setup the div of the loaded params of the whole graph
        // this.entireZone = new EntireZone(this);
        new EntireZone(this);


        // Attributes
        this.attributesDiv.id = "attributes-div";
        container.appendChild(this.attributesDiv);

        this.attributesDiv.onmouseleave = () => {
            this.hideAttributes()
        }

        // Delete elements
        const bin = document.createElement("img");
        bin.src = "/img/icons/bin.svg"
        bin.classList.add("attribute")
        this.attributesDiv.appendChild(bin);
        bin.onclick = () => {
            this.emitDeleteElements(this.getSelectedElements());
            this.clearSelection();
        }

        // Color elements
        for (const color of colorsData){
            const colorPicker = document.createElement("div");
            colorPicker.classList.add("attributes-color")
            colorPicker.classList.add("attribute")
            colorPicker.style.backgroundColor = getCanvasColor(color[0], this.darkMode);
            this.attributesDiv.appendChild(colorPicker);
            colorPicker.onclick = () => {
                for (const [type, serverId]  of this.getSelectedElements()){
                    this.emitUpdateElement( type, serverId, "color", color[0]);
                }
                this.clearSelection();
            }
        }


        // Dashed style
        const lineStyleDashed = document.createElement("img");
        lineStyleDashed.src = "/img/icons/stroke_dashed.svg"
        lineStyleDashed.classList.add("attribute")
        this.attributesDiv.appendChild(lineStyleDashed);
        lineStyleDashed.onclick = () => {
            for (const [type, serverId]  of this.getSelectedElements()){
                if (type == BoardElementType.Link){
                    this.emitUpdateElement( type, serverId, "strokeStyle", "dashed");
                }
            }
            this.clearSelection();
        }

        // Normal style
        const lineStyleNormal = document.createElement("img");
        lineStyleNormal.src = "/img/icons/stroke_normal.svg"
        lineStyleNormal.classList.add("attribute")
        this.attributesDiv.appendChild(lineStyleNormal);
        lineStyleNormal.onclick = () => {
            for (const [type, serverId]  of this.getSelectedElements()){
                if (type == BoardElementType.Link){
                    this.emitUpdateElement( type, serverId, "strokeStyle", "normal");
                }
            }
            this.clearSelection();
        }


        // Outer Label
        this.outerLabelInput.classList.add("attribute-input");
        this.outerLabelInput.placeholder = "Label"
        this.attributesDiv.appendChild(this.outerLabelInput);
        this.outerLabelInput.oninput = () => {
            const selection = this.getSelectedElements();
            for (const [type, serverId] of selection){
                this.emitUpdateElement(type, serverId, "outerLabel", this.outerLabelInput.value )
            }
        }

        // Inner Label
        this.innerLabelInput.classList.add("attribute-input");
        this.innerLabelInput.placeholder = "Inner Label"
        this.attributesDiv.appendChild(this.innerLabelInput);
        this.innerLabelInput.oninput = () => {
            const selection = this.getSelectedElements();
            for (const [type, serverId] of selection){
                this.emitUpdateElement(type, serverId, "innerLabel", this.innerLabelInput.value )
            }
        }


        // Parameters
        container.appendChild(this.loadedParametersDiv)
        this.loadedParametersDiv.id = "loaded-parameters-div"

        
    }


    showAttributes(){
        this.attributesDiv.style.display = "block";
        const [x,y,w,h] = this.getSelectionBoundingBox()

        const pos = CanvasCoord.fromCoord(new Coord(x,y), this.camera);
        this.attributesDiv.style.top = `${pos.y+10}px`;
        this.attributesDiv.style.left = `${pos.x+10+w*this.camera.zoom}px`

    }

    hideAttributes(){
        this.attributesDiv.style.display = "none";
        this.innerLabelInput.value = "";
        this.outerLabelInput.value = "";
    }



    toggleInnerLabels(b: boolean){
        if (this.showInnerLabels){
            this.showInnerLabels = false;
            for (const elt of this.elements.values()){
                if (elt instanceof BoardVertex){
                    elt.hideInnerLabel();
                }
            }
        }
        else {
            this.showInnerLabels = true;
            for (const elt of this.elements.values()){
                if (elt instanceof BoardVertex){
                    elt.showInnerLabel();
                }
            }
        }
    }





    updateGridAfterCameraChange(){

        this.grid.updateToZoom(this.camera.zoom);


        // Square Grid
        this.gridSquarePattern.setAttribute("width", this.grid.gridSize.toString());
        this.gridSquarePattern.setAttribute("height", this.grid.gridSize.toString());
        this.gridSquarePattern.setAttribute("x", this.camera.camera.x.toString());
        this.gridSquarePattern.setAttribute("y", this.camera.camera.y.toString())

        // Triangular Grid
        const w = this.grid.gridSize;
        const h = w*Math.sqrt(3);
        this.gridVerticalTriangularPattern.setAttribute("width", w.toString())
        this.gridVerticalTriangularPattern.setAttribute("height", h.toString());
        this.gridVerticalTriangularPatternPath.setAttribute("d", `M 0 0 L ${w} 0 
            M 0 ${h/2} L ${w} ${h/2} 
            M 0 0 L ${w/2} ${h/2} L ${w} 0 
            M 0 ${h} L ${w/2} ${h/2} L ${w} ${h} 
            M 0 ${h} L ${w} ${h}`);

        this.gridVerticalTriangularPattern.setAttribute("x", this.camera.camera.x.toString());
        this.gridVerticalTriangularPattern.setAttribute("y", this.camera.camera.y.toString());


        // Polar Grid
        this.grid.polarCenter.updateAfterCameraChange();

        const c = this.grid.polarCenter.toCoord();
        const cTopLeft = new CanvasCoord(0, 0, this.camera).toCoord();
        const cBotRight = new CanvasCoord(window.innerWidth, window.innerHeight, this.camera).toCoord();
        const cBotLeft = new CanvasCoord(0, window.innerHeight, this.camera).toCoord();
        const cTopRight = new CanvasCoord(window.innerWidth, 0, this.camera).toCoord();

        const d1 = Math.sqrt(cBotRight.dist2(this.grid.polarCenter.toCoord()));
        const d2 = Math.sqrt(cBotLeft.dist2(this.grid.polarCenter.toCoord()));
        const d3 = Math.sqrt(cTopLeft.dist2(this.grid.polarCenter.toCoord()));
        const d4 = Math.sqrt(cTopRight.dist2(this.grid.polarCenter.toCoord()));
        
        let min = Math.min(d1, d2, d3, d4);
        let max = Math.max(d1, d2, d3, d4);


        if (0 <= this.grid.polarCenter.x && this.grid.polarCenter.x <= window.innerWidth){
            const dBot = Math.sqrt(c.orthogonal_projection(cBotLeft, new Vect(1,0)).dist2(c));
            const dTop = Math.sqrt(c.orthogonal_projection(cTopRight, new Vect(1,0)).dist2(c));
            min = Math.min(min, dBot, dTop);
            max = Math.max(max, dBot, dTop);
        }
        if ( 0 <= this.grid.polarCenter.y  && this.grid.polarCenter.y <= window.innerHeight){
            const dLeft = Math.sqrt(c.orthogonal_projection(cBotLeft, new Vect(0,1)).dist2(c));
            const dRight = Math.sqrt(c.orthogonal_projection(cTopRight, new Vect(0,1)).dist2(c));
            min = Math.min(min, dLeft, dRight);
            max = Math.max(max, dLeft, dRight);
        }

        const mini = (0 <= this.grid.polarCenter.x
             && this.grid.polarCenter.x <= window.innerWidth 
             && 0 <= this.grid.polarCenter.y 
             && this.grid.polarCenter.y <= window.innerHeight ) ? 0 :  Math.floor(min*this.camera.zoom/(this.grid.gridSize*2));
        // for (let i = mini ; i <= max*camera.zoom/(this.grid_size*2) ; i ++ ){
        //     drawArc(ctx, center, color, i*this.grid_size*2, 1, 1);
        // }

        for (const [i,circle] of this.gridPolarCircles.entries()){
            circle.setAttribute("cx", `${this.grid.polarCenter.x}`);
            circle.setAttribute("cy", `${this.grid.polarCenter.y}`);
            circle.setAttribute("r", `${this.grid.gridSize*2*(i+1+mini)}`)
        }

        for (const [i,polarLine] of this.gridPolarLines.entries()){
            const end = new Coord(c.x + Math.cos(i*2*3.14/this.grid.polarDivision), c.y + Math.sin(i*2*3.14/this.grid.polarDivision) );
            
            let inter1 = ( i > this.grid.polarDivision/2) ? linesIntersection(c, end, cTopLeft, cTopRight  ) : linesIntersection(c, end, cBotLeft, cBotRight  );
            if (i == 0){
                inter1 = linesIntersection(c, end, cTopRight, cBotRight );
            }
            
            if (typeof inter1 != "undefined"){
                const inter1c = CanvasCoord.fromCoord(inter1, this.camera);
                polarLine.setAttribute("x1", `${this.grid.polarCenter.x}`); 
                polarLine.setAttribute("y1", `${this.grid.polarCenter.y}`);
                polarLine.setAttribute("x2", `${inter1c.x}`)
                polarLine.setAttribute("y2", `${inter1c.y}`)
            }
        }
    }

    resetGraph(){
        // console.log("reset Graph")
        this.g = new Graph2();
        for (const element of this.elements.values()){
            if (element instanceof BoardVertex){
                this.g.setVertex(element.serverId, new VertexData2(element.cameraCenter.serverPos, element.color, element.innerLabel, element.outerLabel) );
            }
        }
        for (const element of this.elements.values()){
            if (element instanceof BoardLinkElement){
                this.g.addLink(element.startVertex.serverId, element.endVertex.serverId, element.isDirected ? ORIENTATION.DIRECTED : ORIENTATION.UNDIRECTED, new LinkData2(element.color, element.label));
            }
        }
    }


    highlight(indices: Array<[BoardElementType, number, number]>) {
        for (const [type, serverId, highlightValue] of indices){
            for (const element of this.elements.values()){
                if (element.boardElementType == type && element.serverId == serverId  ){
                    if (element instanceof BoardVertex || element instanceof BoardLinkElement){
                        element.setHighlight(highlightValue)
                    }
                    break;
                }
            }
        }
    }

    highlightVertex(serverId: number, value: number){
        for (const element of this.elements.values()){
            if (element.serverId == serverId && element instanceof BoardVertex ){
                element.setHighlight(value)
                break;
            }
        }
    }

    highlightLink(serverId: number, value: number){
        for (const element of this.elements.values()){
            if (element.serverId == serverId && element instanceof BoardLinkElement ){
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
        console.log("addGraphToClipboard")
        this.clearClipboard();
        this.clipboardInitPos = mousePos;
        this.svgContainer.style.cursor = "grab";

        

        const data = new Array();

        for (const [index, v] of graph.vertices){
            data.push( {
                type: "Vertex",
                index: index, 
                x: (v.data.pos.x + mousePos.x - this.camera.camera.x )/this.camera.zoom, 
                y: (v.data.pos.y + mousePos.y - this.camera.camera.y )/this.camera.zoom, 
                color: Color.Neutral, 
                weight: ""
            })
        }

        for (const [index, link] of graph.links){
            data.push( {
                type: "Link",
                index: link.index, 
                startIndex: link.startVertex.index, 
                endIndex: link.endVertex.index,
                orientation: link.orientation,
                color: Color.Neutral,
                weight: "",
                cp: undefined
            })
        }

        socket.emit(SocketMsgType.PASTE_GRAPH, data);
        return;


    }

    copySelectedElements(mousePos: CanvasCoord){
        this.clearClipboard();
        this.clipboardInitPos = mousePos;
        this.svgContainer.style.cursor = "grab";

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
        this.deselectAll()
        // for (const element of this.clipboard){
        //     console.log("delete element", element.serverId)
        //     element.delete()
        // }
        // this.clipboard.splice(0,this.clipboard.length);
        this.clipboardInitPos = undefined;
        this.svgContainer.style.cursor = "default";
    }

    translateClipboard(previousCanvasShift: CanvasVect, pos: CanvasCoord){
        // if (this.clipboard.length == 0) return;
        if (typeof this.clipboardInitPos == "undefined") return;

        console.log("translateClipboard")

        const shift = CanvasVect.from_canvas_coords(this.clipboardInitPos, pos);
        const cShift = shift.sub(previousCanvasShift);

        const selection = this.getSelectedElements();
        this.emitTranslateElements(selection, this.camera.serverVect(cShift) )
        previousCanvasShift.set_from(shift);
        
        // for (const element of this.elements.values()){
        //     if (element.isSelected){
        //         element.translate(cShift);
        //     }
        //     // if (element instanceof TargetPoint || element instanceof StrokeElement || element instanceof VertexElement){
        //     //     element.translate( cShift);
        //     // } else if (element instanceof LinkElement){
        //     //     // TODO
        //     //     // element.translate_cp_by_canvas_vect(cShift, this.camera);
        //     // } if (element instanceof ShapeElement){
        //     //     element.translate(cShift);
        //     // }
        // }

        // previousCanvasShift.set_from(shift);
    }


   

    sendRequestPasteClipboard(){
        const data = new Array();

        // for (const element of this.clipboard){
        //     if (element instanceof VertexElement){
        //         data.push( {
        //             type: "Vertex",
        //             index: element.serverId, 
        //             x: element.cameraCenter.serverPos.x, 
        //             y: element.cameraCenter.serverPos.y, 
        //             color: element.color, 
        //             weight: element.innerLabel
        //         })
        //     } else if (element instanceof LinkElement){
        //         data.push( {
        //             type: "Link",
        //             index: element.serverId, 
        //             startIndex: element.startVertex.serverId, 
        //             endIndex: element.endVertex.serverId,
        //             orientation: element.isDirected ? "DIRECTED" : "UNDIRECTED",
        //             color: element.color,
        //             weight: element.label,
        //             cp: undefined
        //         })
        //     } else if (element instanceof StrokeElement){
        //         data.push({
        //             type: "Stroke",
        //             index: element.serverId,
        //             color: element.color,
        //             width: element.width,
        //             positions: element.serverPositions
        //         })
        //     } else if (element instanceof ShapeElement){
        //         data.push({
        //             type: "Rectangle",
        //             index: element.serverId,
        //             color: element.color,
        //             x1: element.canvasC1.serverPos.x,
        //             x2: element.canvasC2.serverPos.x,
        //             y1: element.canvasC1.serverPos.y,
        //             y2: element.canvasC2.serverPos.y
        //         })
        //     }
        // }

        
        socket.emit(SocketMsgType.PASTE_GRAPH, data);
    }


    getVertex(serverId: number): undefined | BoardVertex {
        for (const element of this.elements.values()){
            if (element instanceof BoardVertex && element.serverId == serverId){
                return element;
            }
        }
        return undefined;
    }

    getLink(serverId: number): undefined | BoardLinkElement {
        for (const element of this.elements.values()){
            if (element instanceof BoardLinkElement && element.serverId == serverId){
                return element;
            }
        }
        return undefined;
    }


   


    nearbyLink(pos: CanvasCoord): Option<BoardLinkElement>{
        for (const element of this.elements.values()){
            if (element instanceof BoardLinkElement && element.isNearby(pos, 30)){
                return element;
            }
        }
        return undefined
    }
    
    // return a CanvasCoord near mouse_canvas_coord which aligned on other vertices or on the grid
    alignPosition(posToAlign: CanvasCoord, excludedIndices: Set<number>): CanvasCoord {
        this.alignmentLineHori.setAttribute("display", "none");
        this.alignmentLineVert.setAttribute("display", "none");
        
        const alignedPos = new CanvasCoord(posToAlign.x, posToAlign.y, this.camera);
        if (this.isAligning) {
            this.alignementHorizontalY = undefined;
            this.alignementVerticalX = undefined;
            for (const element of this.elements.values()){
                if (excludedIndices.has(element.serverId) == false) {
                    if (Math.abs(element.cameraCenter.y - posToAlign.y) <= 15) { 
                        alignedPos.y = element.cameraCenter.y;
                        // this.alignement_horizontal_y = element.cameraCenter.y;
                        this.alignmentLineHori.setAttribute("display", "");
                        this.alignmentLineHori.setAttribute("y1", element.cameraCenter.y.toString())
                        this.alignmentLineHori.setAttribute("y2", element.cameraCenter.y.toString())
                        // break
                    }
                    if (Math.abs(element.cameraCenter.x - posToAlign.x) <= 15) {
                        alignedPos.x = element.cameraCenter.x;
                        this.alignmentLineVert.setAttribute("display", "");
                        this.alignmentLineVert.setAttribute("x1", element.cameraCenter.x.toString())
                        this.alignmentLineVert.setAttribute("x2", element.cameraCenter.x.toString())
                        // this.alignement_vertical_x = element.cameraCenter.x;
                        // break;
                    }
                }
            }
        }
        if ( this.grid.type == GridType.GridRect ) {
            const gridSize = this.grid.gridSize;
            for (let x = this.camera.camera.x % gridSize; x < window.innerWidth; x += gridSize) {
                if (Math.abs(x - posToAlign.x) <= 15) {
                    alignedPos.x = x;
                    break;
                }
            }
            for (let y = this.camera.camera.y % gridSize; y < window.innerHeight; y += gridSize) {
                if (Math.abs(y - posToAlign.y) <= 15) {
                    alignedPos.y = y;
                    break;
                }
            }
        } else  if ( this.grid.type == GridType.GridVerticalTriangular ) {
            const gridSize = this.grid.gridSize;
            const h = gridSize*Math.sqrt(3)/2;

            // Find the corners of the rectangle containing the point
            const px = ((posToAlign.x-this.camera.camera.x)- (posToAlign.y-this.camera.camera.y)/Math.sqrt(3))/gridSize;
            const py = (posToAlign.y-this.camera.camera.y)/h;
            const i = Math.floor(px);
            const j = Math.floor(py);
            const corners = [
                new CanvasCoord(i*gridSize + j*gridSize/2, Math.sqrt(3)*j*gridSize/2, this.camera), // top left
                new CanvasCoord((i+1)*gridSize + j*gridSize/2, Math.sqrt(3)*j*gridSize/2, this.camera), // top right
                new CanvasCoord(i*gridSize + (j+1)*gridSize/2, Math.sqrt(3)*(j+1)*gridSize/2, this.camera), // bottom left
                new CanvasCoord((i+1)*gridSize + (j+1)*gridSize/2, Math.sqrt(3)*(j+1)*gridSize/2, this.camera) // bottom right
            ]
            
            // align on the corners if the point is near enough
            for (let corner of corners){
                // corner = corner.add(camera.camera);
                corner.setLocalPos(corner.x + this.camera.camera.x, corner.y + this.camera.camera.y)
                if (Math.sqrt(corner.dist2(new CanvasCoord(posToAlign.x, posToAlign.y, this.camera) )) <= 2*15){
                    alignedPos.x = corner.x;
                    alignedPos.y = corner.y;
                    return alignedPos;
                }
            }

            // projection on the \ diagonal starting at the top left corner
            const projection1 = posToAlign.orthogonalProjection(corners[0], new Vect(1 , Math.sqrt(3))) ; 
            if (projection1.dist2(posToAlign) <= 15*15){
                alignedPos.x = projection1.x;
                alignedPos.y = projection1.y;
            }

            // projection on the \ diagonal starting at the top right corner
            const projection2 = posToAlign.orthogonalProjection(corners[1], new Vect(1 , Math.sqrt(3))) ; 
            if (projection2.dist2(posToAlign) <= 15*15){
                alignedPos.x = projection2.x;
                alignedPos.y = projection2.y;
            }

            // projection on the / diagonal starting at the top right corner
            const projection = posToAlign.orthogonalProjection(corners[1], new Vect(-1 , Math.sqrt(3))) ; 
            if (projection.dist2(posToAlign) <= 15*15){
                alignedPos.x = projection.x;
                alignedPos.y = projection.y;
            }

            // align on the horizontal lines
            for (let k of [0,3]){ // 0 and 3 are the indices of the top left and bottom right corner
                // of the quadrilateral containing the point
                let y = corners[k].y;
                if (Math.abs(y - posToAlign.y) <= 15) {
                    alignedPos.y = y;
                    break;
                }
            }
            
        } else if (this.grid.type == GridType.GridPolar){
            const size = this.grid.gridSize;
            const center = this.grid.polarCenter;
            const p = alignedPos;

            let d = Math.sqrt(p.dist2(center));
            if (d != 0){
                const i = Math.floor(d/(2*size));
                let alignToCenter = false;
                if ( d - i*2*size <= 20){
                    if (i == 0) {
                        alignToCenter = true;
                    }
                    alignedPos.x = center.x + (alignedPos.x-center.x)*(i*2*size)/d;
                    alignedPos.y = center.y + (alignedPos.y-center.y)*(i*2*size)/d;
                } else if ( (i+1)*2*size - d <= 20){
                    alignedPos.x = center.x + (alignedPos.x-center.x)*((i+1)*2*size)/d;
                    alignedPos.y = center.y + (alignedPos.y-center.y)*((i+1)*2*size)/d;
                }
                
                if (alignToCenter == false){
                    for (let j = 0 ; j < this.grid.polarDivision; j ++){
                        const angle = 2*Math.PI*j/this.grid.polarDivision;
                        const end = new Vect(1,0);
                        end.rotate(angle);
                        const projection = alignedPos.orthogonalProjection(center, end);
                        if ( Math.sqrt(alignedPos.dist2(projection)) <= 20){
                            alignedPos.x = projection.x;
                            alignedPos.y = projection.y;
                        }
                    }
                }
            }
        }
        alignedPos.setLocalPos(alignedPos.x, alignedPos.y);
        return alignedPos;
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
            if (element instanceof BoardVertex && element.serverId == serverId){
                element.delete();
                this.elements.delete(key);
            }
            if (element instanceof BoardLinkElement && (element.startVertex.serverId == serverId || element.endVertex.serverId == serverId)){
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
            if (element instanceof BoardLinkElement && element.serverId == serverId){
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
                this.emitDeleteElements([[element.boardElementType, element.serverId]]);
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
        
        

        this.updateGridAfterCameraChange();

        this.camera.translateCamera(shift);
        this.updateAfterCameraChange();
        if(typeof this.selfUser.following != "undefined"){
            this.selfUser.unfollow(this.selfUser.following);
        }
        socket.emit("my_view", this.camera.camera.x, this.camera.camera.y, this.camera.zoom);
    }

    updateAfterCameraChange(){
        this.updateGridAfterCameraChange()

        for (const element of this.elements.values()){
            element.updateAfterCameraChange()
        }

        for (const localElement of this.localElements.values()){
            localElement.updateAfterCameraChange();
        }

        // for (const rep of this.representations.values()){
        //     rep.update_after_camera_change(this.camera);
        // }
    }


    selectElementsInRect(corner1: CanvasCoord, corner2: CanvasCoord) {
        for (const element of this.elements.values()) {
            if (element.isInRect(corner1, corner2)) {
                element.select();
            }
        }
        this.showAttributes()
    }

    /**
     * 
     */
    addVerticesSubsetFromSelection(){
        const selectedVertices = [];
        for (const element of this.elements.values()){
            if (element instanceof BoardVertex && element.isSelected){
                selectedVertices.push(element.id);
            }
        }
        if (selectedVertices.length > 0){
            new VerticesSubset(this, selectedVertices, 30);

            
        }
    }


    /**
     * 
     * @returns [x, y, width, height] in Server Coord
     */
    getSelectionBoundingBox(): [number, number, number, number] {
        let noSelection = true;
        let x = 0;
        let y = 0;
        let maxX = 0;
        let maxY = 0;
        for (const element of this.elements.values()) {
            if (element.isSelected){
                // console.log("selected:", element.serverCenter)
                if (noSelection){
                    noSelection = false;
                    x = element.cameraCenter.serverPos.x;
                    y = element.cameraCenter.serverPos.y;
                    maxX = x;
                    maxY = y;
                }
                x = x < element.cameraCenter.serverPos.x ? x : element.cameraCenter.serverPos.x;
                y = y < element.cameraCenter.serverPos.y ? y : element.cameraCenter.serverPos.y;
                maxX = maxX > element.cameraCenter.serverPos.x ? maxX : element.cameraCenter.serverPos.x;
                maxY = maxY > element.cameraCenter.serverPos.y ? maxY : element.cameraCenter.serverPos.y;
            }
        }
        return [x, y, maxX-x, maxY-y]
    }


    getSelectionCenter(): Coord{
        const [x,y,w,h] = this.getSelectionBoundingBox();
        return new Coord(x+w/2, y+h/2);
    }

    initRotateSelection(){
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof BoardVertex){
                element.startRotate();
            }
        }
    }

    localRotateSelection(center: Coord, angle: number){
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof BoardVertex){
                element.setAngle(center, angle);
            }
        }
    }

    endLocalRotateSelection(center: Coord, angle: number){
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof BoardVertex){
                element.setAngle(center, angle);
            }
        }
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof BoardVertex){
                const shift = element.posBeforeRotate.vectorTo(element.cameraCenter.serverPos);
                const cshift = this.camera.createCanvasVect(shift);
                element.translate(cshift.opposite())
                this.emitTranslateElements([[BoardElementType.Vertex, element.serverId]], shift)
            }
        }
    }

    localResizeSelection(center: Coord, ratio: number){
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof BoardVertex){
                element.applyScale(center, ratio);
            }
        }
    }

    endLocalResizeSelection(center: Coord, ratio: number){
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof BoardVertex){
                element.applyScale(center, ratio);
            }
        }
        for (const element of this.elements.values()){
            if (element.isSelected && element instanceof BoardVertex){
                const shift = element.posBeforeRotate.vectorTo(element.cameraCenter.serverPos);
                const cshift = this.camera.createCanvasVect(shift);
                element.translate(cshift.opposite())
                this.emitTranslateElements([[BoardElementType.Vertex, element.serverId]], shift)
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

    getElement(type: BoardElementType, serverId: number): Option<BoardElement>{
        for (const elt of this.elements.values()){
            if (elt.boardElementType == type && elt.serverId == serverId){
                return elt;
            }
        }
        return undefined;
    }


    getElementNearby(pos: CanvasCoord, interactableElementType: Set<DOWN_TYPE>): Option<ELEMENT_DATA> {

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
            if ( interactableElementType.has(DOWN_TYPE.VERTEX) && element instanceof BoardVertex){
                if (element.isNearby(pos, 15)){
                    return new ELEMENT_DATA_VERTEX(element);
                }
            }
            if ( interactableElementType.has(DOWN_TYPE.LINK) && element instanceof BoardLinkElement){
                if (element.isNearby(pos, 15)){
                    return new ELEMENT_DATA_LINK(element);
                }
            }
            if (interactableElementType.has(DOWN_TYPE.RECTANGLE) && element instanceof ShapeElement){
                if (element.isClickOver(pos)){
                    return new ELEMENT_DATA_RECTANGLE(element, undefined);
                }
            }

            if (interactableElementType.has(DOWN_TYPE.STROKE) && element instanceof StrokeElement){
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
        this.clearSelection();
    }

    unhighlightAll(){
        for (const element of this.elements.values()){
            if (element instanceof BoardVertex || element instanceof BoardLinkElement){
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
            if (element instanceof BoardVertex){
                if (element.isSelected){
                    set.add(element.serverId);
                }
            }
        }
        return set;
    }

    /**
     * 
     * @returns The type and the serverId of the selected elements
     */
    getSelectedElements(): Array<[BoardElementType, number]> {
        const t = new Array<[BoardElementType, number]>();
        for (const element of this.elements.values()){
            if (element.isSelected){
                t.push([element.boardElementType, element.serverId]);
            }
        }
        return t;
    }

    /**
     * This is different from getSelectedElements
     * @returns the set of indices of the selected elements
     */
    getSelectedIndices(): Set<number> {
        const t = new Set<number>();
        for (const element of this.elements.values()){
            if (element.isSelected){
                t.add(element.id)
            }
        }
        return t;
    }

    clearSelection() {
        for (const element of this.elements.values()){
            element.deselect();
        }
        this.hideAttributes()
    }

   

    translateElement(type: BoardElementType, serverId: number, cshift: CanvasVect){
        for (const element of this.elements.values()){
            if (element.boardElementType == type && element.serverId == serverId){
                element.translate(cshift);
                break;
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


    emitRedo() {
        socket.emit(SocketMsgType.REDO);
    }

    emitUndo() {
        socket.emit(SocketMsgType.UNDO);
    }

    emitTranslateElements(indices: Array<[BoardElementType,number]>, shift: Vect){
        socket.emit(SocketMsgType.TRANSLATE_ELEMENTS, indices, shift);
    }

    emitDeleteElements(indices: Array<[BoardElementType,number]>){
        // console.log("emit delete elements: ", indices);
        socket.emit(SocketMsgType.DELETE_ELEMENTS, this.agregId, indices);
    }

    emitUpdateElement(type: BoardElementType, index: number, attribute: string, value: any){
        console.log("emit update", type, index, attribute, value)
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

    emitApplyModifyer(modifyer: GraphModifyer){
        console.log("Emit: apply modifier")
        const attributesData = new Array<string | number>();
        let sendVerticesSelection = false;
        for (const attribute of modifyer.attributes){
            
            attributesData.push(attribute.value);
        }
        if ( sendVerticesSelection){
            const verticesSelection = new Array<number>();
            for (const vertex of this.elements.values()){
                if (vertex instanceof BoardVertex && vertex.isSelected){
                    verticesSelection.push(vertex.serverId);
                }
            }
            socket.emit(SocketMsgType.APPLY_MODIFYER, modifyer.name, attributesData, verticesSelection);
        }
        else {
            socket.emit(SocketMsgType.APPLY_MODIFYER, modifyer.name, attributesData);
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
                console.log("emit add vertex", vertexData.pos);
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



    


    updateColleaguesListDiv() {
        const div = document.getElementById("user_list");
        if (div == null) return;
        div.innerHTML = "";

        let colleagues: Array<Colleague> = [];
        for (const element of this.localElements.values()){
            if (element instanceof Colleague){
                colleagues.push(element);
            }
        }

        if (colleagues.length === 0) {
            div.style.visibility = "hidden";
            // div.style.marginLeft = "0px";
            div.style.padding = "0px";
        }
        else {
            div.style.visibility = "visible";
            div.style.padding = "2px";
            // div.style.marginLeft = "10px";
        }
    
        for (const u of colleagues) {
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
                    board.selfUser.follow(u.id);
                }
            }
            div.appendChild(newDiv);
        }
    }




    




    isDarkMode(){
        return this.darkMode;
    }

    toggleDarkMode(){
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
        for (const polarCircle of this.gridPolarCircles){
            polarCircle.setAttribute("display", "none");
        }
        for (const polarLine of this.gridPolarLines){
            polarLine.setAttribute("display", "none");
        }
        

        if (typeof type == "undefined"){
            this.gridLayer.setAttribute("display", "none");
        }
        else if (type == GridType.GridRect){
            this.gridLayer.setAttribute("fill", "url(#smallGrid)");
            this.gridLayer.setAttribute("display", "");
        } else if (type == GridType.GridVerticalTriangular){
            this.gridLayer.setAttribute("fill", "url(#VerticalTriangular)");
            this.gridLayer.setAttribute("display", "");
        } else if (type == GridType.GridPolar){
            this.gridLayer.setAttribute("fill", "transparent");
            this.gridLayer.setAttribute("display", "");
            for (const polarLine of this.gridPolarLines){
                polarLine.setAttribute("display", "");
            }
            for (const polarCircle of this.gridPolarCircles){
                polarCircle.setAttribute("display", "");
            }
        }
    }

}