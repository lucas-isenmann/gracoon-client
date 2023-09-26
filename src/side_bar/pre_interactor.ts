import { CanvasCoord } from "../board/display/canvas_coord";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../interactors/interactor";
import { ClientBoard } from "../board/board";
import { Option } from "gramoloss";
import { PointedElementData } from "../interactors/pointed_element_data";

export class PreInteractor {
    imgSrc: string;
    shortcut: string;
    info: string;
    cursorStyle: string;
    id: INTERACTOR_TYPE;

    interactable_element_type: Set<DOWN_TYPE>;
    
    mousedown: (board: ClientBoard, data: PointedElementData) => void;
    mousemove: (board: ClientBoard, data: Option<PointedElementData>, e: CanvasCoord) => boolean;
    mouseup: (board: ClientBoard, data: Option<PointedElementData>, e: CanvasCoord) => void;
    onleave: () => void;
    draw: (board: ClientBoard, mousePos: Option<CanvasCoord>) => void;
    trigger: (board: ClientBoard, mousePos: Option<CanvasCoord>) => void;


    constructor(id: INTERACTOR_TYPE, info: string, shortcut: string, imgSrc: string, cursor_style: string, interactable_element_type: Set<DOWN_TYPE>)
    {
        this.id = id;
        this.info = info;
        this.shortcut = shortcut;
        this.imgSrc = imgSrc;
        this.cursorStyle = cursor_style;

        this.interactable_element_type = interactable_element_type;
        this.onleave = () => {};
        this.draw = () => {};
        this.mousedown = () => {};
        this.mousemove = () => {return false;};
        this.mouseup = () => {};
        this.trigger = () => {};
    }

}