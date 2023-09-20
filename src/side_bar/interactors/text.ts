import { TextZone } from "gramoloss";
import { ClientBoard } from "../../board/board";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { ELEMENT_DATA_LINK, ELEMENT_DATA_VERTEX, PointedElementData } from "../../interactors/pointed_element_data";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";



export function createTextInteractor(board: ClientBoard): InteractorV2{
    const text_interactorV2 = new InteractorV2(board, INTERACTOR_TYPE.TEXT, "Create and edit text zones", "t", ORIENTATION_INFO.RIGHT, "text", "default", new Set([DOWN_TYPE.LINK, DOWN_TYPE.LINK_WEIGHT, DOWN_TYPE.VERTEX, DOWN_TYPE.VERTEX_WEIGHT, DOWN_TYPE.TEXT_ZONE]));

    text_interactorV2.mousedown = ((board: ClientBoard, pointed: PointedElementData) => {

        if ( pointed.data instanceof ELEMENT_DATA_LINK || pointed.data instanceof ELEMENT_DATA_VERTEX ) {
            const element = pointed.data.element;
            element.afterSetWeight(board);

            // A timeout is needed I dont know why.
            if (typeof element.data.weightDiv !== "undefined"){
                setTimeout(() => {
                    if (typeof element.data.weightDiv !== "undefined"){
                        element.data.weightDiv.focus();
                    }
                }, 50);
            }
        }
        else if ( typeof pointed.data == "undefined" ){
            if (document.activeElement){ // If there is an active content editable, then do not create a textZone 
                if (document.activeElement.classList.contains("content_editable")){
                    return;
                }
            }

            const coord = board.view.create_server_coord(pointed.pointedPos);
            board.emit_add_element(new TextZone(coord, 100, "", board.get_next_available_index_text_zone()),(response: number) => { 
                setTimeout(() => {
                    const textZone = board.text_zones.get(response);
                    if ( typeof textZone != "undefined" ){
                        textZone.content_div.focus();
                    }
                }, 50);
            } );
        }
    })


    return text_interactorV2;
} 





// --------------




// ---------- SPECIFIC FUNCTIONS

// export function display_weight_input(index: number, pos: CanvasCoord, element_type: DOWN_TYPE) {
//     current_index = index;
//     current_element_type = element_type;
//     input.style.display = "block";
//     input.style.top = String(pos.y) + "px";
//     input.style.left = String(pos.x - 20) + "px";
//     window.setTimeout(() => input.focus(), 0); // without timeout does not focus
//     input.onkeyup = (e) => {
//         if (e.key == "Enter") {
//             validate_weight();
//         }
//     }
// }

// function turn_off_weight_input() {
//     console.log("turn off weight input");
//     input.value = "";
//     input.style.display = "none";
//     input.blur();
// }

// export function validate_weight() {
//     console.log("validate_weight");
//     if (current_index != null ) {
//         if ( current_element_type == DOWN_TYPE.VERTEX && local_board.graph.vertices.has(current_index)){
//             local_board.emit_update_element( BoardElementType.Vertex, current_index, "weight", input.value);
//         } else if ( current_element_type == DOWN_TYPE.LINK && local_board.graph.links.has(current_index)){
//             local_board.emit_update_element( BoardElementType.Link, current_index, "weight", input.value);
//         }
//     }
//     current_index = null;
//     current_element_type = null;
//     turn_off_weight_input();
// }