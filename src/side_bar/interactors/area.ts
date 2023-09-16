import { Area, Coord } from 'gramoloss';
import { AREA_CORNER, AREA_SIDE } from '../../board/area';
import { BoardElementType, ClientBoard } from '../../board/board';
import { CanvasVect } from '../../board/vect';
import { CanvasCoord } from '../../board/canvas_coord';
import { DOWN_TYPE, RESIZE_TYPE } from '../../interactors/interactor';
import { last_down, last_down_index, down_coord } from '../../interactors/interactor_manager';
import { ORIENTATION_INFO } from '../element_side_bar';
import { InteractorV2 } from '../interactor_side_bar';


export function createAreaInteractor(board: ClientBoard): InteractorV2{

    const area_interactorV2 = new InteractorV2(board, "area", "Create areas", "g", ORIENTATION_INFO.RIGHT, "area", "default", new Set([DOWN_TYPE.AREA]));

    let is_creating_area : boolean;
    let last_created_area_index: number = null;
    let is_moving_area : boolean;
    let first_corner : Coord;
    
    let side_number: AREA_SIDE;
    let corner_number: AREA_CORNER;
    let vertices_contained = new Set<number>();
    let previous_canvas_shift = new CanvasVect(0,0);
    let opposite_corner: CanvasCoord;
    let opposite_coord = 0;
    
    
    area_interactorV2.mousedown = (( board: ClientBoard, e: CanvasCoord) => {
        if (last_down === DOWN_TYPE.EMPTY) {
            is_creating_area = true;
            first_corner = board.view.create_server_coord(e);
            board.emit_add_element(new Area("G", first_corner, first_corner, ""), (response: number) => { last_created_area_index = response });
            opposite_corner = e.copy();
        } else if ( last_down == DOWN_TYPE.AREA){
            const area = board.areas.get(last_down_index);
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
    
    area_interactorV2.mousemove = ((board: ClientBoard, e: CanvasCoord) => {
    
        if(is_creating_area){
            if( last_created_area_index != null && board.areas.has(last_created_area_index)){
                const last_created_area = board.areas.get(last_created_area_index);
                last_created_area.resize_corner_area(e, opposite_corner, board.view);
                return true;
            }
        }
        else if(is_moving_area){
            const moving_area = board.areas.get(last_down_index);
            if(side_number != null){
                moving_area.resize_side_area(e, opposite_coord, side_number, board.view)
            }
            else if(corner_number != null)
            {
                moving_area.resize_corner_area(e, opposite_corner, board.view);
            } else if ( last_down == DOWN_TYPE.AREA){
                const shift = CanvasVect.from_canvas_coords(down_coord,e);
                board.translate_area(shift.sub(previous_canvas_shift), last_down_index, vertices_contained);
                previous_canvas_shift.set_from(shift);
            }
            return true;
        }
        else{
            let cursor_changed = false;
        
            for (const a of board.areas.values()) {
                const corner_number = a.is_nearby_corner(e);
                const side_number = a.is_nearby_side(e, undefined, true);
                const is_on_label = a.is_on_label(e);
    
                if(corner_number === AREA_CORNER.NONE && side_number === AREA_SIDE.NONE && !is_on_label){
                    continue;
                }
                else{
                    cursor_changed = true;
                }
    
                if(is_on_label){
                    board.canvas.style.cursor="grab";
                    break;
                }
            }
            if(!cursor_changed){
                board.canvas.style.cursor = "default";
            }
            
            return false;
        }
       
       
    })
    
    area_interactorV2.mouseup = ((board: ClientBoard, e: CanvasCoord) => {
        const esc  = board.view.create_server_coord(e);
        if (last_down === DOWN_TYPE.EMPTY) {
            board.emit_resize_element(BoardElementType.Area, last_created_area_index, esc, RESIZE_TYPE.TOP_RIGHT);
            is_creating_area = false;
            first_corner = null;
        }
        else if ( last_down == DOWN_TYPE.AREA){
            const canvas_shift = CanvasVect.from_canvas_coords(down_coord, e);
            const shift = board.view.server_vect(canvas_shift);
            board.translate_area(canvas_shift.opposite(), last_down_index, vertices_contained);
            board.emit_translate_elements([[BoardElementType.Area, last_down_index]], shift);
            is_moving_area = false;
        }
    })
    
    
    return area_interactorV2;
}
