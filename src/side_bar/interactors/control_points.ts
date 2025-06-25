/*

INTERACTOR CONTROL POINT

Features :
- click on link: create a control point on the middle
- click and move on a control point: move it. With Control Key pressed: aligned on the mediatrice of the link
- right click on a control point: remove it

*/


import { Option, Vect } from "gramoloss";
import { BoardElementType, ClientBoard } from "../../board/board";
import { CanvasVect } from "../../board/display/canvasVect";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { PreInteractor } from "../pre_interactor";
import { ELEMENT_DATA_CONTROL_POINT, ELEMENT_DATA_LINK, PointedElementData } from "../../interactors/pointed_element_data";


export function createControlPointInteractor(board: ClientBoard): PreInteractor{

    const controlPointInteractorV2 = new PreInteractor(INTERACTOR_TYPE.CONTROL_POINT, "Edit control points", "h",  "control_point", "default", new Set([DOWN_TYPE.LINK, DOWN_TYPE.CONTROL_POINT]));

    let previousShift: Vect = new Vect(0,0);
    let previousCanvasShift = new CanvasVect(0,0);
    
    controlPointInteractorV2.mousedown = ((board: ClientBoard, pointed: PointedElementData) => {
        previousShift = new Vect(0,0);
        previousCanvasShift = new CanvasVect(0,0);

        if ( pointed.data instanceof ELEMENT_DATA_LINK){
            // const link = pointed.data.element;
            // if (typeof link.data.cp == "undefined"){
            //     const v1 = link.startVertex;
            //     const v2 = link.endVertex;
            //     const new_cp = v1.data.pos.middle(v2.data.pos);
            //     board.emitUpdateElement( BoardElementType.Link, link.index, "cp", new_cp);
            // } else {
            //     board.emitUpdateElement( BoardElementType.Link, pointed.data.element.index, "cp", "");
            // }
        }
    })
    
    controlPointInteractorV2.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if (typeof pointed == "undefined") return false;

        if ( pointed.data instanceof ELEMENT_DATA_CONTROL_POINT ){
            // const link = pointed.data.element;
            // if ( board.keyPressed.has("Control") ){
            //     const v1 = link.startVertex;
            //     const v2 = link.endVertex;

            //     const middle = v1.data.pos.middle(v2.data.pos);
            //     const vect = Vect.from_coords(v1.data.pos, v2.data.pos);
            //     const orthogonal = new Vect(-vect.y, vect.x);
            //     const eCoord = board.camera.createServerCoord(e);
            //     const projection = eCoord.orthogonal_projection(middle, orthogonal);
            //     const downCoordServer = board.camera.createServerCoord(pointed.pointedPos);

            //     const shift = Vect.from_coords(downCoordServer, projection);
            //     board.emit_translate_elements([[BoardElementType.ControlPoint, link.index]], shift.sub(previousShift));
            //     previousShift.set_from(shift);
            // } else {
            //     const shift = board.camera.server_vect(CanvasVect.from_canvas_coords(pointed.pointedPos,e));
            //     board.emit_translate_elements([[BoardElementType.ControlPoint, link.index]], shift.sub(previousShift));
            //     previousShift.set_from(shift);
            // }
            return true;
        }
        return false;
    })
    
    
    
    return controlPointInteractorV2;    
}
