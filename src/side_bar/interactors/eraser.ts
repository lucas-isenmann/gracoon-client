import { ClientBoard } from "../../board/board";
import { CanvasCoord } from "../../board/canvas_coord";
import { draw_circle } from "../../draw_basics";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { mouse_pos } from "../../interactors/interactor_manager";
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

        interactor.mousedown = ((board: ClientBoard, e: CanvasCoord) => {
            board.eraseAt(e, interactor.ERASE_DISTANCE);
            interactor.isErasing = true;
        })

        interactor.mousemove = ((board: ClientBoard, e: CanvasCoord) => {
            if (interactor.isErasing) {
                board.eraseAt(e, interactor.ERASE_DISTANCE);
            }
            return true;
        })

        interactor.mouseup = ((board: ClientBoard, e: CanvasCoord) => {
            interactor.isErasing = false;
        })

        interactor.draw = ((board: ClientBoard) => {
            draw_circle(mouse_pos, "white", interactor.ERASE_DISTANCE, 0.4, board.ctx);
        })
    }

    
    
}





