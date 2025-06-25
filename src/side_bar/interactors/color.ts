import { ClientBoard } from "../../board/board";
import { CanvasCoord } from "../../board/display/canvas_coord";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { PreInteractor } from "../pre_interactor";
import { Color, colorsData, getCanvasColor } from "../../board/display/colors_v2";
import { PointedElementData } from "../../interactors/pointed_element_data";
import { Option } from "gramoloss";



export function createColorInteractor(board: ClientBoard): PreInteractor{

    const color_interactorV2 = new PreInteractor(INTERACTOR_TYPE.COLOR, "Edit colors", "c", "color", 'url("../img/cursors/color.svg"), auto', new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK, DOWN_TYPE.STROKE, DOWN_TYPE.RECTANGLE]));
    
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
    
    color_interactorV2.trigger = (board: ClientBoard, mousePos: Option<CanvasCoord>) => {
        turn_on_color_picker_div();
        move_back_color_picker_div();
        const colorPickerDiv = document.getElementById("color_picker");
    
        if (colorPickerDiv != null && colorPickerDiv.style.display == "block") {
            if (board.keyPressed.has("Shift")){
                select_previous_color(board, colors_available);
            } else {
                select_next_color(board, colors_available);
            }
           
        }
    }
    
    color_interactorV2.onleave = () => {
        turn_off_color_picker_div();
    }
    
    
    color_interactorV2.mousedown = (( board: ClientBoard, pointed: PointedElementData) => {
        board.regenAgregId();
        if (typeof pointed.data != "undefined"){
            if ( pointed.data.element.color != board.colorSelected){
                if (typeof pointed.type != "undefined"){
                    board.emitUpdateElement( pointed.type , pointed.data.element.serverId, "color", board.colorSelected);
                }
            }
        }
       
    })
    
    
    color_interactorV2.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if (typeof pointed == "undefined") return false;

        const elt = board.get_element_nearby(e, color_interactorV2.interactable_element_type);
        if (typeof elt != "undefined"){
            if ( elt.element.color != board.colorSelected){
                board.emitUpdateElement( elt.element.boardElementType , elt.element.serverId, "color", board.colorSelected);
            }
        }
        // if ( elt instanceof ELEMENT_DATA_VERTEX || elt instanceof ELEMENT_DATA_LINK) {
        //     if ( elt.element.color != board.colorSelected){
        //         if (typeof pointed.type != "undefined"){
        //             board.emit_update_element( pointed.type , elt.element.serverId, "color", board.colorSelected);
        //         }
        //     }
        //     return true;
        // }
       
        // else if (elt instanceof ELEMENT_DATA_STROKE ){
        //     if ( elt.element.color != board.colorSelected){
        //         board.emit_update_element( BoardElementType.Stroke, elt.index, "color", board.colorSelected);
        //     }
        // } else if (elt instanceof ELEMENT_DATA_RECTANGLE){
        //     if ( elt.element.color != board.colorSelected){
        //         board.emit_update_element( BoardElementType.Rectangle, elt.index, "color", board.colorSelected);
        //     }
        // }
        return false;
    })
    
    return color_interactorV2;
    
}



    
function turn_on_color_picker_div() {
    const colorPickerDiv = document.getElementById("color_picker");
    if (colorPickerDiv != null){
        colorPickerDiv.style.display = "block";
        colorPickerDiv.style.opacity = "1";
    }
   
}

function turn_off_color_picker_div() {
    const colorPickerDiv = document.getElementById("color_picker");
    if (colorPickerDiv != null){
        colorPickerDiv.style.opacity = "0";
        setTimeout(() => { colorPickerDiv.style.display = "none" }, 200);
    }
    
}


    
function move_back_color_picker_div() {
    const color_interactor_div = document.getElementById( INTERACTOR_TYPE.COLOR );
    if (color_interactor_div == null) return;
    const offsets = color_interactor_div.getBoundingClientRect();
    const colorPickerDiv = document.getElementById("color_picker");
    if ( colorPickerDiv != null){
        colorPickerDiv.style.top = String(offsets.top) + "px";
        colorPickerDiv.style.left = "70" + "px";
    }
}


function add_available_color(board: ClientBoard, color: Color) {
    const color_div = document.createElement("div");
    color_div.id = "color_choice_" + color;
    color_div.classList.add("color_choice");
    color_div.style.backgroundColor = getCanvasColor(color, board.isDarkMode());
    color_div.onclick = () => {
        board.colorSelected = color;
        update_selected_available_color(board);
        move_back_color_picker_div();
    }
    const colorPickerDiv = document.getElementById("color_picker");
    if (colorPickerDiv != null){
        colorPickerDiv.appendChild(color_div);
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