import { Area, Coord, Option } from 'gramoloss';
import { BoardElementType, ClientBoard } from '../../board/board';
import { CanvasVect } from '../../board/vect';
import { CanvasCoord } from '../../board/canvas_coord';
import { DOWN_TYPE, RESIZE_TYPE } from '../../interactors/interactor';
import { ORIENTATION_INFO } from '../element_side_bar';
import { InteractorV2 } from '../interactor_side_bar';
import { ELEMENT_DATA_AREA, PointedElementData } from '../../interactors/pointed_element_data';


export function createAreaInteractor(board: ClientBoard): InteractorV2{

    const area_interactorV2 = new InteractorV2(board, "area", "Create areas", "g", ORIENTATION_INFO.RIGHT, "area", "default", new Set([DOWN_TYPE.AREA]));

    let is_creating_area : boolean;
    let last_created_area_index: Option<number> = undefined;
    let is_moving_area : boolean;
    
    let vertices_contained = new Set<number>();
    let previous_canvas_shift = new CanvasVect(0,0);
    let opposite_corner: CanvasCoord;
    
    
    area_interactorV2.mousedown = (( board: ClientBoard, pointed: PointedElementData) => {
        if ( typeof pointed.data == "undefined"){
            is_creating_area = true;
            const first_corner = board.view.create_server_coord(pointed.pointedPos);
            board.emit_add_element(new Area("G", first_corner, first_corner, ""), (response: number) => { last_created_area_index = response });
            opposite_corner = pointed.pointedPos.copy();
        } 
        else if ( pointed.data instanceof ELEMENT_DATA_AREA ){
            const area = pointed.data.element;
            previous_canvas_shift = new CanvasVect(0,0);
            vertices_contained = new Set();
            for (const [vertex_index, vertex] of board.graph.vertices.entries()){
                if ( area.is_containing(vertex)){
                    vertices_contained.add(vertex_index);
                }
            }
            is_moving_area = true;
        }
    })
    
    area_interactorV2.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if (typeof pointed == "undefined") return false;

        if ( typeof pointed.data == "undefined"){
            if( typeof last_created_area_index != "undefined" ){
                const last_created_area = board.areas.get(last_created_area_index);
                if ( typeof last_created_area != "undefined"){
                    last_created_area.resize_corner_area(e, opposite_corner, board.view);
                    return true;
                }
            }
        }
        else if ( pointed.data instanceof ELEMENT_DATA_AREA ){
            const moving_area = pointed.data.element;
            const shift = CanvasVect.from_canvas_coords(pointed.pointedPos, e);
            board.translate_area(shift.sub(previous_canvas_shift), moving_area, vertices_contained);
            previous_canvas_shift.set_from(shift);
            return true;
        }
        // else{
        //     let cursor_changed = false;
        
        //     for (const a of board.areas.values()) {
        //         const corner_number = a.is_nearby_corner(e);
        //         const side_number = a.is_nearby_side(e, undefined, true);
        //         const is_on_label = a.is_on_label(e);
    
        //         if(corner_number === AREA_CORNER.NONE && side_number === AREA_SIDE.NONE && !is_on_label){
        //             continue;
        //         }
        //         else{
        //             cursor_changed = true;
        //         }
    
        //         if(is_on_label){
        //             board.canvas.style.cursor="grab";
        //             break;
        //         }
        //     }
        //     if(!cursor_changed){
        //         board.canvas.style.cursor = "default";
        //     }
            
        //     return false;
        // }
       
       return false;
    })
    
    area_interactorV2.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if (typeof pointed == "undefined") return false;

        const esc  = board.view.create_server_coord(e);
        if (typeof pointed.data == "undefined" && typeof last_created_area_index != "undefined") {
            board.emit_resize_element(BoardElementType.Area, last_created_area_index, esc, RESIZE_TYPE.TOP_RIGHT);
            is_creating_area = false;
        }
        else if ( pointed.data instanceof ELEMENT_DATA_AREA ){
            const canvas_shift = CanvasVect.from_canvas_coords(pointed.pointedPos, e);
            const shift = board.view.server_vect(canvas_shift);
            board.translate_area(canvas_shift.opposite(), pointed.data.element, vertices_contained);
            board.emit_translate_elements([[BoardElementType.Area, pointed.data.index]], shift);
            is_moving_area = false;
        }
    })
    
    
    return area_interactorV2;
}
