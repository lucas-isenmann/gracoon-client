import { paramAverageDegree, paramDiameter, paramHasCycle, paramHasDirectedCycle, paramIsProperColoring, paramIsConnected, param_is_good_weight, paramMaxDegree, paramMinDegree, paramMinIndegree, paramNbEdges, paramNbVertices, paramNumberColors, paramNbConnectedComp, paramIsDrawingPlanar, param_wdin2, param_weighted_distance_identification, paramDelaunayConstructor, paramStretch, paramIsQuasiKernel, paramIsQKAlgoOK, paramFVSN, paramGeomChromaticIndex, paramChromaticNumber, paramChromaticIndex, paramCliqueNumber, paramVertexCover, paramDegreeWidth, paramMinimalSpanningTree, paramMaxIndegree, paramMinOutdegree, paramMaxOutdegree } from './some_parametors';
import { Parametor, SENSIBILITY } from './parametor';
import { ClientGraph } from '../board/graph';
import { createPopup } from '../popup';
import { ClientBoard } from '../board/board';
import { ParametorLoaded } from './param_loaded';
import { Zone } from './zone';
import { ClientArea } from '../board/area';
import { ClientDegreeWidthRep } from '../board/representations/degree_width_rep';



export let params_loaded = new Array<ParametorLoaded>();
export let params_available = new Array<Parametor>();


export function setup_parametors_available() {
    params_available.push(paramNbEdges,
        paramNbVertices,
        paramHasCycle,
        paramHasDirectedCycle,
        paramIsConnected,
        paramNbConnectedComp,
        paramNumberColors,
        paramIsDrawingPlanar,
        paramMinDegree,
        paramMaxDegree,
        paramMinIndegree,
        paramMaxIndegree,
        paramMinOutdegree,
        paramMaxOutdegree,
        paramAverageDegree,
        paramIsProperColoring,
        paramMinimalSpanningTree,
        paramDiameter,
        // param_is_good_weight,
        // param_weighted_distance_identification,
        // param_wdin2,
        // paramDelaunayConstructor,
        paramStretch,
        paramIsQuasiKernel,
        paramFVSN,
        paramCliqueNumber,
        paramVertexCover,
        paramChromaticNumber,
        paramChromaticIndex,
        paramGeomChromaticIndex,
        paramDegreeWidth
        );
    
        const [div, content] = createPopup("params_available", "Parameters");
        content.innerHTML = "Add a parameter computer to the whole graph or to the graph induced by an area. Parameters that can be computed fastly are updated at each modification of the graph. Others (like clique number) must be updated by clicking on the update button."

}




export function load_param(param: Parametor, board: ClientBoard, zone: Zone) {
    console.log("load_param", param, zone.paramsDivContainer);

    board.unhighlightAll();


    // const html_id =  param.id + "_area_" + areaId;
    const paramLoaded = new ParametorLoaded(param, zone, board);

    // Unverbose all other parameters
    for (const p of params_loaded){
        p.isVerbose = false;
        p.nameSpan.classList.remove("parametor-verbose")
    }

    params_loaded.push(paramLoaded);

    paramLoaded.div.classList.remove("inactive_parametor");

    if(param.is_live){
        update_parametor(board.graph, paramLoaded);
        board.requestDraw();
    }
        
    toggleListSeparator(zone, true);

    // If ask to load degreewidth parameter, then add DW-representation
    if (param.id == "paramDW"){
        const dwRep = ClientDegreeWidthRep.fromEmbedding(board);
        board.representations.set(0, dwRep);
        board.requestDraw();
    }
}




export function update_params_loaded(g:ClientGraph, sensibilities:Set<SENSIBILITY>, force_compute?:boolean) {
    // console.log("update_params_loaded ", sensibilities);
    if(force_compute === undefined){
        force_compute = false;
    }

    for (const param of params_loaded) {
        if(!param.parametor.is_live && param.parametor.is_sensible(sensibilities)){
            invalidParametor(param);
        }
        if((force_compute || param.parametor.is_live) && param.parametor.is_sensible(sensibilities)){
            update_parametor(g, param);
        }
        
    }
}

function invalidParametor(param: ParametorLoaded){
    updateResultSpan("", param.parametor, param.resultSpan, true);
}


export function update_parametor(g:ClientGraph, param: ParametorLoaded){
    console.log("update_param")
    if ( param.zone instanceof ClientArea ){
        const result = param.parametor.compute(g.board.get_subgraph_from_area(param.zone.index), true);
        param.certificate = result[1];
        updateResultSpan(result[0], param.parametor, param.resultSpan);
        if (param.isVerbose){
            g.board.unhighlightAll();
            param.parametor.showCertificate(g, param.certificate);
        }
    }
    else{
        const result = param.parametor.compute(g, true);
        param.certificate = result[1];
        updateResultSpan(result[0], param.parametor, param.resultSpan);
        if (param.isVerbose){
            g.board.unhighlightAll();
            param.parametor.showCertificate(g, param.certificate);
        }
    }
}


function updateResultSpan(result:string, param: Parametor, resultSpan:HTMLElement, invalid?:boolean){
    if(invalid == undefined){
        invalid = false;
    }
    if(param.is_boolean){
        if(result == "true"){
            resultSpan.classList.remove("inactive_boolean_result", "false_boolean_result");
            resultSpan.classList.add("true_boolean_result");
            resultSpan.title="";
        }
        else if(result == "false") {
            resultSpan.classList.remove("inactive_boolean_result", "true_boolean_result");
            resultSpan.classList.add("false_boolean_result");
            resultSpan.title="";
        }
        else{
            resultSpan.classList.remove("false_boolean_result", "true_boolean_result");
            resultSpan.classList.add("inactive_boolean_result");
            resultSpan.title="Be careful, the result may have changed! Reload the computation.";
        }
    }
    else{
        if(invalid){
            resultSpan.classList.add("invalid_result");
            resultSpan.title="Be careful, the result may have changed! Reload the computation.";
        }
        else{
            resultSpan.textContent = result;
            resultSpan.title="";
            resultSpan.classList.remove("invalid_result");
        }
    }
}



function toggleListSeparator(zone: Zone, toggle:boolean){
    const areaId = (zone instanceof ClientArea) ? zone.index : "";
    const listContainerDiv = document.getElementById(`param_list_container_area_${areaId}`);
    if (listContainerDiv){
        if (toggle){
            listContainerDiv.style.display = "flex";
        } else{
            listContainerDiv.style.display = "none";
        }
    }
}


export function removeLoadedParam(loadedParam: ParametorLoaded, board: ClientBoard) {

    // Unhighlight all if loadedParam is verbose
    if (loadedParam.isVerbose){
        board.unhighlightAll();
        board.requestDraw();
    }

    // Search for the loadedParam and delete it
    for (let i = 0; i < params_loaded.length; i++) {
        if (params_loaded[i].id == loadedParam.id ) {
            params_loaded[i].div.classList.add("inactive_parametor");
            params_loaded.splice(i, 1);
            break;
        }
    }
      
    // Checking if there are loaded parametors for the area
    for (var j = 0; j < params_loaded.length; j++) {
        if (loadedParam.zone === params_loaded[j].zone) {
            return;
        }
    }
    // If there are no more params for the zone of loadedParam 
    toggleListSeparator(loadedParam.zone, false);
}


