import { Option } from "gramoloss";
import { ClientBoard } from "../../board/board";
import { CanvasCoord } from "../../board/canvas_coord";
import { draw_circle } from "../../draw_basics";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { PointedElementData } from "../../interactors/pointed_element_data";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";

// INTERACTOR ERASER


export class EraserInteractor extends InteractorV2 {
    isErasing: boolean;
    ERASE_DISTANCE: number;

    constructor(board: ClientBoard)
    {
        super(board, INTERACTOR_TYPE.ERASER, "Erase objects", "r", ORIENTATION_INFO.RIGHT, "eraser", 'url("../img/cursors/eraser.svg"), auto', new Set([DOWN_TYPE.STROKE]));
        this.isErasing = false;
        this.ERASE_DISTANCE = 8;

        const interactor = this;

        interactor.mousedown = ((board: ClientBoard, pointed: PointedElementData) => {
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

        interactor.draw = ((board: ClientBoard, mousePos: CanvasCoord) => {
            draw_circle(mousePos, "white", interactor.ERASE_DISTANCE, 0.4, board.ctx);
        })
    }

    
    
}





