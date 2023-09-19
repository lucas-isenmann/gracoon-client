import { ClientGraph } from "../board/graph";
import { CanvasCoord } from "../board/canvas_coord";
import { AttributesArray } from "./attribute";
import { ClientBoard } from "../board/board";



export class GraphGenerator {
    name: string;
    attributes: AttributesArray;
    generate: (pos: CanvasCoord, board: ClientBoard) => ClientGraph;

    constructor(name: string, attributes: AttributesArray) {
        this.name = name;
        this.attributes = attributes;
        this.generate = (pos: CanvasCoord, board: ClientBoard) => { return new ClientGraph(board) };
    }
}

