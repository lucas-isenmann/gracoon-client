import { TextZone } from "gramoloss";
import { BoardElementType } from "../../board/board";
import { ClientGraph } from "../../board/graph";
import { CanvasCoord } from "../../board/canvas_coord";
import { DOWN_TYPE } from "../../interactors/interactor";
import { last_down, last_down_index } from "../../interactors/interactor_manager";
import { local_board } from "../../setup";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";

export const text_interactorV2 = new InteractorV2("text", "Create and edit text zones", "t", ORIENTATION_INFO.RIGHT, "text", "default", new Set([DOWN_TYPE.LINK, DOWN_TYPE.LINK_WEIGHT, DOWN_TYPE.VERTEX, DOWN_TYPE.VERTEX_WEIGHT, DOWN_TYPE.TEXT_ZONE]));




// --------------

text_interactorV2.mousedown = ((canvas, ctx, g: ClientGraph, e: CanvasCoord) => {
    // validate_weight();

    if (last_down == DOWN_TYPE.LINK ) {
        if ( g.links.has(last_down_index)){
            const link = g.links.get(last_down_index);
            link.afterSetWeight();

            // A timeout is needed I dont know why.
            if (typeof link.data.weightDiv !== "undefined"){
                setTimeout(() => {
                    link.data.weightDiv.focus();
                }, 50);
            }
        }
    }
    else if (last_down == DOWN_TYPE.VERTEX){
        if ( g.vertices.has(last_down_index)){
            const vertex = g.vertices.get(last_down_index);
            vertex.afterSetWeight();

            // A timeout is needed I dont know why.
            if (typeof vertex.data.weightDiv !== "undefined"){
                setTimeout(() => {
                    vertex.data.weightDiv.focus();
                }, 50);
            }
        }
    }
    // else if (last_down == DOWN_TYPE.VERTEX_WEIGHT) {
    //     if ( g.vertices.has(last_down_index)){
    //         const vertex = g.vertices.get(last_down_index);
    //         display_weight_input(last_down_index, vertex.canvas_pos, DOWN_TYPE.VERTEX);
    //     }
    // }
    else if ( last_down == DOWN_TYPE.EMPTY){
        const coord = local_board.view.create_server_coord(e);
        local_board.emit_add_element(new TextZone(coord, 100, ""),(response: number) => { 
            setTimeout(() => {
                const text_zone = local_board.text_zones.get(response);
                text_zone.content_div.focus();
            }, 50);
        } );
    }
})


text_interactorV2.onleave = () => {
    // current_index = null;
    // turn_off_weight_input();
}



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