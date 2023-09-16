import { BoardElementType, ClientBoard } from "../../board/board";
import { CanvasCoord } from "../../board/canvas_coord";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { key_states, last_down, last_down_index } from "../../interactors/interactor_manager";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";
import { Color, colorsData, getCanvasColor } from "../../colors_v2";



export function createColorInteractor(board: ClientBoard): InteractorV2{

    const color_interactorV2 = new InteractorV2(board, INTERACTOR_TYPE.COLOR, "Edit colors", "c", ORIENTATION_INFO.RIGHT, "color", 'url("../img/cursors/color.svg"), auto', new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK, DOWN_TYPE.STROKE]));
    
    // Local variables
    const colors_available = new Array<Color>();
    
    // Setup
    for ( const colorName of colorsData.keys()){
        colors_available.push(colorName as Color);
    }
    
    // Color picker HTML div
    const color_picker_div = document.createElement("div");
    color_picker_div.id = "color_picker";
    document.body.appendChild(color_picker_div);
    
    // Color picker input HTML input
    const color_picker_input = document.createElement("input");
    color_picker_input.classList.add("color_picker_input");
    color_picker_input.type = "color";
    color_picker_input.onchange = (() => {
        board.colorSelected = color_picker_input.value as Color;
        colors_available.push(board.colorSelected);
        add_available_color(board, board.colorSelected);
        update_selected_available_color(board);
    });
    color_picker_div.onmouseleave = ((e) => {
        move_back_color_picker_div();
    });
    //color_picker_div.appendChild(color_picker_input); // color_picker_input DISABLED
    
    for (const basic_color of colors_available) {
        add_available_color(board, basic_color);
    }
    update_selected_available_color(board)
    
    
    
    
    
    // Interactors methods
    
    color_interactorV2.trigger = (board: ClientBoard, mouse_pos: CanvasCoord) => {
        console.log("trigger color interactor");
        turn_on_color_picker_div();
        move_back_color_picker_div();
        const colorPicketDiv = document.getElementById("color_picker");
        if (typeof colorPicketDiv == "undefined")  return;
    
        if (colorPicketDiv.style.display == "block") {
            if (key_states.get("Shift")){
                select_previous_color(board, colors_available);
            } else {
                select_next_color(board, colors_available);
            }
           
        }
    }
    
    color_interactorV2.onleave = () => {
        turn_off_color_picker_div();
    }
    
    
    color_interactorV2.mousedown = (( board: ClientBoard, e: CanvasCoord) => {
        if (last_down == DOWN_TYPE.VERTEX) {
            if ( board.graph.vertices.has(last_down_index) && board.graph.vertices.get(last_down_index).data.color != board.colorSelected){
                // const data_socket = new Array();
                // data_socket.push({ type: "vertex", index: last_down_index, color: color_selected });
                board.emit_update_element( BoardElementType.Vertex, last_down_index, "color", board.colorSelected);
            }
        }
        else if (last_down == DOWN_TYPE.LINK){
            if ( board.graph.links.has(last_down_index) && board.graph.links.get(last_down_index).data.color != board.colorSelected){
                board.emit_update_element( BoardElementType.Link,last_down_index, "color", board.colorSelected);
            }
        }
        else if (last_down == DOWN_TYPE.STROKE){
            if ( board.strokes.has(last_down_index) && board.strokes.get(last_down_index).color != board.colorSelected){
                board.emit_update_element( BoardElementType.Stroke,last_down_index, "color", board.colorSelected);
            }
        }
    })
    
    
    color_interactorV2.mousemove = ((board: ClientBoard, e: CanvasCoord) => {
        if (last_down != null) {
            const elt = board.get_element_nearby(e, color_interactorV2.interactable_element_type);
            if (elt.type == DOWN_TYPE.VERTEX) {
                if ( board.graph.vertices.has(elt.index) && board.graph.vertices.get(elt.index).data.color != board.colorSelected){
                    board.emit_update_element( BoardElementType.Vertex, elt.index, "color", board.colorSelected);
    
                }
                return true;
            }
            else if (elt.type == DOWN_TYPE.LINK) {
                if ( board.graph.links.has(elt.index) && board.graph.links.get(elt.index).data.color != board.colorSelected){
                    board.emit_update_element( BoardElementType.Link, elt.index, "color", board.colorSelected);
                }
                return true;
            }
            else if (elt.type == DOWN_TYPE.STROKE){
                if ( board.strokes.has(elt.index) && board.strokes.get(elt.index).color != board.colorSelected){
                    board.emit_update_element( BoardElementType.Stroke, elt.index, "color", board.colorSelected);
                }
            }
            return false;
        }
    })
    
    return color_interactorV2;
    
}



    
function turn_on_color_picker_div() {
    const colorPicketDiv = document.getElementById("color_picker");
    if (typeof colorPicketDiv != "undefined"){
        colorPicketDiv.style.display = "block";
        colorPicketDiv.style.opacity = "1";
    }
   
}

function turn_off_color_picker_div() {
    const colorPicketDiv = document.getElementById("color_picker");
    if (typeof colorPicketDiv != "undefined"){
        colorPicketDiv.style.opacity = "0";
        setTimeout(() => { colorPicketDiv.style.display = "none" }, 200);
    }
    
}


    
function move_back_color_picker_div() {
    const color_interactor_div = document.getElementById( INTERACTOR_TYPE.COLOR );
    const offsets = color_interactor_div.getBoundingClientRect();
    const colorPicketDiv = document.getElementById("color_picker");
    if (typeof colorPicketDiv != "undefined"){
        colorPicketDiv.style.top = String(offsets.top) + "px";
        colorPicketDiv.style.left = "70" + "px";
    }
}


function add_available_color(board: ClientBoard, color: Color) {
    const color_div = document.createElement("div");
    color_div.id = "color_choice_" + color;
    color_div.classList.add("color_choice");
    color_div.style.backgroundColor = getCanvasColor(color, board.view.dark_mode);
    color_div.onclick = () => {
        board.colorSelected = color;
        update_selected_available_color(board);
        move_back_color_picker_div();
    }
    const colorPicketDiv = document.getElementById("color_picker");
    if (typeof colorPicketDiv != "undefined"){
        colorPicketDiv.appendChild(color_div);
    }
}

function update_selected_available_color(board: ClientBoard) {
    Array.from(document.getElementsByClassName("color_choice")).forEach(color_div => {
        if (color_div instanceof HTMLElement) {
            if (color_div.id == "color_choice_" + board.colorSelected) {
                color_div.classList.add("selected");
            }
            else {
                color_div.classList.remove("selected");
            }
        }
    });
}

function select_next_color(board: ClientBoard, colors_available: Array<Color>) {
    for (let i = 0; i < colors_available.length; i++) {
        const color = colors_available[i];
        if (color == board.colorSelected) {
            if (i == colors_available.length - 1) {
                board.colorSelected = colors_available[0];
            }
            else {
                board.colorSelected = colors_available[i + 1];
            }
            update_selected_available_color(board)
            return;
        }
    }
}

function select_previous_color(board: ClientBoard, colors_available: Array<Color>) {
    for (let i = 0; i < colors_available.length; i++) {
        const color = colors_available[i];
        if (color == board.colorSelected) {
            if (i == 0) {
                board.colorSelected = colors_available[colors_available.length-1];
            }
            else {
                board.colorSelected = colors_available[i - 1];
            }
            update_selected_available_color(board)
            return;
        }
    }
}