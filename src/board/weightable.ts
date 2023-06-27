import { interactor_loaded, key_states } from "../interactors/interactor_manager";
import { local_board } from "../setup";
import { text_interactorV2 } from "../side_bar/interactors/text";
import { BoardElementType } from "./board";

export interface Weightable {
    index: number | undefined;
    weight: string;
    weightDiv: HTMLDivElement | undefined;
    setAutoWeightDivPos(): void;
}

/**
 * Init the weightDiv
 */
export function initWeightDiv<R extends Weightable>(element: R, type: BoardElementType){
    if (typeof element.index !== "undefined"){
        element.weightDiv = document.createElement("div");
        element.weightDiv.contentEditable = "true";    
        element.weightDiv.id = type + "_weight_" + element.index;
        console.log(element.weightDiv.id);
        element.weightDiv.classList.add("element-label", "content_editable");
        document.body.appendChild(element.weightDiv);
        element.weightDiv.innerHTML = element.weight;
        // element.weightDiv.innerHTML = katex.renderToString(element.weight);
        element.setAutoWeightDivPos();

        element.weightDiv.onkeyup = (e) => {
            // saveSelection();
            element.weight = element.weightDiv.textContent;
            local_board.emit_update_element(type, element.index, "weight", element.weight);
            if (e.key == "Enter" && key_states.get("Control")) {
                element.weightDiv.blur();
                element.setAutoWeightDivPos();
            }
        }

        // Prevent other interactors to click on this div (and launch the editor of the weight).
        element.weightDiv.onmousedown = (e: MouseEvent) => {
            if (interactor_loaded.id != text_interactorV2.id){
                e.preventDefault();
            }
        }

        element.weightDiv.addEventListener("wheel", function (e) {
            const weightNumberValue = parseInt(element.weight);
            if ( isNaN(weightNumberValue) == false){
                if (e.deltaY < 0) {
                    local_board.emit_update_element( type, element.index, "weight", String(weightNumberValue+1));
                }else {
                    local_board.emit_update_element(  type, element.index, "weight", String(weightNumberValue-1));
                }
            }
        })

    } else {
        console.log("Error: can't init weightDiv because index undefined");
    }
}