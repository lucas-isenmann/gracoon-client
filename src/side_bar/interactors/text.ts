import { TextZone } from "gramoloss";
import { ClientBoard } from "../../board/board";
import { DOWN_TYPE, INTERACTOR_TYPE } from "../../interactors/interactor";
import { ELEMENT_DATA_LINK, ELEMENT_DATA_VERTEX, PointedElementData } from "../../interactors/pointed_element_data";
import { PreInteractor } from "../pre_interactor";
import { TextZoneElement } from "../../board/elements/textZone";
import { LinkElement, VertexElement } from "../../board/element";



export function createTextInteractor(board: ClientBoard): PreInteractor{
    const textInteractorV2 = new PreInteractor(INTERACTOR_TYPE.TEXT, "Text zones, vertices labels, links labels", "t", "text", "default", new Set([DOWN_TYPE.LINK, DOWN_TYPE.LINK_WEIGHT, DOWN_TYPE.VERTEX, DOWN_TYPE.VERTEX_WEIGHT, DOWN_TYPE.TEXT_ZONE]));
    const input = document.createElement("input");
    input.classList.add("label-input");
    input.style.display = "none";
    document.body.appendChild(input);

    

    textInteractorV2.mousedown = ((board: ClientBoard, pointed: PointedElementData) => {

        input.blur();
        input.style.display = "none";

        if ( pointed.data instanceof ELEMENT_DATA_LINK || pointed.data instanceof ELEMENT_DATA_VERTEX ) {
            const element = pointed.data.element;

            input.style.display = "block";
            input.style.top = "100px";
            input.style.left = "100px";

            input.value = "";
            if (element instanceof VertexElement){
                input.value = element.innerLabel;
            } else if (element instanceof LinkElement){
                input.value = element.label;
            }

            input.focus();
            // A timeout is needed I dont know why.
            setTimeout(() => {
                input.focus();
            }, 50);


            input.onkeyup = (e) => {
                if ( input.textContent != null){
                    if (element instanceof VertexElement){
                        board.emitUpdateElement(element.boardElementType, element.serverId, "weight", input.value);
                    } else if (element instanceof LinkElement){
                        board.emitUpdateElement(element.boardElementType, element.serverId, "weight", input.value);
                        // element.setLabel(input.value);
                    }
                }
                if (e.key == "Enter" && board.keyPressed.has("Control")) {
                    input.blur();
                    input.style.display = "none";
                }
            }

            // if (typeof element.data.weightDiv == "undefined"){
            //     initWeightDiv(element, boardElementType(element), board, true);
            // }

            
        }
        else if ( typeof pointed.data == "undefined" ){
            if (document.activeElement){ // If there is an active content editable, then do not create a textZone 
                if (document.activeElement.classList.contains("content_editable")){
                    return;
                }
            }

            const coord = board.camera.createServerCoord(pointed.pointedPos);
            board.emitAddElement(new TextZone(coord, 100, "", board.elementCounter),(response: number) => { 
                setTimeout(() => {
                    for (const element of board.elements.values()){
                        if (element instanceof TextZoneElement && element.serverId == response){
                            element.contentDiv.focus();
                            break;
                        }
                    }
                    
                }, 50);
            } );
        }
    })


    return textInteractorV2;
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