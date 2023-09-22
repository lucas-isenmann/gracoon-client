import { INTERACTOR_TYPE } from "../interactors/interactor";
import { boardElementType, BoardElementType, ClientBoard } from "./board";
import { ClientLink } from "./link";
import { ClientVertex } from "./vertex";


/*
To a Board Element which has a weight (string) we create a weight div.
The class must satisfy the following interface.
And in the constructor :
    add updateWeightDiv
And in the setWeight:
    add updateWeightDiv
*/


export interface Weightable {
    getIndex(): number;
    getWeight(): string;
    setWeight(newWeight: string): void;
    setWeightDiv(div: HTMLDivElement): void;
    setAutoWeightDivPos(): void;
}


/**
 * Update the weight div from the the weight attribute.
 * If the weight is "", then the weight div is removed.
 * Otherwise, the weight div updated or created.
 */
export function updateWeightDiv(element: ClientVertex | ClientLink, board: ClientBoard){
    console.log("update weight div");

    if (element.data.weight == ""){
        if (typeof element.data.weightDiv != "undefined"){
            if ( document.activeElement && document.activeElement.id == element.data.weightDiv.id ){
                element.setAutoWeightDivPos();
            } else {
                element.data.weightDiv.remove();
                element.data.weightDiv = undefined;
            }
        }
    } else {
        if (typeof element.data.weightDiv === "undefined"){
            initWeightDiv(element, boardElementType(element), board);
        } else {
            element.data.weightDiv.innerHTML = element.data.weight;
            // this.weightDiv.innerHTML = katex.renderToString(this.weight);
        }
        element.setAutoWeightDivPos();
    }
}


function setWeightFromWeightDiv(element: ClientVertex | ClientLink){
    if (typeof element.data.weightDiv != "undefined"){
        const str = element.data.weightDiv.innerText.replace(/[\r\n]/g, "");
        element.data.weight = str;
        element.setAutoWeightDivPos();
    }
}


/**
 * Create the weightDiv for the element
 */
export function initWeightDiv(element: ClientVertex | ClientLink, type: BoardElementType, board: ClientBoard, focus?: boolean){
    console.log("init weight div", type);
    let div = document.createElement("div");
    element.setWeightDiv(div);

    div.contentEditable = "true";    
    div.id = type + "_weight_" + element.getIndex();
    div.classList.add("element-label", "content_editable");
    document.body.appendChild(div);
    if (typeof focus != "undefined"){
        div.focus();
    }



    updateWeightDiv(element, board);
    // div.innerHTML = element.getWeight();
    // element.weightDiv.innerHTML = katex.renderToString(element.weight);
    // element.setAutoWeightDivPos();

    div.onkeyup = (e) => {
        // saveSelection();
        if ( div.textContent != null){
            setWeightFromWeightDiv(element);
        }
        if (e.key == "Enter" && board.keyPressed.has("Control")) {
            div.blur();
            if (element.data.weight == ""){
                div.remove();
                element.data.weightDiv = undefined;
            }
        }
        board.emit_update_element(type, element.getIndex(), "weight", element.getWeight());
    }

    // Prevent other interactors to click on this div (and launch the editor of the weight).
    div.onmousedown = (e: MouseEvent) => {
        if (board.interactorLoadedId == INTERACTOR_TYPE.ERASER){
            board.emit_update_element(boardElementType(element), element.index, "weight", "");
        }
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

    
}