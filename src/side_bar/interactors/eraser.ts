import { Option } from "gramoloss";
import { ClientBoard } from "../../board/board";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { PointedElementData } from "../../interactors/pointed_element_data";
import { PreInteractor } from "../pre_interactor";
import { LocalPoint } from "../../board/elements/localPoint";
import { Camera } from "../../board/display/camera";

// INTERACTOR ERASER


export class EraserInteractor extends PreInteractor {
    isErasing: boolean;
    ERASE_DISTANCE: number;
    disk: LocalPoint;
    

    constructor(board: ClientBoard)
    {
        super(INTERACTOR_TYPE.ERASER, "Erase objects", "r", "eraser", 'url("../img/cursors/eraser.svg"), auto', new Set([DOWN_TYPE.STROKE, DOWN_TYPE.RECTANGLE]));
        this.isErasing = false;
        this.ERASE_DISTANCE = 8;

        this.disk = new LocalPoint(board, new CanvasCoord(0,0, board.camera));
        this.disk.disk.setAttribute("r", this.ERASE_DISTANCE.toString()); 
        this.disk.disk.setAttribute("stroke", "#fff");    
        this.disk.disk.setAttribute("stroke-width", "1");    
        this.disk.disk.setAttribute("fill-opacity", "0.2");
        this.disk.show();


        const interactor = this;

        interactor.mousedown = ((board: ClientBoard, pointed: PointedElementData) => {
            board.regenAgregId();
            board.eraseAt(pointed.pointedPos, interactor.ERASE_DISTANCE);
            interactor.isErasing = true;
        })

        interactor.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
            if (interactor.isErasing) {
                board.eraseAt(e, interactor.ERASE_DISTANCE);
            }
            interactor.disk.setCanvasPos(e);
            return true;
        })

        interactor.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
            interactor.isErasing = false;
        })

        interactor.onleave = () => {
            interactor.disk.hide();
        }

        interactor.trigger = (_, mousePos: Option<CanvasCoord>) => {
            interactor.disk.show();
        }

        interactor.draw = ((board: ClientBoard, mousePos: Option<CanvasCoord>) => {
        })
    }
}





