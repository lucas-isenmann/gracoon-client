import { AttributesArray } from "../generators/attribute";


export class GraphModifyer {
    name: string; // id
    humanName: string;
    description: string;
    attributes: AttributesArray;

    constructor(name: string, humanName: string, description: string, attributes: AttributesArray) {
        this.name = name;
        this.humanName = humanName;
        this.description = description;
        this.attributes = attributes;
    }
}