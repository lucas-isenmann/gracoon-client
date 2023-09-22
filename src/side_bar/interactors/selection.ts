

// INTERACTOR SELECTION

import { Option, Vect } from "gramoloss";
import { BoardElementType, ClientBoard, SELECTION_COLOR } from "../../board/board";
import { resize_corner, resize_side, translate_by_canvas_vect } from "../../board/resizable";
import { CanvasVect } from "../../board/display/canvasVect";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { DOWN_TYPE, INTERACTOR_TYPE, RESIZE_TYPE } from "../../interactors/interactor";
import { socket } from "../../socket";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";
import { ELEMENT_DATA_AREA, ELEMENT_DATA_LINK, ELEMENT_DATA_RECTANGLE, ELEMENT_DATA_REPRESENTATION, ELEMENT_DATA_REPRESENTATION_SUBELEMENT, ELEMENT_DATA_STROKE, ELEMENT_DATA_VERTEX, PointedElementData } from "../../interactors/pointed_element_data";
import { ClientVertex } from "../../board/vertex";
import { ClientArea } from "../../board/area";


export function createSelectionInteractor(board: ClientBoard): InteractorV2{

    let previous_shift: Vect = new Vect(0,0);
    let previous_canvas_shift = new CanvasVect(0,0);
    let vertex_center_shift = new CanvasVect(0,0);
    let opposite_coord = 0;
    let opposite_corner: CanvasCoord;
    let vertices_contained = new Set<number>();
    let hasMoved = false;

    let isRectangularSelecting = false; // could be refactored as follows: an Option{c1: CanvasCoord, c2: CanvasCoord}
    let rectSelectC1: Option<CanvasCoord> = undefined;
    let rectSelectC2: Option<CanvasCoord> = undefined;


    const selectionV2 = new InteractorV2(board, INTERACTOR_TYPE.SELECTION, "Drag and select elements", "s", ORIENTATION_INFO.RIGHT, "selection", "default", new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK, DOWN_TYPE.STROKE, DOWN_TYPE.REPRESENTATION_ELEMENT, DOWN_TYPE.REPRESENTATION, DOWN_TYPE.RECTANGLE, DOWN_TYPE.AREA, DOWN_TYPE.RESIZE]))



    selectionV2.mousedown = (( board: ClientBoard, pointed: PointedElementData) => {

        hasMoved = false;
        previous_shift = new Vect(0,0);
        previous_canvas_shift = new CanvasVect(0,0);
        if ( typeof pointed.data === "undefined") {
            if (board.keyPressed.has("Control")) {
                isRectangularSelecting = true;
                rectSelectC1 = pointed.pointedPos.copy(); 
                rectSelectC2 = pointed.pointedPos.copy();
            }
        }else if ( pointed.data.element instanceof ClientVertex){
            const v = pointed.data.element;
            vertex_center_shift = CanvasVect.from_canvas_coords( pointed.pointedPos, v.data.canvas_pos);
        } else if ( pointed.data instanceof ELEMENT_DATA_RECTANGLE || pointed.data instanceof ELEMENT_DATA_AREA || pointed.data instanceof ELEMENT_DATA_REPRESENTATION ){
            const element = pointed.data.element;
            switch(pointed.data.resizeType){
                case RESIZE_TYPE.BOTTOM:{
                    opposite_coord = element.canvas_corner_top_left.y;
                    break;
                }
                case RESIZE_TYPE.TOP:{
                    opposite_coord = element.canvas_corner_bottom_left.y;
                    break;
                }
                case RESIZE_TYPE.LEFT:{
                    opposite_coord = element.canvas_corner_bottom_right.x;
                    break;
                }
                case RESIZE_TYPE.RIGHT:{
                    opposite_coord = element.canvas_corner_bottom_left.x;
                    break;
                }
                case RESIZE_TYPE.TOP_RIGHT: {
                    opposite_corner = element.canvas_corner_bottom_left.copy();
                    break;
                }
                case RESIZE_TYPE.BOTTOM_LEFT: {
                    opposite_corner = element.canvas_corner_top_right.copy();
                    break;
                }
                case RESIZE_TYPE.BOTTOM_RIGHT: {
                    opposite_corner = element.canvas_corner_top_left.copy();
                    break;
                }
                case RESIZE_TYPE.TOP_LEFT: {
                    opposite_corner = element.canvas_corner_bottom_right.copy();
                    break;
                }
                case undefined: {
                    previous_canvas_shift = new CanvasVect(0,0);
                    if (pointed.data instanceof ELEMENT_DATA_AREA){
                        vertices_contained = new Set();
                        for (const [vertex_index, vertex] of board.graph.vertices.entries()){
                            if ( pointed.data.element.is_containing(vertex)){
                                vertices_contained.add(vertex_index);
                            }
                        }
                    }
                }
            }
        }
    })

    selectionV2.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        hasMoved = true;
        if (typeof pointed == "undefined") return false;

        if (pointed.data instanceof ELEMENT_DATA_VERTEX){
            const v = pointed.data.element;
            const indices = new Array<[BoardElementType,number]>();
            
            if ( v.data.is_selected ) {
                const selected_vertices = board.graph.get_selected_vertices();
                for( const index of selected_vertices){
                    indices.push([BoardElementType.Vertex, index]);
                }
                for (const [stroke_index, stroke] of board.strokes.entries()){
                    if (stroke.is_selected){
                        indices.push([BoardElementType.Stroke, stroke_index]);
                    }
                }
                e.translate_by_canvas_vect(vertex_center_shift);
                e = board.graph.align_position(e, selected_vertices, board.canvas, board.view);
                e.translate_by_canvas_vect(vertex_center_shift.opposite());
            }
            else {
                e.translate_by_canvas_vect(vertex_center_shift);
                e = board.graph.align_position(e, new Set([pointed.data.element.index]), board.canvas, board.view);
                e.translate_by_canvas_vect(vertex_center_shift.opposite());
                indices.push([BoardElementType.Vertex, pointed.data.element.index]);
            }
            
            const shift = board.view.server_vect(CanvasVect.from_canvas_coords(pointed.pointedPos, e));
            board.emit_translate_elements(indices, shift.sub(previous_shift));
            previous_shift.set_from(shift);
            return true;
        }
        else if ( typeof pointed.data == "undefined"){
            if (isRectangularSelecting) {
                rectSelectC2 = e; // peut etre faut copier
            } else {
                const shift = CanvasVect.from_canvas_coords(pointed.pointedPos, e);
                board.view.translate_camera(shift.sub(previous_canvas_shift));
                previous_canvas_shift.set_from(shift);
                board.update_after_camera_change();
                
                if(typeof board.selfUser.following != "undefined"){
                    board.selfUser.unfollow(board.selfUser.following);
                }
                socket.emit("my_view", board.view.camera.x, board.view.camera.y, board.view.zoom);
            }
            return true;
        }
        else if (pointed.data instanceof ELEMENT_DATA_STROKE){
            const stroke = pointed.data.element;
            const shift = CanvasVect.from_canvas_coords(pointed.pointedPos, e);
            const mini_shift = shift.sub(previous_canvas_shift);

            if (stroke.is_selected){
                for (const vertex of board.graph.vertices.values()){
                    if (vertex.data.is_selected){
                        vertex.translate_by_canvas_vect(mini_shift, board.view);
                    }
                }
                for (const other_stroke of board.strokes.values()){
                    if (other_stroke.is_selected){
                        other_stroke.translate_by_canvas_vect(mini_shift, board.view);
                    }
                }
            } else {
                stroke.translate_by_canvas_vect(mini_shift, board.view);
            }
            
            previous_canvas_shift.set_from(shift);
            return true;
        }
        else if ( pointed.data instanceof ELEMENT_DATA_REPRESENTATION_SUBELEMENT){
            const rep = pointed.data.element;
            const shift = CanvasVect.from_canvas_coords(pointed.pointedPos, e);
            rep.translate_element_by_canvas_vect(pointed.data.subElementIndex, shift.sub(previous_canvas_shift), board.view);
            previous_canvas_shift.set_from(shift);
            return true;
        }
        else if (pointed.data instanceof ELEMENT_DATA_REPRESENTATION || pointed.data instanceof ELEMENT_DATA_AREA || pointed.data instanceof ELEMENT_DATA_RECTANGLE){
            if ( typeof pointed.data.resizeType == "undefined" ){
                const shift = CanvasVect.from_canvas_coords(pointed.pointedPos ,e);
                const element = pointed.data.element;

                // TODO: voir fichier todo sur le translate
                if ( pointed.data instanceof ELEMENT_DATA_AREA){
                    board.translate_area(shift.sub(previous_canvas_shift), pointed.data.element, vertices_contained);
                } else {
                    element.translate_by_canvas_vect(shift.sub(previous_canvas_shift), board.view );
                    translate_by_canvas_vect(element, shift.sub(previous_canvas_shift), board.view);
                }
                
                previous_canvas_shift.set_from(shift);
                return true;
            } 
            else { // Resize the element
                if (pointed.data.resizeType == RESIZE_TYPE.LEFT || pointed.data.resizeType == RESIZE_TYPE.RIGHT || pointed.data.resizeType == RESIZE_TYPE.TOP || pointed.data.resizeType == RESIZE_TYPE.BOTTOM){
                    resize_side(pointed.data.element, e, opposite_coord, pointed.data.resizeType, board.view)
                } else {
                    resize_corner(pointed.data.element, e, opposite_corner, board.view);
                }
                return true;
            }
        }


        return false;
    })

    selectionV2.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if (typeof pointed == "undefined") return false;

        if ( typeof pointed.data == "undefined"){
            if (isRectangularSelecting && typeof rectSelectC1 != "undefined" && typeof rectSelectC2 != "undefined") {
                isRectangularSelecting = false;
                board.select_elements_in_rect(rectSelectC1, rectSelectC2);
            } else {
                board.clear_all_selections();
            }
        }
        else if ( pointed.data instanceof ELEMENT_DATA_VERTEX){
            if (hasMoved === false) {
                if ( pointed.data.element.data.is_selected) {
                    if (board.keyPressed.has("Control")) { 
                        pointed.data.element.data.is_selected = false;
                    }
                }
                else {
                    if (board.keyPressed.has("Control")) {
                        pointed.data.element.data.is_selected = true;
                    }
                    else {
                        board.clear_all_selections();
                        pointed.data.element.data.is_selected = true;
                    }
                }
            }
            else {
                const vertex_moved = pointed.data.element;
                for( const [index,v] of board.graph.vertices.entries()){
                    if( index != pointed.data.element.index && vertex_moved.is_nearby(v.data.canvas_pos, 100)){
                        board.emit_vertices_merge(index, pointed.data.element.index);
                        break;
                    }
                }
            }
        }

        else if ( pointed.data instanceof ELEMENT_DATA_LINK) {
            if (hasMoved === false) {
                if ( pointed.data.element.data.is_selected) {
                    if (board.keyPressed.has("Control")) { 
                        pointed.data.element.data.is_selected = false;
                    }
                }
                else {
                    if (board.keyPressed.has("Control")) { 
                        pointed.data.element.data.is_selected = true;
                    }
                    else {
                        board.clear_all_selections();
                        pointed.data.element.data.is_selected = true;
                    }
                }
            }

        }
        else if ( pointed.data instanceof ELEMENT_DATA_STROKE ) {
            if (hasMoved === false) {
                if (pointed.data.element.is_selected) {
                    if (board.keyPressed.has("Control")) { 
                        pointed.data.element.is_selected = false;
                    }
                }
                else {
                    if (board.keyPressed.has("Control")) { 
                        pointed.data.element.is_selected = true;
                    }
                    else {
                        board.clear_all_selections();
                        pointed.data.element.is_selected = true;
                    }
                }
            } else {
                let indices = new Array<[BoardElementType,number]>();
                let elements_to_translate = new Array();
                
                if (pointed.data.element.is_selected) {
                    for (const [vertex_index, vertex] of board.graph.vertices.entries()){
                        if (vertex.data.is_selected){
                            indices.push([BoardElementType.Vertex, vertex_index]);
                            elements_to_translate.push(vertex);
                        }
                    }
                    for (const [stroke_index, stroke] of board.strokes.entries()){
                        if (stroke.is_selected){
                            indices.push([BoardElementType.Stroke, stroke_index]);
                            elements_to_translate.push(stroke);
                        }
                    }
                }
                else {
                    indices.push([BoardElementType.Stroke, pointed.data.index]);
                    const stroke = pointed.data.element;
                    elements_to_translate.push(stroke);
                }
                
                const canvas_shift = CanvasVect.from_canvas_coords(pointed.pointedPos, e);
                const shift = board.view.server_vect(canvas_shift);
                for (const element of elements_to_translate){
                    element.translate_by_canvas_vect(canvas_shift.opposite(), board.view);
                }
                board.emit_translate_elements( indices, shift);
            }
        }
        else if (pointed.data instanceof ELEMENT_DATA_REPRESENTATION_SUBELEMENT){
            pointed.data.element.onmouseup(board.view);
        } 
        else if ( pointed.data instanceof ELEMENT_DATA_AREA || pointed.data instanceof ELEMENT_DATA_RECTANGLE || pointed.data instanceof ELEMENT_DATA_REPRESENTATION ){
            if (typeof pointed.data.resizeType != "undefined"){
                const esc  = board.view.create_server_coord(e);

                board.emit_resize_element(pointed.data.element.getType(), pointed.data.index, esc, pointed.data.resizeType);
            }
            else if ( pointed.data.element instanceof ClientArea ){
                const canvas_shift = CanvasVect.from_canvas_coords(pointed.pointedPos, e);
                const shift = board.view.server_vect(canvas_shift);
                board.translate_area(canvas_shift.opposite(), pointed.data.element, vertices_contained);
                board.emit_translate_elements([[BoardElementType.Area, pointed.data.index]], shift);
            }
            
        } 
        
        hasMoved = false;
    })


    selectionV2.draw = (board) => {
        if ( isRectangularSelecting && typeof rectSelectC1 != "undefined" && typeof rectSelectC2 != "undefined") {
            board.ctx.beginPath();
            board.ctx.setLineDash([2, 5]); 
            board.ctx.strokeStyle = SELECTION_COLOR;
            board.ctx.rect(rectSelectC1.x, rectSelectC1.y, rectSelectC2.x - rectSelectC1.x, rectSelectC2.y - rectSelectC1.y);
            board.ctx.stroke();
            board.ctx.setLineDash([])

            board.ctx.globalAlpha = 0.07;
            board.ctx.fillStyle = SELECTION_COLOR;
            board.ctx.fill();

            board.ctx.globalAlpha = 1;
        }
    }

    return selectionV2;
}