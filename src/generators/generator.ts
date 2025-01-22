import { AttributesArray, Integer, ListAttribute, Percentage } from "./attribute";
import { EmbeddedGraph, generateAztecDiamond, generateCirculantTournament, generateCliqueCircle, generateCompleteBipartite, generateCompleteMultipartite, generateGrid, generateIndependentCircle, generatePaleyGraph, generateRandomGNP, generateRandomTournament, generateStar, generateUGTournament, generateUnitDisk, generateUTournament, GeneratorId, ORIENTATION } from "gramoloss";




export class GraphGenerator {
    id: string;
    humanName: string;
    attributes: AttributesArray;
    graph: EmbeddedGraph;
    svg: SVGSVGElement;

    constructor(id: string, humanName: string, attributes: AttributesArray) {
        this.id = id;
        this.humanName = humanName;
        this.attributes = attributes;
        this.graph = new EmbeddedGraph();
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.style.margin = "auto"

        for (const attribute of this.attributes){
            if (attribute instanceof Integer){
                attribute.input.onchange = (e) => {
                    attribute.updateValue();
                    this.computeGraph()
                }
            }
            if (attribute instanceof Percentage){
                attribute.input.oninput = (e) => {
                    attribute.updateValue();
                    this.computeGraph();
                }
            }
            if (attribute instanceof ListAttribute){
                attribute.input.oninput = (e) => {
                    attribute.updateValue();
                    this.computeGraph();
                }
            }
        }

        this.computeGraph();

    }

    computeGraph(){
        if (this.id == GeneratorId.RandomTournament){
            if (this.attributes.length >= 1 && this.attributes[0] instanceof Integer){
                this.graph = generateRandomTournament(this.attributes[0].value)
            }
        }
        else if (this.id == GeneratorId.AztecDiamond){
            if (this.attributes.length >= 1 && this.attributes[0] instanceof Integer){
                this.graph = generateAztecDiamond(this.attributes[0].value)
            }
        }
        else if (this.id == GeneratorId.UnitDisk){
            if (this.attributes.length >= 2 && this.attributes[0] instanceof Integer && this.attributes[1] instanceof Integer){
                this.graph = generateUnitDisk( this.attributes[0].value, this.attributes[1].value);
            }
        }
        else if (this.id == GeneratorId.Star){
            if (this.attributes.length >= 1 && this.attributes[0] instanceof Integer){
                this.graph = generateStar(this.attributes[0].value)
            }
        }
        else if (this.id == GeneratorId.IndependentCircle){
            if (this.attributes.length >= 1 && this.attributes[0] instanceof Integer){
                this.graph = generateIndependentCircle(this.attributes[0].value);
           }
        }
        else if (this.id == GeneratorId.CliqueCircle){
            if (this.attributes.length >= 1 && this.attributes[0] instanceof Integer){
                this.graph = generateCliqueCircle(this.attributes[0].value)
           }
        }
        else if (this.id == GeneratorId.Paley){
            if (this.attributes.length >= 1 && this.attributes[0] instanceof Integer){
                this.graph = generatePaleyGraph(this.attributes[0].value);
           }
        }
        else if (this.id == GeneratorId.UGTournament){
            if (this.attributes.length >= 2 
                && this.attributes[0] instanceof Integer 
                && this.attributes[1] instanceof Integer
            ){
                this.graph = generateUGTournament(this.attributes[0].value, this.attributes[1].value);
            }
        }
        else if (this.id == GeneratorId.RandomGNP){
            if (this.attributes.length >= 2 
                && this.attributes[0] instanceof Integer 
                && this.attributes[1] instanceof Percentage
            ){

                this.graph = generateRandomGNP(this.attributes[0].value, this.attributes[1].value);
            }
        }
        else if (this.id == GeneratorId.CompleteMultipartite){
            if (this.attributes.length >= 2 
                && this.attributes[0] instanceof Integer 
                && this.attributes[1] instanceof Integer
            ){
                const l = new Array<number>();
                for (let i = 0; i < this.attributes[1].value; i ++){
                    l.push(this.attributes[0].value);
                }

                this.graph = generateCompleteMultipartite(l);
            }
        }
        else if (this.id == GeneratorId.CompleteBipartite){
            if (this.attributes.length >= 2 
                && this.attributes[0] instanceof Integer 
                && this.attributes[1] instanceof Integer
            ){
                this.graph = generateCompleteBipartite(this.attributes[0].value, this.attributes[1].value);
            }
        }
        else if (this.id == GeneratorId.Grid){
            if (this.attributes.length >= 2 
                && this.attributes[0] instanceof Integer 
                && this.attributes[1] instanceof Integer
            ){
                this.graph = generateGrid(this.attributes[0].value, this.attributes[1].value);
            }
        }
        else if (this.id == "CirculantTournament"){
            if (this.attributes.length == 1 
                && this.attributes[0] instanceof ListAttribute 
            ){
                const l = this.attributes[0].value.split(" ")
                const n = l.length
                const gaps = new Array<number>();
                for (let i = 0; i < n; i ++){
                    if ( l[i] == "1"){
                        gaps.push(i+1);
                    } else {
                        gaps.push(-(i+1))
                    }
                }

                this.graph = generateCirculantTournament( n, gaps)
            }
        }

        this.updateSVG();
    }

    updateSVG(){
        // Clear SVG by removing all the childs
        const childs = new Array<ChildNode>();
        this.svg.childNodes.forEach( (child) => {
            childs.push(child);
        })
        for (const child of childs){
            this.svg.removeChild(child);
        }

        // Default width and height
        let width = 200;
        let height = 200;
        this.svg.setAttribute("width", width.toString());
        this.svg.setAttribute("height", height.toString());

        if (this.graph.vertices.size == 0){
            return;
        }

        // Compute bounding box
        let minX = 0;
        let maxX = 0;
        let minY = 0;
        let maxY = 0;

        for (const [id, v] of this.graph.vertices){
            const x = v.data.pos.x;
            const y = v.data.pos.y;
            minX = Math.min(x, minX);
            maxX = Math.max(x, maxX);
            minY = Math.min(y, minY);
            maxY = Math.max(y, maxY);
        }

        // Add margin
        minX -= 10;
        maxX += 10;
        minY -= 10;
        maxY += 10;

        const verticesCoords = new Map();

        // Add a disk for every vertex
        for (const [id, v] of this.graph.vertices){
            const x = (v.data.pos.x - minX)*width/(maxX-minX);
            const y = (v.data.pos.y - minY)*height/(maxY-minY);
            verticesCoords.set(id, [x,y]);

            const disk = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            disk.setAttribute("position", "relative")
            disk.setAttribute("cx", x.toString());
            disk.setAttribute("cy", y.toString());
            disk.setAttribute("r", "2"); 
            disk.setAttribute("fill", "black");
            this.svg.appendChild(disk);

        }

        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", "arrow-end");
        marker.setAttribute("orient", "auto")
        marker.setAttribute("markerWidth", "40");
        marker.setAttribute("markerHeight", "40");
        marker.setAttribute("refX", "25");
        marker.setAttribute("refY", "5");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M0,0 V10 L20,5 Z");
        path.setAttribute("fill", "black")
        marker.appendChild(path);


        this.svg.appendChild(marker)


        // Add a segment for every link
        for (const [id, link] of this.graph.links){
            const u = verticesCoords.get(link.startVertex.index);
            const v = verticesCoords.get(link.endVertex.index);
            if (typeof u != "undefined" && typeof v != "undefined"){
                const [startX, startY] = u;
                const [endX, endY] = v;

                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", startX.toString());
                line.setAttribute("y1", startY.toString());
                line.setAttribute("x2", endX.toString());
                line.setAttribute("y2", endY.toString());
                line.setAttribute("stroke", "black");
                line.setAttribute("stroke-width", "1");
                this.svg.appendChild(line);

                if (link.orientation == ORIENTATION.DIRECTED){
                    line.setAttribute("marker-end", "url(#arrow-end)");
                }
            }

            
        }

    }
    
}
