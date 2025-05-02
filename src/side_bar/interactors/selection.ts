

// INTERACTOR SELECTION

import { Coord, Option, Vect } from "gramoloss";
import { BoardElementType, ClientBoard, SELECTION_COLOR } from "../../board/board";
import { resize_corner, resize_side, translate_by_canvas_vect } from "../../board/resizable";
import { CanvasVect } from "../../board/display/canvasVect";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { DOWN_TYPE, INTERACTOR_TYPE, RESIZE_TYPE } from "../../interactors/interactor";
import { PreInteractor } from "../pre_interactor";
import { ELEMENT_DATA_AREA, ELEMENT_DATA_RECTANGLE, ELEMENT_DATA_REPRESENTATION, ELEMENT_DATA_VERTEX, PointedElementData } from "../../interactors/pointed_element_data";
import { GridType } from "../../board/display/grid";
import { blurProperties, showProperties } from "../../board/attributes";
import { VertexElement } from "../../board/element";
import { Segment } from "../../board/elements/segment";
import { Color } from "../../board/display/colors_v2";
import { Rectangle } from "../../board/elements/rectangle";
import { TargetPoint } from "../../board/elements/targetPoint";


export function createSelectionInteractor(board: ClientBoard): PreInteractor{

    let previousShift: Vect = new Vect(0,0);
    let previousCanvasShift = new CanvasVect(0,0);
    let previousCenterShift = new CanvasVect(0,0);
    let hasMoved = false;

    const selectedElements = Array<[BoardElementType,number]>();

    let isRectangularSelecting = false;
    const rectSelection = new Rectangle(board, new CanvasCoord(0,0), new CanvasCoord(100,100), Color.Green);
    rectSelection.hide();

    const boundingBox = new Rectangle(board, new CanvasCoord(0,0), new CanvasCoord(100,100), Color.Red);
    boundingBox.hide();
    const rotateIcon = new TargetPoint(board, new CanvasCoord(0,0));
    rotateIcon.hide();
    let rotating = false;
    let rotationCenter = new Coord(0,0);
    let rotationCanvasCenter = new CanvasCoord(0,0);
    const resizeIcon = new TargetPoint(board, new CanvasCoord(0,0));
    resizeIcon.hide();
    let resizing = false;
    const rotaCenter = new TargetPoint(board, new CanvasCoord(0,0));
    rotaCenter.hide();




    const selectionV2 = new PreInteractor(INTERACTOR_TYPE.SELECTION, "Drag and select elements", "s", "selection", "default", new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK, DOWN_TYPE.STROKE, DOWN_TYPE.REPRESENTATION_ELEMENT, DOWN_TYPE.REPRESENTATION, DOWN_TYPE.RECTANGLE, DOWN_TYPE.AREA, DOWN_TYPE.RESIZE]))


    // Mouse down
    selectionV2.mousedown = (( board: ClientBoard, pointed: PointedElementData) => {
        console.log("Selection mouse down")
        console.log(pointed.data?.element);

        // Rotate
        if (rotateIcon.isNearby(pointed.pointedPos, 20)){
            rotating = true;
            board.initRotateSelection()
            return;
        }

        // Resize
        if (resizeIcon.isNearby(pointed.pointedPos, 20)){
            resizing = true;
            board.initRotateSelection()
            return;
        }

        // Compute Selected Elements
        if (typeof pointed.data != "undefined"){
            if (pointed.data.element.isSelected){
                const s2 = board.getSelectedElements();
                selectedElements.splice(0, selectedElements.length);
                for (const a of s2){
                    selectedElements.push(a);
                }
            } else {
                selectedElements.length = 0;
                selectedElements.push([pointed.data.element.boardElementType, pointed.data.element.serverId]);
            }
        }
        
        blurProperties();
        hasMoved = false;
        previousShift = new Vect(0,0);
        previousCanvasShift = new CanvasVect(0,0);

        // Mouse down on nothing
        if ( typeof pointed.data === "undefined") {
            if (pointed.buttonType == 2){
                showProperties(board.grid, pointed.pointedPos, board);
            }
            if (pointed.buttonType == 2 && board.grid.type == GridType.GridPolar) {
                board.grid.polarCenter = pointed.pointedPos.toCoord(board.camera);
                board.draw();
            }
            if (board.keyPressed.has("Control")) {
                isRectangularSelecting = true;
                rectSelection.setStartPoint(pointed.pointedPos);
                rectSelection.setEndPoint(pointed.pointedPos);
                rectSelection.show();

            }
        } 
        // Mouse down on Vertex
        else if ( pointed.data.element instanceof VertexElement){
            const v = pointed.data.element;
            if (pointed.buttonType == 2 && board.grid.type == GridType.GridPolar) {
                board.grid.polarCenter.copy_from(v.serverCenter);
                board.draw();
            }
            previousCenterShift = CanvasVect.from_canvas_coords( pointed.pointedPos, v.cameraCenter);
        } 
        /*
        else if ( pointed.data instanceof ELEMENT_DATA_RECTANGLE || pointed.data instanceof ELEMENT_DATA_AREA || pointed.data instanceof ELEMENT_DATA_REPRESENTATION ){
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
                    previousCanvasShift = new CanvasVect(0,0);
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
            */
    })

    // Mouse Move
    selectionV2.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        // console.log("Selection : Mouse move")
        hasMoved = true;

        

        if (typeof pointed == "undefined") return false;

        if (rotating){
            const d1 = Vect.from_coords(rotationCanvasCenter, e);
            const d2 = Vect.from_coords(rotationCanvasCenter, pointed.pointedPos);
            const angle = -Math.atan2(d2.y, d2.x) + Math.atan2(d1.y, d1.x);
            board.localRotateSelection(rotationCenter, angle);

            const [x,y,w,h] = board.getSelectionBoundingBox();
            const c1 = board.camera.create_canvas_coord(new Coord(x,y))
            const c2 = board.camera.create_canvas_coord(new Coord(x+w, y+h));
            boundingBox.setStartPoint(c1);
            boundingBox.setEndPoint(c2)

            return false;
        }

        if (resizing){
            const d1 = Vect.from_coords(rotationCanvasCenter, e);
            const d2 = Vect.from_coords(rotationCanvasCenter, pointed.pointedPos);
            const ratio = d1.norm()/d2.norm();
            board.localResizeSelection(rotationCenter, ratio);

            const [x,y,w,h] = board.getSelectionBoundingBox();
            const c1 = board.camera.create_canvas_coord(new Coord(x,y))
            const c2 = board.camera.create_canvas_coord(new Coord(x+w, y+h));
            boundingBox.setStartPoint(c1);
            boundingBox.setEndPoint(c2)
            return false;
        }

        // Translate
        if (typeof pointed.data != "undefined"){
            e.translate_by_canvas_vect(previousCenterShift);
            // e = board.graph.align_position(e, selected_vertices, board.canvas, board.camera);
            // e = board.graph.align_position(e, new Set([pointed.data.element.serverId]), board.canvas, board.camera);
            e.translate_by_canvas_vect(previousCenterShift.opposite());
            
            console.log(selectedElements)
            const shift = board.camera.server_vect(CanvasVect.from_canvas_coords(pointed.pointedPos, e));
            board.emit_translate_elements(selectedElements, shift.sub(previousShift));
            previousShift.set_from(shift);
            
            previousCanvasShift.set_from(shift);
            return true;
        }

        // Translate Camera or Rectangular selection
        if ( typeof pointed.data == "undefined"){
            if (isRectangularSelecting) {
                rectSelection.setEndPoint(e);
            } else {
                const shift = CanvasVect.from_canvas_coords(pointed.pointedPos, e);
                board.translateCamera(shift.sub(previousCanvasShift));
                previousCanvasShift.set_from(shift);

                const [x,y,w,h] = board.getSelectionBoundingBox();
                const c1 = board.camera.create_canvas_coord(new Coord(x,y))
                const c2 = board.camera.create_canvas_coord(new Coord(x+w, y+h));
                boundingBox.setStartPoint(c1);
                boundingBox.setEndPoint(c2)
                rotationCanvasCenter.x = (c1.x + c2.x)/2
                rotationCanvasCenter.y = (c1.y + c2.y)/2
                rotateIcon.setCanvasPos(c2)
                resizeIcon.setCanvasPos(c1)
                rotaCenter.setCanvasPos(rotationCanvasCenter);
                
            }
            return true;
        }
        
        
        // else if (pointed.data instanceof ELEMENT_DATA_REPRESENTATION || pointed.data instanceof ELEMENT_DATA_AREA || pointed.data instanceof ELEMENT_DATA_RECTANGLE){
        //     if ( typeof pointed.data.resizeType == "undefined" ){
        //         const shift = CanvasVect.from_canvas_coords(pointed.pointedPos ,e);
        //         const element = pointed.data.element;

        //         // TODO: voir fichier todo sur le translate
        //         if ( pointed.data instanceof ELEMENT_DATA_AREA){
        //             board.translate_area(shift.sub(previousCanvasShift), pointed.data.element, vertices_contained);
        //         } else {
        //             element.translate_by_canvas_vect(shift.sub(previousCanvasShift), board.camera );
        //             translate_by_canvas_vect(element, shift.sub(previousCanvasShift), board.camera);
        //         }
                
        //         previousCanvasShift.set_from(shift);
        //         return true;
        //     } 
        //     else { // Resize the element
        //         if (pointed.data.resizeType == RESIZE_TYPE.LEFT || pointed.data.resizeType == RESIZE_TYPE.RIGHT || pointed.data.resizeType == RESIZE_TYPE.TOP || pointed.data.resizeType == RESIZE_TYPE.BOTTOM){
        //             resize_side(pointed.data.element, e, opposite_coord, pointed.data.resizeType, board.camera)
        //         } else {
        //             resize_corner(pointed.data.element, e, opposite_corner, board.camera);
        //         }
        //         return true;
        //     }
        // }


        return false;
    })

    // Mouse up
    selectionV2.mouseup = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        console.log("Selection: mouse up")

        if (rotating){
            rotating = false;

            if (typeof pointed == "undefined") return false;
            const d1 = Vect.from_coords(rotationCanvasCenter, e);
            const d2 = Vect.from_coords(rotationCanvasCenter, pointed.pointedPos);
            const angle = -Math.atan2(d2.y, d2.x) + Math.atan2(d1.y, d1.x);
            board.endLocalRotateSelection(rotationCenter, angle);
            return false;
        }

        if (resizing){
            resizing = false;
            if (typeof pointed == "undefined") return false;
            const d1 = Vect.from_coords(rotationCanvasCenter, e);
            const d2 = Vect.from_coords(rotationCanvasCenter, pointed.pointedPos);
            const ratio = d1.norm()/d2.norm();
            board.endLocalResizeSelection(rotationCenter, ratio);
            return false;
        }

        if (typeof pointed == "undefined") return false;

        if ( typeof pointed.data == "undefined"){
            boundingBox.hide();
            rotateIcon.hide();
            resizeIcon.hide();
            rotaCenter.hide();

            if (isRectangularSelecting) {
                isRectangularSelecting = false;
                board.selectElementsInRect(new CanvasCoord(rectSelection.x1, rectSelection.y1), new CanvasCoord(rectSelection.x2, rectSelection.y2));
                rectSelection.hide();

                
                const [x,y,w,h] = board.getSelectionBoundingBox();
                const c1 = board.camera.create_canvas_coord(new Coord(x,y))
                const c2 = board.camera.create_canvas_coord(new Coord(x+w, y+h));
                boundingBox.setStartPoint(c1);
                boundingBox.setEndPoint(c2)
                boundingBox.show();

                rotateIcon.setCanvasPos(c2)
                rotateIcon.show();
                resizeIcon.setCanvasPos(c1)
                resizeIcon.show()

                rotationCenter.x = x + w/2;
                rotationCenter.y = y + h/2;
                rotationCanvasCenter.x = (c1.x + c2.x)/2
                rotationCanvasCenter.y = (c1.y + c2.y)/2
                rotaCenter.setCanvasPos(rotationCanvasCenter);
                rotaCenter.show();

            } else {
                board.clearAllSelections();
            }
        }
        else if (hasMoved == false){
            if (board.keyPressed.has("Shift")){
                if (board.keyPressed.has("Control") == false) { 
                    board.clearAllSelections();
                }
                if (pointed.data instanceof ELEMENT_DATA_VERTEX){
                    board.selectConnectedComponent(pointed.data.element.serverId);
                }
            } else {
                if ( pointed.data.element.isSelected) {
                    if (board.keyPressed.has("Control")) { 
                        pointed.data.element.isSelected = false;
                    }
                }
                else {
                    if (board.keyPressed.has("Control")) {
                        pointed.data.element.select();
                    }
                    else {
                        board.clearAllSelections();
                        pointed.data.element.select();
                    }
                }
            }


        } else if ( pointed.data instanceof ELEMENT_DATA_VERTEX){
            
            const vertexMoved = pointed.data.element;
            for( const v of board.elements.values()){
                if( v instanceof VertexElement && v.serverId != pointed.data.element.serverId && vertexMoved.isNearby(v.cameraCenter, 10)){
                    board.emitVerticesMerge(v.serverId, pointed.data.element.serverId);
                    break;
                }
            }
            
        }

        // else if ( pointed.data instanceof ELEMENT_DATA_AREA || pointed.data instanceof ELEMENT_DATA_RECTANGLE || pointed.data instanceof ELEMENT_DATA_REPRESENTATION ){
             //     if (typeof pointed.data.resizeType != "undefined"){
        //         const esc  = board.camera.create_server_coord(e);
        //         board.emit_resize_element(pointed.data.element.getType(), pointed.data.index, esc, pointed.data.resizeType);
        //     }
     
        
        hasMoved = false;
    })


    

    selectionV2.onleave = () => {
        rotaCenter.hide();
        rotateIcon.hide();
        resizeIcon.hide();
        boundingBox.hide();
    }

    return selectionV2;
}