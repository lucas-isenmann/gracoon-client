import { ClientBoard } from "./board";
import { CanvasCoord } from "./display/canvas_coord";
import { Grid } from "./display/grid";


function addIntegerInput(element: Grid, property: string, content: HTMLDivElement, board: ClientBoard){
    const value = element.get(property);
    if (typeof value == "undefined"){
        console.log(`property ${property} does not exist on this element`);
        return;
    }

    const label = document.createElement("label");
    label.textContent = property;
    
    const input = document.createElement("input");
    input.id = "property-" + "polarDivision";
    input.type = "number";
    input.step = "1";
    input.value = value;
    input.min = "4";
    input.max = "100";
    label.htmlFor = input.id;

    input.onchange = (event: Event) => {
        element.set(property, input.value ) ;
    }

    content.appendChild(label);
    content.appendChild(input);
}

export function showProperties(element: Grid, pos: CanvasCoord, board: ClientBoard){
    console.log("show Prop");

    const d = document.getElementById("properties");
    if (d != null) d.remove();

    const div = document.createElement("div");
    div.id = "properties";
    div.style.top = (pos.y-10) + "px";
    div.style.left = (pos.x-10) + "px";

    const header = document.createElement("H1");
    header.textContent = "Grid";
    div.appendChild(header);

    const content = document.createElement("div");
    content.classList.add("properties-content");
    div.appendChild(content);

    // Specific to Grid
    addIntegerInput(element, "polarDivision", content, board);


    // onMouseOut
    // div.onmouseout = () => {
    //     div.remove();
    // }

    document.body.appendChild(div);
}


export function blurProperties(){
    const div = document.getElementById("properties");
    if (div) div.remove();
}