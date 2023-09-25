import { Parametor } from "./parametor";

import svgParamIcons from '../img/parametor/*.svg';
import { remove_loaded_param, update_parametor } from "./parametor_manager";
import { ClientBoard } from "../board/board";
import { Zone } from "./zone";
import { ClientArea } from "../board/area";
import { createPopup } from "../popup";
import { marked } from "marked";
import renderMathInElement from "../katex-auto-render/auto-render";

export class ParametorLoaded {
    parametor: Parametor;
    id: string;
    div: HTMLDivElement;
    resultSpan: HTMLSpanElement;
    zone: Zone;

    constructor(parametor: Parametor, zone: Zone, board: ClientBoard){
        this.parametor = parametor;
        this.zone = zone;
        const areaId = (zone instanceof ClientArea) ? zone.index : "";
        this.id = parametor.id + "_area_" + areaId;
        this.div = document.createElement("div");
        zone.paramsDivContainer.appendChild(this.div);
        this.resultSpan = document.createElement("span");
        this.setupDOM(board);
    }

    setupDOM(board: ClientBoard){
        const paramLoaded = this;

        let nb_hidden_buttons = 1;
        if(!this.parametor.is_live){
            nb_hidden_buttons++;
        }
        if(this.parametor.has_info){
            nb_hidden_buttons++;
        }

        // Div for the parametor
        this.div.classList.add("parametor_printed", "inactive_parametor");
        this.div.id = "param_" + this.id;

        //Div for label and result
        let div_label_and_result = document.createElement("div");
        div_label_and_result.classList.add("param_name_result_container", `hiding_buttons-${nb_hidden_buttons}`);
        this.div.appendChild(div_label_and_result);


        // Span for label
        let span_name = document.createElement('span');
        span_name.classList.add("parametor_name");
        span_name.title = this.parametor.title;
        // if(a!== null){
        //     let span_area_name = a.get_span_for_area();
        //     div_parametor.appendChild(span_area_name);
        // }
        span_name.textContent = this.parametor.short_name + (this.parametor.is_boolean?"":":");
        div_label_and_result.appendChild(span_name);



        // Span for the result
        this.resultSpan.id = "span_result_" + this.id;
        if(!this.parametor.is_boolean){
            this.resultSpan.textContent = "?";
        }
        this.resultSpan.title="Not computed yet. Click on the refresh icon to launch the computation."
        this.resultSpan.classList.add("result_span");
        if(this.parametor.is_boolean){
            this.resultSpan.classList.add("boolean_result", "inactive_boolean_result");
        }
        div_label_and_result.appendChild(this.resultSpan);



        //Div for hidden_buttons
        let div_hidden_buttons = document.createElement("div");

        div_hidden_buttons.classList.add("hidden_buttons_container", `hided_buttons-${nb_hidden_buttons}`);
        this.div.appendChild(div_hidden_buttons);



        // Reload button
        if(!this.parametor.is_live){
            let div_button = document.createElement("div");
            div_button.classList.add("hidden_button_div", "hidden_reload");

            let svg_reload_parametor = document.createElement("img");
            div_button.appendChild(svg_reload_parametor);

            svg_reload_parametor.classList.add("white_svg", "hidden_button");
            svg_reload_parametor.id = "img_reload_" + this.id;
            svg_reload_parametor.title = "Recompute parameter";
            svg_reload_parametor.src = svgParamIcons["reload"];
            svg_reload_parametor.addEventListener('click', ()=>{
                update_parametor(board.graph, paramLoaded );
                board.requestDraw();
            });
            svg_reload_parametor.classList.add("reload_img");
            div_hidden_buttons.appendChild(div_button);
        }
        else{
            let empty_reload_parametor = document.createElement("span");
            div_hidden_buttons.appendChild(empty_reload_parametor);
        }

       

        // Remove button
        let div_button = document.createElement("div");
        div_button.classList.add("hidden_button_div", "hidden_trash");

        let button = document.createElement('img');
        div_button.appendChild(button);
        button.src = svgParamIcons["trash"];
        button.classList.add("remove_param_button", "white_svg", "hidden_button");
        button.title = "Remove parameter";

        button.addEventListener('click', () => { remove_loaded_param(paramLoaded); });
        div_hidden_buttons.appendChild(div_button);


         // Info button
         if(this.parametor.has_info){
            let div_button = document.createElement("div");
            div_button.classList.add("hidden_button_div", "hidden_info");

            let svg_info_parametor = document.createElement("img");
            div_button.appendChild(svg_info_parametor);

            svg_info_parametor.classList.add("white_svg", "hidden_button");
            svg_info_parametor.id = "img_info_" + this.id;
            svg_info_parametor.title = "Information on this parameter";
            svg_info_parametor.src = svgParamIcons["info"];
            svg_info_parametor.addEventListener('click', ()=>{
                const div = document.getElementById("parameter-info-" + this.id);
                if (div){
                    div.style.display = "block";
                } else {
                    console.log("send get-parameter-info", this.parametor.id);
                    board.emitGetParameterInfo(this.parametor.id, (response: string) => {
                        const div = createPopup("parameter-info-" + this.id, this.parametor.name);
                        div.style.display = "block";
                        const popup_content = document.getElementById(div.id + "_content");
                        if (popup_content){
                            popup_content.innerHTML = marked.parse(response);
                            renderMathInElement(popup_content);
                        }
                    });
                }
                

            });
            // svg_info_parametor.classList.add("reload_img");
            div_hidden_buttons.appendChild(div_button);
        }
        // else{
        //     let empty_reload_parametor = document.createElement("span");
        //     div_hidden_buttons.appendChild(empty_reload_parametor);
        // }
    }
}