import { ClientBoard } from '../board/board';
import { createPopup } from '../popup';
import { ParametorLoaded } from './loaded_parameter';
import { Parametor, SENSIBILITY } from './parametor';
import { paramNbVertices, paramNbEdges, paramNumberArcs, paramNumberLinks, paramGirth, paramHasCycle, paramHasDirectedCycle, paramIsConnected, paramNbConnectedComp, paramNumberColors, paramMinDegree, paramMaxDegree, paramMinIndegree, paramMaxIndegree, paramMinOutdegree, paramMaxOutdegree, paramAverageDegree, paramIsProperColoring, paramDS, paramIDS, paramCDS, paramCliqueNumber, paramVertexCover, paramChromaticNumber, paramChromaticIndex, paramDichromaticNumber, paramIsLight, paramHasLightExtension } from './some_parametors';


export let paramsLoaded = new Array<ParametorLoaded>();
const paramsAvailable = new Array<Parametor>();




export function setupParametersListDiv(board: ClientBoard) {
    paramsAvailable.push(
        paramNbVertices,
        paramNbEdges,
        paramNumberArcs,
        paramNumberLinks,
        paramGirth,
        paramHasCycle,
        paramHasDirectedCycle,
        paramIsConnected,
        paramNbConnectedComp,
        paramNumberColors,
        paramMinDegree,
        paramMaxDegree,
        paramMinIndegree,
        paramMaxIndegree,
        paramMinOutdegree,
        paramMaxOutdegree,
        paramAverageDegree,
        paramIsProperColoring,
        paramDS,
        paramIDS,
        paramCDS,
        paramCliqueNumber,
        paramVertexCover,
        paramChromaticNumber,
        paramChromaticIndex,
        paramDichromaticNumber,
        paramIsLight,
        paramHasLightExtension
        );
    
    const [_, div] = createPopup("params_available", "Parameters");
    div.innerHTML = "Add a parameter computer to the whole graph or to the graph induced by an area. Parameters that can be computed fastly are updated at each modification of the graph. Others (like clique number) must be updated by clicking on the update button."
    

    // Search Input
    const searcInputContainer = document.createElement("div");
    searcInputContainer.classList.add("search_filter_container");
    div.appendChild(searcInputContainer);

    const searchInput = document.createElement("input");
    searchInput.classList.add("search_filter");
    searchInput.type = "text";
    searchInput.id = "param_search_input";
    searchInput.onkeyup = handleSearchOnkeyup;
    searchInput.placeholder = "Search for names...";
    searcInputContainer.appendChild(searchInput);

    // For every Parameter add a div
    for (const param of paramsAvailable) {
        const paramDiv = document.createElement("div");
        paramDiv.id = `param_div_${param.id}`;
        paramDiv.classList.add("param_container");
        const paramLabelDiv = document.createElement("div");
        paramLabelDiv.classList.add("param")
        paramLabelDiv.id = `param_div_label_${param.id}`;
        paramLabelDiv.innerHTML = param.name

        paramLabelDiv.onclick = function () { loadParam(param, board); hideParametersListDiv(); }
        div.appendChild(paramDiv);
        paramDiv.appendChild(paramLabelDiv);
    }
}



function handleSearchOnkeyup() {
    const input = <HTMLInputElement>document.getElementById('param_search_input');
    const filter = input.value.toUpperCase();
    const divContent = document.getElementById("params_available_content");
    if (divContent){
        const paramList = <HTMLCollectionOf<HTMLDivElement>>divContent.getElementsByClassName('param');

        for (let i = 0; i < paramList.length; i++) {
            const txtValue = paramList[i].innerHTML;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                paramList[i].style.display = "";
            } else {
                paramList[i].style.display = "none";
            }
        }
    }
}


export function hideParametersListDiv() {
    const div = document.getElementById("params_available");
    if (div == null) return;
    div.style.display = "none"
}

export function showParametersListDiv() {
    const div = document.getElementById("params_available");
    if (div == null) return;
    div.style.display = "block"
}


function toggle_list_graph_option(param:Parametor, board: ClientBoard){
    loadParam(param, board);
    hideParametersListDiv(); 
    
}








export function loadParam(param: Parametor, board: ClientBoard) {
    board.unhighlightAll();

    const paramLoaded = new ParametorLoaded(param, board);

    // Unverbose all other parameters
    for (const p of paramsLoaded){
        p.isVerbose = false;
        p.nameSpan.classList.remove("parametor-verbose")
    }

    paramsLoaded.push(paramLoaded);

    paramLoaded.div.classList.remove("inactive_parametor");

    if(param.is_live){
        updateLoadedParameter(board, paramLoaded);
    }
        

    // // If ask to load degreewidth parameter, then add DW-representation
    // if (param.id == "paramDW"){
    //     const dwRep = ClientDegreeWidthRep.fromEmbedding(board);
    //     // board.representations.set(0, dwRep);
    // }
}





export function updateParamsLoaded(board: ClientBoard, sensibilities:Set<SENSIBILITY>, force_compute?:boolean) {
    // console.log("update_params_loaded ", sensibilities);
    if(force_compute === undefined){
        force_compute = false;
    }

    for (const param of paramsLoaded) {
        if(!param.parametor.is_live && param.parametor.is_sensible(sensibilities)){
            invalidParametor(param);
        }
        if((force_compute || param.parametor.is_live) && param.parametor.is_sensible(sensibilities)){
            updateLoadedParameter(board, param);
        }
        
    }
}

function invalidParametor(param: ParametorLoaded){
    updateResultSpan("", param.parametor, param.resultSpan, true);
}


export function updateLoadedParameter(board: ClientBoard, param: ParametorLoaded){
    console.log("update_param")
    const result = param.parametor.compute(board.g, true);
    param.certificate = result[1];
    updateResultSpan(result[0], param.parametor, param.resultSpan);
    if (param.isVerbose){
        board.unhighlightAll();
        param.parametor.showCertificate(board, param.certificate);
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



function toggleListSeparator(toggle:boolean){
    const areaId = "";
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
    }

    // Search for the loadedParam and delete it
    for (let i = 0; i < paramsLoaded.length; i++) {
        if (paramsLoaded[i].id == loadedParam.id ) {
            paramsLoaded[i].div.classList.add("inactive_parametor");
            paramsLoaded.splice(i, 1);
            break;
        }
    }
      
   
    // If there are no more params for the zone of loadedParam 
    toggleListSeparator(false);
}


