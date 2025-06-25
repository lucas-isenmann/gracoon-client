import { CanvasCoord } from "../../board/display/canvas_coord";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { PreInteractor } from "../pre_interactor";
import { ClientBoard } from "../../board/board";
import { PointedElementData } from "../../interactors/pointed_element_data";
import { Option } from "gramoloss";
import { StrokeElement } from "../../board/elements/stroke2";

let lastStroke: Option<StrokeElement> = undefined;
let indexLastStroke: Option<number> = undefined;
let pointsCounter = 0;
const SAMPLE_PERIOD = 2; // >=1,  number of frames between two points, skipping the others; 3 is empirically a good value

export function createStrokeInteractor(board: ClientBoard){

    const strokeInteractorV2 = new PreInteractor(INTERACTOR_TYPE.PEN, "Pen", "p", "stroke", "default", new Set([DOWN_TYPE.VERTEX]));

    strokeInteractorV2.mousedown = ((board: ClientBoard, pointed: PointedElementData) => {
        const server_pos = board.camera.createServerCoord(pointed.pointedPos);
        lastStroke = new StrokeElement(board,  board.colorSelected, pointed.pointedPos, 2);
        indexLastStroke = lastStroke.id;

    })
    
    strokeInteractorV2.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if( typeof lastStroke != "undefined"){
            pointsCounter++ ;
            if(pointsCounter % SAMPLE_PERIOD === 0){
                lastStroke.push(e);
                return true;
            }
        }
        return false;
    
    })
    
    strokeInteractorV2.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if (typeof lastStroke != "undefined"){
            lastStroke.push(e);
            // const serializedArray = JSON.stringify(lastStroke.positions);
            // const memorySize = new Blob([serializedArray]).size;
            // console.log(`Memory size: ${memorySize} bytes`);
    
            board.emitAddElement( lastStroke, (response: number) => {
             })
        
            lastStroke = undefined;
            indexLastStroke = undefined;
            pointsCounter = 0;
        }
       
    })

    return strokeInteractorV2;
}
