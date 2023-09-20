import { center_canvas_on_rectangle } from "./camera";
import { COLOR_BACKGROUND } from "../draw";
import { params_available_turn_on_div } from "../parametors/div_parametor";
import { ClientBoard } from "./board";

import svgParamIcons from '../img/parametor/*.svg';
import { ClientArea } from "./area";
import { Zone } from "../parametors/zone";






export function createTitleSpanForArea(area: ClientArea):HTMLSpanElement{
    const span_area = document.createElement('span');
    span_area.classList.add("span_area_name_parametor");
    span_area.textContent = area.label;
    span_area.style.background = area.color;
    // TODO span_area.style.color = a.multicolor.contrast;
    // span_area.style.borderColor = a.multicolor.contrast;
    return span_area;
}

function createTitleSpanForWholeArea(){
    const span_area = document.createElement('span');
    span_area.classList.add("span_area_name_parametor");
    span_area.textContent = "Everything";
    span_area.style.background = "#fff";
    span_area.style.color = COLOR_BACKGROUND;
    return span_area;
}

export function setupLoadedParam(board: ClientBoard, area_DOM: HTMLDivElement, zone: Zone){
    const g = board.graph;
    const view = board.view;
    const area_id = (zone instanceof ClientArea) ? zone.index : "";

    area_DOM.id = "area_"+ area_id;
    area_DOM.classList.add("subgraph_parametors");

    const title_area_container = document.createElement("div");
    title_area_container.classList.add("title_area_container");
    title_area_container.id = "title_container_area_"+area_id;

    const load_new_parametors_button = document.createElement("img");
    load_new_parametors_button.classList.add("load_new_parametor_button");
    load_new_parametors_button.src = svgParamIcons["plus"];
    load_new_parametors_button.title = "Load a new parameter";
    load_new_parametors_button.id = "load_parametor_area_"+area_id;
    load_new_parametors_button.onclick = ((e) => {
        params_available_turn_on_div();
        // todo choose parameter for this area
    });
    title_area_container.appendChild(load_new_parametors_button);
    
    if( zone instanceof ClientArea){
        const titleDOM = createTitleSpanForArea(zone);
        titleDOM.id = "title_area_"+ area_id;
        title_area_container.appendChild(titleDOM);
        // Center on the area on click
        titleDOM.addEventListener("click",  (e)=>{
            center_canvas_on_rectangle(view, zone.canvas_corner_top_left, zone.canvas_corner_bottom_right, board);
            board.requestDraw()
        });
    }
    else{
        const titleDOM = createTitleSpanForWholeArea();
        titleDOM.id = "title_area_"+ area_id;
        title_area_container.appendChild(titleDOM);
        // Center on the graph on click
        titleDOM.addEventListener("click",  (e)=>{
            board.centerViewOnEverything();
            board.requestDraw();
        });
    }

    const expand_list_button = document.createElement("img");
    expand_list_button.classList.add("expand_button", "expanded", "hidden");
    expand_list_button.src = svgParamIcons["list"];
    expand_list_button.title = "Expand/collapse the parameter list";
    expand_list_button.id = "expand_list_area_"+area_id;
    expand_list_button.addEventListener("click", ()=>{
        expand_list_button.classList.toggle("expanded");
        const param_container = document.getElementById("param_list_container_area_"+area_id);
        if(param_container){
            // if(param_container.style.display == 'none'){
            //     param_container.style.display = "flex";
            // }
            // else{
            //     param_container.style.display = 'none'
            // }
        param_container.classList.toggle("hidden_list");
        }
    })

    title_area_container.appendChild(expand_list_button);

    area_DOM.appendChild(title_area_container);
    
    
    // const param_containerDOM = document.createElement("div");
    zone.paramsDivContainer.classList.add("param_list_container");
    zone.paramsDivContainer.id = "param_list_container_area_"+area_id;
    zone.paramsDivContainer.style.display="none";
    // for(const param of params_available){
    //     const div_parametor = init_parametor_div(param, area_id, board);
    //     if(div_parametor !== null){
    //         param_containerDOM.appendChild(div_parametor);
    //     }
    // }
    area_DOM.appendChild(zone.paramsDivContainer);

    const paramList = document.getElementById("subgraph_list");
    if (paramList != null){
        paramList.appendChild(area_DOM);

    }
}
