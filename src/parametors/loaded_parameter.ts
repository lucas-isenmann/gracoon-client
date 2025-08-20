import { Parametor } from "./parametor";
import { ClientBoard } from "../board/board";
import { createPopup } from "../popup";
import { marked } from "marked";
import renderMathInElement from "../katex-auto-render/auto-render";
import { paramsLoaded, removeLoadedParam, updateLoadedParameter } from "./parameters_list_div";

export class ParametorLoaded {
    parametor: Parametor;
    id: string;
    div: HTMLDivElement = document.createElement("div");
    resultSpan: HTMLSpanElement = document.createElement("span");
    nameSpan: HTMLSpanElement = document.createElement("span");
    isVerbose: boolean = true;
    certificate: any = undefined;

    constructor(parametor: Parametor, board: ClientBoard){
        this.parametor = parametor;
        this.id = parametor.id;

        board.loadedParametersDiv.appendChild(this.div);


        const paramLoaded = this;

        let nbHiddenButtons = 2; // 1 for verbose 1 for remove
        if (!this.parametor.is_live){
            nbHiddenButtons++;
        }
        if (this.parametor.has_info){
            nbHiddenButtons++;
        }

        // Div for the parametor
        this.div.classList.add("loaded-parameter", "inactive_parametor");
        this.div.id = "param_" + this.id;

        // Div for label and result
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



        // Div for hidden_buttons
        const divHiddenButtons = document.createElement("div");

        divHiddenButtons.classList.add("hidden_buttons_container", `hided_buttons-${nbHiddenButtons}`);
        this.div.appendChild(divHiddenButtons);

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
        verboseImg.src = "/img/parametor/verbose.svg";
        verboseImg.addEventListener('click', ()=>{
            this.isVerbose = !this.isVerbose;
            if (this.isVerbose){
                board.unhighlightAll();
                for (const p of paramsLoaded){
                    if (p.id != this.id){
                        p.isVerbose = false;
                        p.nameSpan.classList.remove("parametor-verbose");
                    }
                }
                this.nameSpan.classList.add("parametor-verbose")
                this.parametor.showCertificate(board, this.certificate);
            } else {
                this.nameSpan.classList.remove("parametor-verbose");
                board.unhighlightAll();
            }
        });
        divHiddenButtons.appendChild(verboseButton);


        // Reload button
        if(!this.parametor.is_live){
            let divButton = document.createElement("div");
            divButton.classList.add("hidden_button_div", "hidden_reload");

            let svgReloadParametor = document.createElement("img");
            divButton.appendChild(svgReloadParametor);

            svgReloadParametor.classList.add("white_svg", "hidden_button");
            svgReloadParametor.id = "img_reload_" + this.id;
            svgReloadParametor.title = "Recompute parameter";
            svgReloadParametor.src = "/img/parametor/reload.svg";
            svgReloadParametor.addEventListener('click', ()=>{
                updateLoadedParameter(board, paramLoaded );
            });
            svgReloadParametor.classList.add("reload_img");
            divHiddenButtons.appendChild(divButton);
        }
        else{
            let empty_reload_parametor = document.createElement("span");
            divHiddenButtons.appendChild(empty_reload_parametor);
        }

       

        // Remove button
        const divButton = document.createElement("div");
        divButton.classList.add("hidden_button_div", "hidden_trash");

        const button = document.createElement('img');
        divButton.appendChild(button);
        button.src = "/img/parametor/trash.svg";
        button.classList.add("remove_param_button", "white_svg", "hidden_button");
        button.title = "Remove parameter";

        button.addEventListener('click', () => { removeLoadedParam(paramLoaded, board); });
        divHiddenButtons.appendChild(divButton);


         // Info button
         if(this.parametor.has_info){
            const divButton = document.createElement("div");
            divButton.classList.add("hidden_button_div", "hidden_info");

            const svgInfoParametor = document.createElement("img");
            divButton.appendChild(svgInfoParametor);

            svgInfoParametor.classList.add("white_svg", "hidden_button");
            svgInfoParametor.id = "img_info_" + this.id;
            svgInfoParametor.title = "Information on this parameter";
            svgInfoParametor.src = "/img/parametor/info.svg";
            svgInfoParametor.addEventListener('click', ()=>{
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
                            (async () => {
                                popup_content.innerHTML = await marked.parse(response);
                                renderMathInElement(popup_content);
                            })();
                        }
                    });
                }
                

            });
            // svg_info_parametor.classList.add("reload_img");
            divHiddenButtons.appendChild(divButton);
        }
        // else{
        //     let empty_reload_parametor = document.createElement("span");
        //     div_hidden_buttons.appendChild(empty_reload_parametor);
        // }
    }

}