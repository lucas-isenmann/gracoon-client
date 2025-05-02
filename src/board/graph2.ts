import { Coord, Graph, Vertex } from "gramoloss";
import { Color } from "./display/colors_v2";


export class VertexData2 {
    color: Color;
    pos: Coord;
    innerLabel: string;
    outerLabel: string;

    constructor(pos: Coord, color: Color, innerLabel: string, outerLabel: string){
        this.pos = new Coord(pos.x, pos.y);
        this.color = color;
        this.innerLabel = innerLabel;
        this.outerLabel = outerLabel;
    }
}


export class LinkData2 {
    color: Color;
    label: string;

    constructor(color: Color, label: string){
        this.label = label;
        this.color = color;
    }
}

export class Vertex2 extends Vertex<VertexData2> {

    getColor(): Color {
        return this.data.color;
    }
}



export class Graph2 extends Graph<VertexData2, LinkData2> {
    
}