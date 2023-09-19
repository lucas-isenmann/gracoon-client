import { INTERACTOR_TYPE } from "../interactors/interactor";
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
        const div = document.createElement("div");
        element.setWeightDiv(div);

        div.contentEditable = "true";    
        div.id = type + "_weight_" + element.getIndex();
        div.classList.add("element-label", "content_editable");
        document.body.appendChild(div);
        div.innerHTML = element.getWeight();
        // element.weightDiv.innerHTML = katex.renderToString(element.weight);
        element.setAutoWeightDivPos();

        div.onkeyup = (e) => {
            // saveSelection();
            if ( div.textContent != null){
                element.setWeight(div.textContent);
            }
            board.emit_update_element(type, element.getIndex(), "weight", element.getWeight());
            if (e.key == "Enter" && board.keyPressed.has("Control")) {
                div.blur();
                element.setAutoWeightDivPos();
            }
        }

        // Prevent other interactors to click on this div (and launch the editor of the weight).
        div.onmousedown = (e: MouseEvent) => {
            if (board.interactorLoadedId != INTERACTOR_TYPE.TEXT){
                e.preventDefault();
            }
        }

        div.addEventListener("wheel", function (e) {
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