import { AttributesArray } from "../generators/attribute";

/// modify function : index is either "" either the index of an area
/// If index is "" then it refers to the whole graph
export class GraphModifyer {
    name: string;
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