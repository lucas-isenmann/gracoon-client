import { DOWN_TYPE, RESIZE_TYPE } from './interactor'
import { socket } from '../socket';
import { update_users_canvas_pos } from '../user';
import { regenerate_graph } from '../generators/dom';
import { clear_clipboard, clipboard_comes_from_generator, graph_clipboard, mouse_position_at_generation, paste_generated_graph, set_clipboard } from '../clipboard';
import { CanvasCoord } from '../board/canvas_coord';
import { CanvasVect } from '../board/vect';
import { ClientDegreeWidthRep } from '../board/representations/degree_width_rep';
import { BoardElementType, ClientBoard } from '../board/board';
import { InteractorV2 } from '../side_bar/interactor_side_bar';

// INTERACTOR MANAGER



export let mouse_pos: CanvasCoord = null;
export let mouse_buttons: string | number = "";
export let down_meta_element: any = "";
export let last_down_index: number = null;
export let down_coord: CanvasCoord = null;

export let last_down: DOWN_TYPE = null;

let previous_canvas_shift = new CanvasVect(0,0);




export function selectInteractor(interactor: InteractorV2, board: ClientBoard, pos: CanvasCoord) {
    if (interactor.id == board.interactorLoadedId) return;

    if ( typeof board.interactorLoaded != "undefined"){
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


export function setup_interactions(board: ClientBoard) {


    window.addEventListener('keydown', function (e) {
        if (e.key == "Control") {
            board.keyPressed.add("Control");
        }
        if (e.key == "Shift") {
            board.keyPressed.add("Shift");
        }

        if (document.activeElement.nodeName == "BODY") { // otherwise focus is on a text
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
                if ( subgraph.vertices.size > 0){
                    set_clipboard(subgraph, mouse_pos.copy(), false, board.canvas);
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
        update_users_canvas_pos(board.view);


        if ( typeof board.selfUser.following != "undefined") {
            board.selfUser.unfollow(board.selfUser.following);
        }
        socket.emit("my_view", board.view.camera.x, board.view.camera.y, board.view.zoom);

        board.requestDraw();
    });

    board.canvas.addEventListener('mouseup', function (e) {
        let click_pos = new CanvasCoord(e.pageX, e.pageY);
        click_pos = board.graph.align_position(click_pos, new Set(), board.canvas, board.view);
        board.interactorLoaded.mouseup(board,  click_pos);
        down_coord = null;
        last_down = null;
        last_down_index = null;
        board.view.alignement_horizontal = false;
        board.view.alignement_vertical = false;
        requestAnimationFrame(function () { board.draw() });
        mouse_buttons = "";
    })

    board.canvas.addEventListener("mouseout", function(e){
        down_coord = null;
        last_down = null;
        last_down_index = null;
        board.view.alignement_horizontal = false;
        board.view.alignement_vertical = false;
        requestAnimationFrame(function () {board.draw() });
        mouse_buttons = "";
    })

    board.canvas.addEventListener('mousemove', function (e) {
        const click_pos = new CanvasCoord(e.pageX, e.pageY);
        
        if ( board.updateElementOver(click_pos)){
            requestAnimationFrame(() => board.draw() );
        }

        mouse_pos = new CanvasCoord(e.pageX, e.pageY);
        if (graph_clipboard != null) {
            const shift = CanvasVect.from_canvas_coords(mouse_position_at_generation,click_pos);
            graph_clipboard.translate_by_canvas_vect( shift.sub(previous_canvas_shift), board.view);
            previous_canvas_shift.set_from(shift);
            board.draw()
        } else {
            if (board.interactorLoaded.interactable_element_type.has(DOWN_TYPE.RESIZE)){
                const element = board.get_element_nearby(click_pos, board.interactorLoaded.interactable_element_type);
                board.canvas.style.cursor = RESIZE_TYPE.to_cursor(element.resize_type);
            } else {
                board.canvas.style.cursor = "default";
            }
            if (board.interactorLoaded.mousemove(board, click_pos)) {
                requestAnimationFrame(function () {
                    board.draw()
                });
            }
        }

        const mouse_server_coord = board.view.create_server_coord(click_pos);
        socket.emit("moving_cursor", mouse_server_coord.x, mouse_server_coord.y);
    })

    board.canvas.addEventListener('mousedown', function (e) {

        previous_canvas_shift = new CanvasVect(0,0);
        mouse_buttons = e.buttons;
        down_coord = new CanvasCoord(e.pageX, e.pageY);
        down_coord = board.graph.align_position(down_coord, new Set(), board.canvas, board.view);

        if (graph_clipboard != null) {
            paste_generated_graph(board);
            if( board.keyPressed.has("Control") ){
                if (clipboard_comes_from_generator){
                    regenerate_graph(e, board);
                }                    
            }else {
                clear_clipboard(board.canvas);
            }
            board.draw()
        } else {
            const element = board.get_element_nearby(down_coord, board.interactorLoaded.interactable_element_type);
            console.log(element);
            last_down = element.type;
            last_down_index = element.index;
            down_meta_element = element;
            board.interactorLoaded.mousedown(board, down_coord)
            if (element.type != DOWN_TYPE.EMPTY) {
                requestAnimationFrame(function () { board.draw() });
            }
        }
    })

    board.canvas.addEventListener('touchstart', (et: TouchEvent) => {
        console.log("touchstart");
        const click_pos = new CanvasCoord(et.touches[0].clientX, et.touches[0].clientY);

        const element = board.get_element_nearby(click_pos, board.interactorLoaded.interactable_element_type);
        console.log(element);
        last_down = element.type;
        last_down_index = element.index;
        board.interactorLoaded.mousedown(board, click_pos)
        if (element.type != DOWN_TYPE.EMPTY) {
            requestAnimationFrame(function () { board.draw() });
        }
    });

    board.canvas.addEventListener('touchmove', (e) => {
        mouse_pos = new CanvasCoord(e.touches[0].clientX, e.touches[0].clientY);
        if (board.interactorLoaded.mousemove(board, mouse_pos)) {
            requestAnimationFrame(function () {
                board.draw()
            });
        }
        const mouse_server_coord = board.view.create_server_coord(mouse_pos);
        socket.emit("moving_cursor", mouse_server_coord.x, mouse_server_coord.y);
    });

    board.canvas.addEventListener('touchend', (e) => {
        const click_pos = mouse_pos;
        board.interactorLoaded.mouseup(board, click_pos);
        last_down = null;
        last_down_index = null;
        board.view.alignement_horizontal = false;
        board.view.alignement_vertical = false;
        requestAnimationFrame(function () { board.draw() });
    });


}






function select_interactor_div(interactor: InteractorV2 ) {
    for (let div of document.getElementsByClassName("interactor")) {
        if (div.id == interactor.id) {
            div.classList.add("selected");
        }
        else {
            div.classList.remove("selected");
        }
    }
}






// ------------------------------------------------------





