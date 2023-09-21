import { AttributesArray } from "./attribute";
import { GeneratorId } from "gramoloss";



export class GraphGenerator {
    id: GeneratorId;
    humanName: string;
    attributes: AttributesArray;

    constructor(id: GeneratorId, humanName: string, attributes: AttributesArray) {
        this.id = id;
        this.humanName = humanName;
        this.attributes = attributes;
    }
}

