import { DOWN_TYPE, RESIZE_TYPE } from './interactor'
import { socket } from '../socket';
import { regenerate_graph } from '../generators/dom';
import { CanvasCoord } from '../board/display/canvas_coord';
import { CanvasVect } from '../board/display/canvasVect';
import { ClientDegreeWidthRep } from '../board/representations/degree_width_rep';
import { BoardElementType, ClientBoard } from '../board/board';
import { PreInteractor } from '../side_bar/pre_interactor';
import { ELEMENT_DATA_AREA, ELEMENT_DATA_RECTANGLE, ELEMENT_DATA_REPRESENTATION, PointedElementData } from './pointed_element_data';
import { Option } from 'gramoloss';

// INTERACTOR MANAGER







export function setupInteractions(board: ClientBoard) {

    let mousePos: Option<CanvasCoord> = undefined;
    let previous_canvas_shift = new CanvasVect(0,0);
    let lastPointedElement: Option<PointedElementData> = undefined;

    window.addEventListener('keydown', function (e) {
        if (e.key == "Control") {
            board.keyPressed.add("Control");
        }
        if (e.key == "Shift") {
            board.keyPressed.add("Shift");
        }

        if (document.activeElement != null && document.activeElement.nodeName == "BODY") { // otherwise focus is on a text
            if (e.key == "d"){
                console.log("add dw representation");
                const dw_rep = ClientDegreeWidthRep.from_embedding(board, board.camera);
                board.representations.set(0, dw_rep);
                requestAnimationFrame(function () { board.draw() });
            }
            
            
            if (e.key == "Delete") {
                const data_socket = new Array();
                for (const v of board.graph.vertices.values()) {
                    if (v.data.is_selected) {
                        data_socket.push([BoardElementType.Vertex, v.index]);
                    }
                }
                board.graph.links.forEach((link, index) => {
                    if (link.data.is_selected) {
                        data_socket.push([ BoardElementType.Link, index]);
                    }
                })
                board.strokes.forEach((s, index) => {
                    if (s.is_selected) {
                        data_socket.push([BoardElementType.Stroke, index]);
                    }
                })

                board.emit_delete_elements(data_socket);
                return;
            }
            if ( board.keyPressed.has("Control") && e.key.toLowerCase() == "c" ){
                const subgraph = board.graph.get_induced_subgraph_from_selection(board.camera);
                if ( subgraph.vertices.size > 0 && typeof mousePos != "undefined"){
                    board.setGraphClipboard(subgraph, mousePos.copy(), false);
                }
                return;
            }
            if (board.keyPressed.has("Control") && e.key.toLowerCase() == "z") {
                console.log("Emit: undo");
                board.emit_undo();
            }
            if (board.keyPressed.has("Control") && e.key.toLowerCase() == "y") {
                console.log("Emit: redo");
                board.emit_redo();
            }
            if (board.keyPressed.has("Control") && e.key.toLowerCase() == "a") {
                board.selectEverything();
            }
        }
    });

    window.addEventListener('keyup', function (e) {
        if (e.key == "Control") {
            board.keyPressed.delete("Control");
        }
        if (e.key == "Shift") {
            board.keyPressed.delete("Shift");
        }
    })

    board.canvas.addEventListener("wheel", function (e) {
        if (e.deltaY > 0) {
            board.camera.apply_zoom_to_center(new CanvasCoord(e.pageX, e.pageY), 1 / 1.1);
        } else {
            board.camera.apply_zoom_to_center(new CanvasCoord(e.pageX, e.pageY), 1.1);
        }
        board.update_after_camera_change();


        if ( typeof board.selfUser.following != "undefined") {
            board.selfUser.unfollow(board.selfUser.following);
        }
        socket.emit("my_view", board.camera.camera.x, board.camera.camera.y, board.camera.zoom);

        board.requestDraw();
    });

    // ----------------------------------------------------------------
    // Mouse actions

    board.canvas.addEventListener('mouseup', function (e) {
        // console.log("mouseup")
        mousePos = new CanvasCoord(e.pageX, e.pageY);
        board.selfUser.canvasPos = new CanvasCoord(e.pageX, e.pageY);
        mousePos = board.graph.align_position(mousePos, new Set(), board.canvas, board.camera);
        if (typeof board.interactorLoaded != "undefined"){
            board.interactorLoaded.mouseup(board, lastPointedElement, mousePos);
        }
        board.alignement_horizontal_y = undefined;
        board.alignement_vertical_x = undefined;
        board.requestDraw()
        lastPointedElement = undefined;
    })

    board.canvas.addEventListener("mouseout", function(e){
        lastPointedElement = undefined;
        mousePos = undefined;
        board.alignement_horizontal_y = undefined;
        board.alignement_vertical_x = undefined;
        board.selfUser.canvasPos = undefined;
        requestAnimationFrame(function () {board.draw() });
    })

    board.canvas.addEventListener('mousemove', function (e) {
        mousePos = new CanvasCoord(e.pageX, e.pageY);
        if ( typeof board.selfUser.canvasPos != "undefined"){
            board.selfUser.canvasPos.copy_from(mousePos);
        } else {
            board.selfUser.canvasPos = new CanvasCoord(e.pageX, e.pageY);
        }
        
        if ( board.updateElementOver(mousePos)){
            requestAnimationFrame(() => board.draw() );
        }

        if ( typeof board.graphClipboard != "undefined") {
            board.translateGraphClipboard(previous_canvas_shift, mousePos);
        } else if (typeof board.interactorLoaded != "undefined") {
            
            if (board.interactorLoaded.interactable_element_type.has(DOWN_TYPE.RESIZE)){
                const element = board.get_element_nearby(mousePos, board.interactorLoaded.interactable_element_type);
                if (element instanceof ELEMENT_DATA_AREA || element instanceof ELEMENT_DATA_RECTANGLE || element instanceof ELEMENT_DATA_REPRESENTATION){
                    if (typeof element.resizeType != "undefined"){
                        board.canvas.style.cursor = RESIZE_TYPE.to_cursor(element.resizeType);
                    } else {
                        board.canvas.style.cursor = "grab";
                    }
                } else {
                    board.canvas.style.cursor = "default";
                }
            } else {
                board.canvas.style.cursor = "default";
            }
            if (board.interactorLoaded.mousemove(board, lastPointedElement, mousePos)) {
                board.requestDraw();
            }
        }

        const mouse_server_coord = board.camera.create_server_coord(mousePos);
        socket.emit("moving_cursor", mouse_server_coord.x, mouse_server_coord.y);
    })

    board.canvas.addEventListener('mousedown', function (e) {
        // console.log("mousedwon")
        mousePos = new CanvasCoord(e.pageX, e.pageY);
        board.selfUser.canvasPos = new CanvasCoord(e.pageX, e.pageY);
        previous_canvas_shift = new CanvasVect(0,0);

        if (typeof board.graphClipboard != "undefined") {
            board.pasteGeneratedGraph();
            if( board.keyPressed.has("Control") ){
                if (board.isGraphClipboardGenerated){
                    regenerate_graph(e, board);
                }                    
            } else {
                board.clearGraphClipboard();
            }
            board.draw()
        } else {
            if (typeof board.interactorLoaded != "undefined"){
                const pointedPos = board.graph.align_position(mousePos, new Set(), board.canvas, board.camera);
                const data = board.get_element_nearby(pointedPos, board.interactorLoaded.interactable_element_type);
                lastPointedElement = new PointedElementData(pointedPos, e.buttons, data );
                board.interactorLoaded.mousedown(board, lastPointedElement);
                board.requestDraw();
            }
            
        }
    })


    // -----------------------------------------------------------
    // Touch Events

    board.canvas.addEventListener('touchstart', (et: TouchEvent) => {
        // console.log("touchstart");
        mousePos = new CanvasCoord(et.touches[0].clientX, et.touches[0].clientY);

        if (typeof board.interactorLoaded == "undefined") return;
        const data = board.get_element_nearby(mousePos, board.interactorLoaded.interactable_element_type);
        const pointedPos = board.graph.align_position(mousePos, new Set(), board.canvas, board.camera);
        lastPointedElement = new PointedElementData(pointedPos, 0, data );
        board.interactorLoaded.mousedown(board, lastPointedElement);
        board.requestDraw();
    });

    board.canvas.addEventListener('touchmove', (e) => {
        // console.log("touchmove")
        mousePos = new CanvasCoord(e.touches[0].clientX, e.touches[0].clientY);
        if ( typeof board.selfUser.canvasPos != "undefined"){
            board.selfUser.canvasPos.copy_from(mousePos);
        } else {
            board.selfUser.canvasPos = mousePos.copy();
        }

        if ( typeof lastPointedElement != "undefined" && typeof board.interactorLoaded != "undefined"){
            if (board.interactorLoaded.mousemove(board, lastPointedElement, mousePos)) {
                board.requestDraw();
            }
        }
        
        const mouse_server_coord = board.camera.create_server_coord(mousePos);
        socket.emit("moving_cursor", mouse_server_coord.x, mouse_server_coord.y);
    });

    board.canvas.addEventListener('touchend', (e) => {
        board.selfUser.canvasPos = undefined;
        if ( typeof mousePos != "undefined" && typeof board.interactorLoaded != "undefined"){
            board.interactorLoaded.mouseup(board, lastPointedElement, mousePos);
        }
        board.alignement_horizontal_y = undefined;
        board.alignement_vertical_x = undefined;
        board.requestDraw();
        lastPointedElement = undefined;

    });


}





