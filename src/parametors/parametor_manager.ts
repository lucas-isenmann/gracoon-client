import { param_average_degree, param_diameter, param_has_cycle, param_has_directed_cycle, param_has_proper_coloring, param_is_connected, param_is_good_weight, param_max_degree, param_min_degree, param_min_indegree, param_nb_edges, param_nb_vertices, param_number_colors, param_number_connected_comp, param_is_drawing_planar, param_wdin2, param_weighted_distance_identification, paramDelaunayConstructor, paramStretch, paramIsQuasiKernel, paramIsQKAlgoOK } from './some_parametors';
import { Parametor, SENSIBILITY } from './parametor';
import { ClientGraph } from '../board/graph';
import { createPopup } from '../popup';
import { ClientBoard } from '../board/board';



export let params_loaded = []
export let params_available = []


export function setup_parametors_available() {
    params_available.push(param_nb_edges,
        param_nb_vertices,
        param_has_cycle,
        param_has_directed_cycle,
        param_is_connected,
        param_number_connected_comp,
        param_number_colors,
        param_is_drawing_planar,
        param_min_degree,
        param_max_degree,
        param_min_indegree,
        Parametor.from_function((g: ClientGraph, verbose: boolean) => String(g.min_outdegree()), "Minimum out-degree", "min_out_degree", "min_out_degree", "Minimum out-degree", true, false, new Array(SENSIBILITY.ELEMENT), false  ),
        param_average_degree,
        param_has_proper_coloring,
        param_diameter,
        param_is_good_weight,
        param_weighted_distance_identification,
        param_wdin2,
        paramDelaunayConstructor,
        paramStretch,
        paramIsQuasiKernel
        );
    
        createPopup("params_available", "Parameters")
}




export function load_param(param: Parametor, board: ClientBoard, area_id: number) {
    const html_id =  param.id + "_area_" + area_id;
    const param_to_load = {parametor:param, html_id:html_id, area_id : area_id};

    let div_parametor = document.getElementById("param_" + html_id);
    if(div_parametor !== null){
        params_loaded.push(param_to_load);
        div_parametor.classList.remove("inactive_parametor");

        if(param.is_live){
            update_parametor(board.graph, param_to_load);
            requestAnimationFrame(function () {board.draw() })
        }
        
        toggle_list_separator(area_id, true);
    }
    
}




export function update_params_loaded(g:ClientGraph, sensibilities:Set<SENSIBILITY>, force_compute?:boolean) {
    // console.log("update_params_loaded ", sensibilities);
    if(force_compute === undefined){
        force_compute = false;
    }

    for (let param of params_loaded) {
        if(!param.parametor.is_live && param.parametor.is_sensible(sensibilities)){
            const result_span = document.getElementById("span_result_" + param.html_id);
            invalid_parametor(param);
        }
        if((force_compute || param.parametor.is_live) && param.parametor.is_sensible(sensibilities)){
            update_parametor(g, param);
        }
        
    }
}

function invalid_parametor(param){
    const result_span = document.getElementById("span_result_" + param.html_id);
    update_result_span("", param.parametor, result_span, true);
}


export function update_parametor(g:ClientGraph, param){
    const result_span = document.getElementById("span_result_" + param.html_id);
    if(param.area_id == -1){
        var result = param.parametor.compute(g, true);
        update_result_span(result, param.parametor, result_span);
    }
    else{
        if(g.board.areas.has(param.area_id)){
            var result = param.parametor.compute(g.board.get_subgraph_from_area(param.area_id), true);
            update_result_span(result, param.parametor, result_span);
        }
        else{
            remove_loaded_param(param.html_id, param.area_id);
        }
    }
}


function update_result_span(result:string, param, result_span:HTMLElement, invalid?:boolean){
    if(invalid == undefined){
        invalid = false;
    }
    if(param.is_boolean){
        if(result == "true"){
            result_span.classList.remove("inactive_boolean_result", "false_boolean_result");
            result_span.classList.add("true_boolean_result");
            result_span.title="";
        }
        else if(result == "false") {
            result_span.classList.remove("inactive_boolean_result", "true_boolean_result");
            result_span.classList.add("false_boolean_result");
            result_span.title="";
        }
        else{
            result_span.classList.remove("false_boolean_result", "true_boolean_result");
            result_span.classList.add("inactive_boolean_result");
            result_span.title="Be careful, the result may have changed! Reload the computation.";
        }
    }
    else{
        if(invalid){
            result_span.classList.add("invalid_result");
            result_span.title="Be careful, the result may have changed! Reload the computation.";
        }
        else{
            result_span.textContent = result;
            result_span.title="";
            result_span.classList.remove("invalid_result");
        }
    }
}



function toggle_list_separator(area_id:number, toggle:boolean){
    const list_container_DOM = document.getElementById("param_list_container_area_"+area_id);
    if(list_container_DOM){
       if(toggle){
        list_container_DOM.style.display = "flex";
       }
       else{
        list_container_DOM.style.display = "none";
       }
    }
}


export function remove_loaded_param(param_id: string, area_id:number) {
    for (var i = 0; i < params_loaded.length; i++) {
        if (params_loaded[i].parametor.id == param_id && area_id == params_loaded[i].area_id) {
            const DOM = document.getElementById("param_" + params_loaded[i].html_id);
            //Removing DOM
            if(DOM !== null){
                DOM.classList.add("inactive_parametor");
            }
            params_loaded.splice(i, 1);
            break;
        }
    }
      
    // Checking if there are loaded parametors for the area
    for (var j = 0; j < params_loaded.length; j++) {
        if (area_id == params_loaded[j].area_id) {
            return
        }
    }
    toggle_list_separator(area_id, false);
}


