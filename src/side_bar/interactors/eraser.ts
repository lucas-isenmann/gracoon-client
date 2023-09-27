import { Option } from "gramoloss";
import { ClientBoard } from "../../board/board";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { drawCircle } from "../../board/display/draw_basics";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { PointedElementData } from "../../interactors/pointed_element_data";
import { PreInteractor } from "../pre_interactor";

// INTERACTOR ERASER

export class EraserInteractor extends PreInteractor {
    isErasing: boolean;
    ERASE_DISTANCE: number;

    constructor(board: ClientBoard)
    {
        super(INTERACTOR_TYPE.ERASER, "Erase objects", "r", "eraser", 'url("../img/cursors/eraser.svg"), auto', new Set([DOWN_TYPE.STROKE]));
        this.isErasing = false;
        this.ERASE_DISTANCE = 8;

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
            return true;
        })

        interactor.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
            interactor.isErasing = false;
        })

        interactor.draw = ((board: ClientBoard, mousePos: Option<CanvasCoord>) => {
            if ( typeof mousePos != "undefined"){
                drawCircle(mousePos, "white", interactor.ERASE_DISTANCE, 0.4, board.ctx);
            }
        })
    }
}





