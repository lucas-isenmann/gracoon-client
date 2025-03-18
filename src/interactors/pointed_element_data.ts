import { Board, Option } from "gramoloss";
import { ClientArea } from "../board/area";
import { CanvasCoord } from "../board/display/canvas_coord";
import { ClientLink } from "../board/link";
import { ClientRectangle } from "../board/rectangle";
import { ClientRepresentation } from "../board/representations/client_representation";
import { ClientStroke } from "../board/stroke";
import { ClientTextZone } from "../board/text_zone";
import { ClientVertex } from "../board/vertex";
import { RESIZE_TYPE } from "./interactor";
import { BoardElement, LinkElement, VertexElement } from "../board/element";
import { BoardElementType } from "../board/board";


export interface ELEMENT_DATA {
    element: ClientVertex | ClientLink | ClientRectangle | ClientArea | ClientStroke | ClientRepresentation | ClientTextZone | BoardElement;
}

export class ELEMENT_DATA_VERTEX {
    element: VertexElement;
    constructor(v: VertexElement){
        this.element = v;
    }
}

export class ELEMENT_DATA_LINK {
    element: LinkElement;
    constructor(l: LinkElement){
        this.element = l;
    }
}

export class ELEMENT_DATA_CONTROL_POINT {
    element: ClientLink;
    constructor(l: ClientLink){
        this.element = l;
    }
}

export class ELEMENT_DATA_STROKE {
    element: ClientStroke;
    index: number;
    constructor(s: ClientStroke, index: number){
        this.element = s;
        this.index = index;
    }
}

export class ELEMENT_DATA_TEXT_ZONE {
    element: ClientTextZone;
    index: number;
    constructor(t: ClientTextZone, index: number){
        this.element = t;
        this.index = index;
    }
}

export class ELEMENT_DATA_AREA {
    element: ClientArea;
    index: number;
    resizeType: Option<RESIZE_TYPE>;
    constructor(area: ClientArea, index: number, resizeType: Option<RESIZE_TYPE>){
        this.element = area;
        this.index = index;
        this.resizeType = resizeType;
    }
}

export class ELEMENT_DATA_REPRESENTATION {
    element: ClientRepresentation;
    index: number;
    resizeType: Option<RESIZE_TYPE>;
    constructor(rep: ClientRepresentation, index: number, resizeType: Option<RESIZE_TYPE>){
        this.element = rep;
        this.index = index;
        this.resizeType = resizeType;
    }
}

export class ELEMENT_DATA_REPRESENTATION_SUBELEMENT {
    element: ClientRepresentation;
    index: number;
    subElementIndex: number;
    constructor(rep: ClientRepresentation, index: number, subElementIndex: number){
        this.element = rep;
        this.index = index;
        this.subElementIndex = subElementIndex;
    }
}


export class ELEMENT_DATA_RECTANGLE {
    element: ClientRectangle;
    index: number;
    resizeType: Option<RESIZE_TYPE>;
    constructor(rect: ClientRectangle, index: number, resizeType: Option<RESIZE_TYPE>){
        this.element = rect;
        this.index = index;
        this.resizeType = resizeType;
    }
}





export class PointedElementData {
    pointedPos: CanvasCoord;
    magnetPos: CanvasCoord;
    buttonType: number;
    type: BoardElementType | undefined;
    data: Option<ELEMENT_DATA>;
    constructor(pointedPos: CanvasCoord, magnetPos: CanvasCoord, buttonType: number,  data: Option<ELEMENT_DATA>){
        this.pointedPos = pointedPos;
        this.magnetPos = magnetPos;
        this.buttonType = buttonType;
        this.data = data; 
        this.type = undefined;
        if (typeof data != "undefined"){
            if (data instanceof ELEMENT_DATA_VERTEX){
                this.type = BoardElementType.Vertex;
            }
            if (data instanceof ELEMENT_DATA_LINK){
                this.type = BoardElementType.Link;
            }
            if (data instanceof ELEMENT_DATA_RECTANGLE){
                this.type = BoardElementType.Rectangle;
            }
        }
        
    }
}