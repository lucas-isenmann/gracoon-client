import { Parametor } from "./parametor";

import svgParamIcons from '../img/parametor/*.svg';
import { params_loaded, removeLoadedParam, update_parametor } from "./parametor_manager";
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
    nameSpan: HTMLSpanElement;
    zone: Zone;
    isVerbose: boolean;
    certificate: any;

    constructor(parametor: Parametor, zone: Zone, board: ClientBoard){
        this.isVerbose = true;
        this.certificate = undefined;
        this.parametor = parametor;
        this.zone = zone;
        const areaId = (zone instanceof ClientArea) ? zone.index : "";
        this.id = parametor.id + "_area_" + areaId;
        this.div = document.createElement("div");
        this.nameSpan = document.createElement("span");
        zone.paramsDivContainer.appendChild(this.div);
        this.resultSpan = document.createElement("span");
        this.setupDOM(board);
    }

    setupDOM(board: ClientBoard){
        const paramLoaded = this;

        let nbHiddenButtons = 2; // 1 for verbose 1 for remove
        if (!this.parametor.is_live){
            nbHiddenButtons++;
        }
        if (this.parametor.has_info){
            nbHiddenButtons++;
        }

        // Div for the parametor
        this.div.classList.add("parametor_printed", "inactive_parametor");
        this.div.id = "param_" + this.id;

        //Div for label and result
        let div_label_and_result = document.createElement("div");
        div_label_and_result.classList.add("param_name_result_container", `hiding_buttons-${nbHiddenButtons}`);
        this.div.appendChild(div_label_and_result);


        // Span for label
        this.nameSpan.classList.add("parametor-verbose");
        this.nameSpan.classList.add("parametor_name");
        this.nameSpan.title = this.parametor.title;
        // if(a!== null){
        //     let span_area_name = a.get_span_for_area();
        //     div_parametor.appendChild(span_area_name);
        // }
        this.nameSpan.textContent = this.parametor.short_name + (this.parametor.is_boolean?"":":");
        div_label_and_result.appendChild(this.nameSpan);



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

        div_hidden_buttons.classList.add("hidden_buttons_container", `hided_buttons-${nbHiddenButtons}`);
        this.div.appendChild(div_hidden_buttons);

        // Verbose button
        const verboseButton = document.createElement("div");
        verboseButton.classList.add("param-button-verbose");
        verboseButton.classList.add("hidden_button_div");

        const verboseImg = document.createElement("img");
        verboseButton.appendChild(verboseImg);
        verboseImg.classList.add("param-button-verbose-img");
        verboseImg.classList.add("white_svg", "hidden_button");
        verboseImg.id = "img_verbose_" + this.id;
        verboseImg.title = "Toggle verbose";
        verboseImg.src = svgParamIcons["verbose"];
        verboseImg.addEventListener('click', ()=>{
            this.isVerbose = !this.isVerbose;
            if (this.isVerbose){
                board.unhighlightAll();
                for (const p of params_loaded){
                    if (p.id != this.id){
                        p.isVerbose = false;
                        p.nameSpan.classList.remove("parametor-verbose");
                    }
                }
                this.nameSpan.classList.add("parametor-verbose")
                this.parametor.showCertificate(board.graph, this.certificate);
                board.requestDraw();
            } else {
                this.nameSpan.classList.remove("parametor-verbose");
                board.unhighlightAll();
                board.requestDraw();
            }
        });
        div_hidden_buttons.appendChild(verboseButton);


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

        button.addEventListener('click', () => { removeLoadedParam(paramLoaded, board); });
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
                        const [div, content] = createPopup("parameter-info-" + this.id, this.parametor.name);
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