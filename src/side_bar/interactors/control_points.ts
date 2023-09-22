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
import { DOWN_TYPE } from "../../interactors/interactor";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";
import { ELEMENT_DATA_CONTROL_POINT, ELEMENT_DATA_LINK, PointedElementData } from "../../interactors/pointed_element_data";


export function createControlPointInteractor(board: ClientBoard){

    const control_point_interactorV2 = new InteractorV2(board, "control_point", "Edit control points", "h", ORIENTATION_INFO.RIGHT, "control_point", "default", new Set([DOWN_TYPE.LINK, DOWN_TYPE.CONTROL_POINT]));

    let previous_shift: Vect = new Vect(0,0);
    let previous_canvas_shift = new CanvasVect(0,0);
    
    control_point_interactorV2.mousedown = ((board: ClientBoard, pointed: PointedElementData) => {
        previous_shift = new Vect(0,0);
        previous_canvas_shift = new CanvasVect(0,0);

        if ( pointed.data instanceof ELEMENT_DATA_LINK){
            const link = pointed.data.element;
            if (typeof link.data.cp == "undefined"){
                const v1 = link.startVertex;
                const v2 = link.endVertex;
                const new_cp = v1.data.pos.middle(v2.data.pos);
                board.emit_update_element( BoardElementType.Link, link.index, "cp", new_cp);
            }
        }
        else if ( pointed.data instanceof ELEMENT_DATA_CONTROL_POINT ){
            if ( pointed.buttonType == 2){
                board.emit_update_element( BoardElementType.Link, pointed.data.element.index, "cp", "");
            }
        }
            
    })
    
    control_point_interactorV2.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if (typeof pointed == "undefined") return false;

        if ( pointed.data instanceof ELEMENT_DATA_CONTROL_POINT ){
            const link = pointed.data.element;
            if ( board.keyPressed.has("Control") ){
                const v1 = link.startVertex;
                const v2 = link.endVertex;

                const middle = v1.data.pos.middle(v2.data.pos);
                const vect = Vect.from_coords(v1.data.pos, v2.data.pos);
                const orthogonal = new Vect(-vect.y, vect.x);
                const e_coord = board.camera.create_server_coord(e);
                const projection = e_coord.orthogonal_projection(middle, orthogonal);
                const down_coord_server = board.camera.create_server_coord(pointed.pointedPos);

                const shift = Vect.from_coords(down_coord_server, projection);
                board.emit_translate_elements([[BoardElementType.ControlPoint, link.index]], shift.sub(previous_shift));
                previous_shift.set_from(shift);
            } else {
                const shift = board.camera.server_vect(CanvasVect.from_canvas_coords(pointed.pointedPos,e));
                board.emit_translate_elements([[BoardElementType.ControlPoint, link.index]], shift.sub(previous_shift));
                previous_shift.set_from(shift);
            }
            return true;
        }
        return false;
    })
    
    
    
    return control_point_interactorV2;    
}
