import { setupLoadedParam } from "../board/area_div";
import { ClientBoard } from "../board/board";

export class EntireZone {
    paramsDivContainer: HTMLDivElement;

    constructor(board: ClientBoard){
        this.paramsDivContainer = document.createElement("div");
        setupLoadedParam(board, document.createElement("div"), this);
    }
}



