import { Option } from "gramoloss";
import { CanvasCoord } from "../board/display/canvas_coord";
import { ClientRepresentation } from "../board/representations/client_representation";
import { RESIZE_TYPE } from "./interactor";
import { BoardElement } from "../board/elements/element";
import { BoardElementType } from "../board/board";
import { StrokeElement } from "../board/elements/stroke";
import { BoardLinkElement } from "../board/elements/link";
import { ShapeElement } from "../board/elements/shape";
import { BoardVertex } from "../board/elements/vertex";


export interface ELEMENT_DATA {
    // element: ClientVertex | ClientLink | ClientRectangle  | ClientStroke | ClientRepresentation | BoardElement;
    element: BoardElement;
}

export class ELEMENT_DATA_VERTEX {
    element: BoardVertex;
    constructor(v: BoardVertex){
        this.element = v;
    }
}

export class ELEMENT_DATA_LINK {
    element: BoardLinkElement;
    constructor(l: BoardLinkElement){
        this.element = l;
    }
}

export class ELEMENT_DATA_CONTROL_POINT {
    element: BoardLinkElement;
    constructor(l: BoardLinkElement){
        this.element = l;
    }
}

export class ELEMENT_DATA_STROKE {
    element: StrokeElement;
    constructor(s: StrokeElement){
        this.element = s;
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
    element: ShapeElement;
    resizeType: Option<RESIZE_TYPE>;
    constructor(rect: ShapeElement, resizeType: Option<RESIZE_TYPE>){
        this.element = rect;
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