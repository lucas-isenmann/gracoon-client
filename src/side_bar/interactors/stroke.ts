import { ClientStroke } from "../../board/stroke";
import { CanvasCoord } from "../../board/canvas_coord";
import { DOWN_TYPE } from "../../interactors/interactor";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";
import { ClientBoard } from "../../board/board";

let last_stroke = null;
// var begin_last_stroke = null;
let index_last_stroke = null;
let gap_refresh = 0;
const sample_period = 3; // number of frames between two points, skipping the others; 3 is empirically a good value

export function createStrokeInteractor(board: ClientBoard){

    const stroke_interactorV2 = new InteractorV2(board, "pen", "Pen", "p", ORIENTATION_INFO.RIGHT, "stroke", "default", new Set([DOWN_TYPE.VERTEX]));

    stroke_interactorV2.mousedown = ((board: ClientBoard, e: CanvasCoord) => {
        const server_pos = board.view.create_server_coord(e);
        last_stroke = new ClientStroke([server_pos], board.colorSelected, 2, board.view);
    
        // TO CHANGE
        let index = 0;
        while (board.strokes.has(index)) {
            index += 1;
        }
        index_last_stroke = index;
        board.strokes.set(index_last_stroke, last_stroke);
    })
    
    stroke_interactorV2.mousemove = ((board: ClientBoard, e) => {
        if(last_stroke !== null){
            gap_refresh++ ;
            if(gap_refresh % sample_period === 0){
                board.strokes.get(index_last_stroke).push(e, board.view);
                return true;
            }
        }
        return false;
    
    })
    
    stroke_interactorV2.mouseup = ((board: ClientBoard, e: CanvasCoord) => {
        board.strokes.get(index_last_stroke).push(e, board.view);
    
        const s = board.strokes.get(index_last_stroke);
        board.emit_add_element( s, (response: number) => { })
    
        last_stroke = null;
        index_last_stroke = null;
        gap_refresh = 0;
    })

    return stroke_interactorV2;
}
