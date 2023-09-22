import { DOWN_TYPE, RESIZE_TYPE } from './interactor'
import { socket } from '../socket';
import { regenerate_graph } from '../generators/dom';
import { CanvasCoord } from '../board/canvas_coord';
import { CanvasVect } from '../board/canvasVect';
import { ClientDegreeWidthRep } from '../board/representations/degree_width_rep';
import { BoardElementType, ClientBoard } from '../board/board';
import { InteractorV2 } from '../side_bar/interactor_side_bar';
import { ELEMENT_DATA_AREA, ELEMENT_DATA_RECTANGLE, ELEMENT_DATA_REPRESENTATION, PointedElementData } from './pointed_element_data';
import { Option } from 'gramoloss';

// INTERACTOR MANAGER





export function selectInteractor(interactor: InteractorV2, board: ClientBoard, pos: Option<CanvasCoord>) {
    if ( typeof board.interactorLoaded != "undefined" && interactor.id != board.interactorLoadedId ){
        board.interactorLoaded.onleave();
    }

    board.interactorLoaded = interactor;
    board.interactorLoadedId = interactor.id;

    board.canvas.style.cursor = interactor.cursor_style;
    board.view.is_creating_vertex = false;
    interactor.trigger(board, pos);
    select_interactor_div(interactor);
    board.requestDraw();
}


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
                const dw_rep = ClientDegreeWidthRep.from_embedding(board, board.view);
                board.representations.set(0, dw_rep);
                requestAnimationFrame(function () { board.draw() });
            }
            // if (e.key == "u"){
            //     console.log("generate moebius stanchions SVG");
            //     const h = board.getVariableValue("h");
            //     const h2 = board.getVariableValue("h2");
            //     const adaptToEdgeLength = board.getVariableValue("adaptToEdgeLength");
            //     const ratio = board.getVariableValue("ratio");
            //     const durete = board.getVariableValue("durete");
            //     const crossRatio = board.getVariableValue("crossRatio");
            //     const width = board.getVariableValue("width");

            //     if (typeof width == "number" && typeof crossRatio == "number" && typeof durete == "number" && typeof h == "number" && typeof h2 == "number" && typeof adaptToEdgeLength == "boolean" && typeof ratio == "number"){
            //         board.graph.drawCombinatorialMap("", ctx, h, h2, crossRatio, adaptToEdgeLength, ratio, durete, width);
            //     }
            // }
            // if (e.key == "v"){
            //     console.log("generate moebius stanchions SVG");
            //     const h = board.getVariableValue("h");
            //     const h2 = board.getVariableValue("h2");
            //     const adaptToEdgeLength = board.getVariableValue("adaptToEdgeLength");
            //     const ratio = board.getVariableValue("ratio");
            //     const durete = board.getVariableValue("durete");
            //     const crossRatio = board.getVariableValue("crossRatio");
            //     const width = board.getVariableValue("width");
            //     if (typeof width == "number" && typeof crossRatio == "number" && typeof durete == "number" && typeof h == "number" && typeof h2 == "number" && typeof adaptToEdgeLength == "boolean" && typeof ratio == "number"){
            //         // board.graph.getCombinatorialMap(ctx, h, h2, crossRatio, adaptToEdgeLength, ratio, durete);
            //         board.graph.drawCombinatorialMap(undefined, ctx, h, h2, crossRatio, adaptToEdgeLength, ratio, durete, width)
            //     }

            // }
            
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
                const subgraph = board.graph.get_induced_subgraph_from_selection(board.view);
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
            board.view.apply_zoom_to_center(new CanvasCoord(e.pageX, e.pageY), 1 / 1.1);
        } else {
            board.view.apply_zoom_to_center(new CanvasCoord(e.pageX, e.pageY), 1.1);
        }
        board.update_after_camera_change();
        board.update_canvas_pos(board.view);
        board.updateOtherUsersCanvasPos();


        if ( typeof board.selfUser.following != "undefined") {
            board.selfUser.unfollow(board.selfUser.following);
        }
        socket.emit("my_view", board.view.camera.x, board.view.camera.y, board.view.zoom);

        board.requestDraw();
    });

    board.canvas.addEventListener('mouseup', function (e) {
        mousePos = new CanvasCoord(e.pageX, e.pageY);
        board.selfUser.canvasPos = new CanvasCoord(e.pageX, e.pageY);
        mousePos = board.graph.align_position(mousePos, new Set(), board.canvas, board.view);
        if (typeof board.interactorLoaded != "undefined"){
            board.interactorLoaded.mouseup(board, lastPointedElement, mousePos);
        }
        board.view.alignement_horizontal = false;
        board.view.alignement_vertical = false;
        board.requestDraw()
        lastPointedElement = undefined;
    })

    board.canvas.addEventListener("mouseout", function(e){
        lastPointedElement = undefined;
        mousePos = undefined;
        board.view.alignement_horizontal = false;
        board.view.alignement_vertical = false;
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

        const mouse_server_coord = board.view.create_server_coord(mousePos);
        socket.emit("moving_cursor", mouse_server_coord.x, mouse_server_coord.y);
    })

    board.canvas.addEventListener('mousedown', function (e) {
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
                const data = board.get_element_nearby(mousePos, board.interactorLoaded.interactable_element_type);
                const pointedPos = board.graph.align_position(mousePos, new Set(), board.canvas, board.view);
                lastPointedElement = new PointedElementData(pointedPos, e.buttons, data );
                board.interactorLoaded.mousedown(board, lastPointedElement);
                board.requestDraw();
            }
            
        }
    })

    board.canvas.addEventListener('touchstart', (et: TouchEvent) => {
        console.log("touchstart");
        const click_pos = new CanvasCoord(et.touches[0].clientX, et.touches[0].clientY);

        if (typeof board.interactorLoaded == "undefined") return;
        const data = board.get_element_nearby(click_pos, board.interactorLoaded.interactable_element_type);
        const pointedPos = board.graph.align_position(click_pos, new Set(), board.canvas, board.view);
        lastPointedElement = new PointedElementData(pointedPos, 0, data );
        board.interactorLoaded.mousedown(board, lastPointedElement);
        board.requestDraw();
    });

    board.canvas.addEventListener('touchmove', (e) => {
        mousePos = new CanvasCoord(e.touches[0].clientX, e.touches[0].clientY);
        if ( typeof lastPointedElement != "undefined" && typeof board.interactorLoaded != "undefined"){
            if (board.interactorLoaded.mousemove(board, lastPointedElement, mousePos)) {
                board.requestDraw();
            }
        }
        
        const mouse_server_coord = board.view.create_server_coord(mousePos);
        socket.emit("moving_cursor", mouse_server_coord.x, mouse_server_coord.y);
    });

    board.canvas.addEventListener('touchend', (e) => {
        lastPointedElement = undefined;
        if ( typeof lastPointedElement != "undefined" && typeof mousePos != "undefined" && typeof board.interactorLoaded != "undefined"){
            board.interactorLoaded.mouseup(board, lastPointedElement, mousePos);
        }
        board.view.alignement_horizontal = false;
        board.view.alignement_vertical = false;
        board.requestDraw();
    });


}






function select_interactor_div(interactor: InteractorV2 ) {
    document.querySelectorAll(".interactor").forEach( div => {
        if (div.id == interactor.id) {
            div.classList.add("selected");
        }
        else {
            div.classList.remove("selected");
        }
    })
}



