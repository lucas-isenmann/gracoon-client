import { INTERACTOR_TYPE } from "../interactors/interactor";
import { interactor_loaded, key_states } from "../interactors/interactor_manager";
import { BoardElementType, ClientBoard } from "./board";

export interface Weightable {
    getIndex(): number | undefined;
    getWeight(): string;
    setWeight(newWeight: string): void;
    getWeightDiv(): HTMLDivElement | undefined;
    setWeightDiv(div: HTMLDivElement): void;
    setAutoWeightDivPos(): void;
}

/**
 * Init the weightDiv
 */
export function initWeightDiv<R extends Weightable>(element: R, type: BoardElementType, board: ClientBoard){
    if (typeof element.getIndex() !== "undefined"){
        element.setWeightDiv(document.createElement("div"));
        element.getWeightDiv().contentEditable = "true";    
        element.getWeightDiv().id = type + "_weight_" + element.getIndex();
        element.getWeightDiv().classList.add("element-label", "content_editable");
        document.body.appendChild(element.getWeightDiv());
        element.getWeightDiv().innerHTML = element.getWeight();
        // element.weightDiv.innerHTML = katex.renderToString(element.weight);
        element.setAutoWeightDivPos();

        element.getWeightDiv().onkeyup = (e) => {
            // saveSelection();
            element.setWeight(element.getWeightDiv().textContent);
            board.emit_update_element(type, element.getIndex(), "weight", element.getWeight());
            if (e.key == "Enter" && key_states.get("Control")) {
                element.getWeightDiv().blur();
                element.setAutoWeightDivPos();
            }
        }

        // Prevent other interactors to click on this div (and launch the editor of the weight).
        element.getWeightDiv().onmousedown = (e: MouseEvent) => {
            if (interactor_loaded.id != INTERACTOR_TYPE.TEXT){
                e.preventDefault();
            }
        }

        element.getWeightDiv().addEventListener("wheel", function (e) {
            const weightNumberValue = parseInt(element.getWeight());
            if ( isNaN(weightNumberValue) == false){
                if (e.deltaY < 0) {
                    board.emit_update_element( type, element.getIndex(), "weight", String(weightNumberValue+1));
                }else {
                    board.emit_update_element(  type, element.getIndex(), "weight", String(weightNumberValue-1));
                }
            }
        })

    } else {
        console.log("Error: can't init weightDiv because index undefined");
    }
}