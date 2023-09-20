import { param_average_degree, param_diameter, param_has_cycle, param_has_directed_cycle, param_has_proper_coloring, param_is_connected, param_is_good_weight, param_max_degree, param_min_degree, param_min_indegree, param_nb_edges, param_nb_vertices, param_number_colors, param_number_connected_comp, param_is_drawing_planar, param_wdin2, param_weighted_distance_identification, paramDelaunayConstructor, paramStretch, paramIsQuasiKernel, paramIsQKAlgoOK } from './some_parametors';
import { Parametor, SENSIBILITY } from './parametor';
import { ClientGraph } from '../board/graph';
import { createPopup } from '../popup';
import { ClientBoard } from '../board/board';
import { ParametorLoaded } from './param_loaded';



export let params_loaded = new Array<ParametorLoaded>();
export let params_available = new Array<Parametor>();


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




export function load_param(param: Parametor, board: ClientBoard, areaId: string | number) {
    console.log("load_param", param, areaId);
    // const html_id =  param.id + "_area_" + areaId;
    const paramLoaded = new ParametorLoaded(param, areaId, board)
    
    params_loaded.push(paramLoaded);
    paramLoaded.div.classList.remove("inactive_parametor");

    if(param.is_live){
        update_parametor(board.graph, paramLoaded);
        board.requestDraw();
    }
        
    toggle_list_separator(areaId, true);
}




export function update_params_loaded(g:ClientGraph, sensibilities:Set<SENSIBILITY>, force_compute?:boolean) {
    // console.log("update_params_loaded ", sensibilities);
    if(force_compute === undefined){
        force_compute = false;
    }

    for (const param of params_loaded) {
        if(!param.parametor.is_live && param.parametor.is_sensible(sensibilities)){
            invalid_parametor(param);
        }
        if((force_compute || param.parametor.is_live) && param.parametor.is_sensible(sensibilities)){
            update_parametor(g, param);
        }
        
    }
}

function invalid_parametor(param: ParametorLoaded){
    update_result_span("", param.parametor, param.resultSpan, true);
}


export function update_parametor(g:ClientGraph, param: ParametorLoaded){
    const result_span = document.getElementById("span_result_" + param.id);
    if (typeof param.areaId == "string" ){
        const result = param.parametor.compute(g, true);
        update_result_span(result, param.parametor, param.resultSpan);
    }
    else{
        const area = g.board.areas.get(param.areaId);
        if( typeof area != "undefined"){
            const result = param.parametor.compute(g.board.get_subgraph_from_area(param.areaId), true);
            update_result_span(result, param.parametor, param.resultSpan);
        }
        else{
            remove_loaded_param(param);
        }
    }
}


function update_result_span(result:string, param: Parametor, result_span:HTMLElement, invalid?:boolean){
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



function toggle_list_separator(area_id: string | number, toggle:boolean){
    const listContainerDiv = document.getElementById("param_list_container_area_"+area_id);
    if (listContainerDiv){
        if (toggle){
            listContainerDiv.style.display = "flex";
        } else{
            listContainerDiv.style.display = "none";
        }
    }
}


export function remove_loaded_param(loadedParam: ParametorLoaded) {
    for (let i = 0; i < params_loaded.length; i++) {
        if (params_loaded[i].id == loadedParam.id ) {
            params_loaded[i].div.classList.add("inactive_parametor");
            params_loaded.splice(i, 1);
            break;
        }
    }
      
    // Checking if there are loaded parametors for the area
    for (var j = 0; j < params_loaded.length; j++) {
        if (loadedParam.areaId == params_loaded[j].areaId) {
            return
        }
    }
    // If there are no more loadedParam 
    toggle_list_separator(loadedParam.areaId, false);
}


