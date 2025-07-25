import { Option } from "gramoloss";
import { ClientBoard } from "../board/board";
import { createPopup } from "../popup";
import { GeneratorId } from "gramoloss";
import { Integer, ListAttribute, Percentage } from "./attribute";
import { GraphGenerator } from "./generator";
import { CanvasCoord } from "../board/display/canvas_coord";
import { INTERACTOR_TYPE } from "../interactors/interactor";


const randomTournament = new GraphGenerator(GeneratorId.RandomTournament, "Random tournament", [new Integer("n", 5, 3)])
const randomGNP = new GraphGenerator(GeneratorId.RandomGNP, "Random GNP", [new Integer("n", 20, 3), new Percentage("p")]);
const completeBipartite = new GraphGenerator(GeneratorId.CompleteBipartite, "Complete bipartite Knm", [new Integer("n",3, 1),new Integer("m",2, 1)]);
const gridGenerator = new GraphGenerator(GeneratorId.Grid, "Grid", [new Integer("n (column)",3, 1),new Integer("m (row)",2, 1)]);
const aztecDiamondGenerator = new GraphGenerator(GeneratorId.AztecDiamond, "Aztec Diamond", [new Integer("n",3,1)]);

const generators_available = new Array<GraphGenerator>();
generators_available.push(
    new GraphGenerator("DClub", "Random d-Club", [new Integer("n", 6, 1), new Integer("d", 2, 1)]),
    new GraphGenerator(GeneratorId.UnitDisk, "Random Unit Disk Graph", [new Integer("n", 30,1), new Integer("d", 20, 0)]),
    new GraphGenerator("CirculantTournament", "Circulant Tournament", [new ListAttribute("0/1 list", "1 0")]),
    new GraphGenerator(GeneratorId.IndependentCircle, "Independent", [new Integer("n", 5, 3)]), 
    new GraphGenerator(GeneratorId.CliqueCircle, "Clique Kn", [new Integer("n", 5, 3)]), 
    randomGNP,
    new GraphGenerator(GeneratorId.Star, "star", [new Integer("n", 5, 3)]),
    completeBipartite,
    new GraphGenerator(GeneratorId.CompleteMultipartite, "Complete Multipartite", [new Integer("n", 4,1), new Integer("k", 3, 1)]),
    gridGenerator,
    randomTournament,
    new GraphGenerator(GeneratorId.Paley, "Paley", [new Integer("q", 3, 3)]),
    aztecDiamondGenerator,
    new GraphGenerator(GeneratorId.UGTournament, "UG tournament", [new Integer("n", 3, 1), new Integer("k", 1, 0)]));




let lastGenerator: Option<GraphGenerator>;



export function setup_generators_div(canvas: HTMLCanvasElement, board: ClientBoard) {
    const [main_div, content] = createPopup("generators_div", "Generators");
    content.style.display = "flex";
    content.classList.add("scrolling_y","non_scrolling_bar");

    const generatorsListContainer = document.createElement("div");
    generatorsListContainer.id = "generators_list_container";
    generatorsListContainer.classList.add("scrolling_y","non_scrolling_bar");

    const search_input_container = document.createElement("div");
    search_input_container.classList.add("search_filter_container");
    generatorsListContainer.appendChild(search_input_container);


    const searchInput = document.createElement("input");
    searchInput.classList.add("search_filter");    
    searchInput.type = "text";
    searchInput.id = "generator_search_input";
    searchInput.onkeyup = handleSearchOnKeyup;
    searchInput.placeholder = "Search for names...";
    search_input_container.appendChild(searchInput);

    const generators = document.createElement("div");
    generators.id = "generators_list";
    content.appendChild(generatorsListContainer);
    generatorsListContainer.appendChild(generators);
    
     
    const generator_activated_div = document.createElement("div");
    generator_activated_div.id = "generator_configuration";
    generator_activated_div.classList.add("non_scrolling_bar", "scrolling_y");
    content.appendChild(generator_activated_div);
    const generator_activated_container_div = document.createElement("div");
    generator_activated_div.appendChild(generator_activated_container_div);

    // Create list of generators
    for (const gen of generators_available) {
        const text = document.createElement("div");
        text.classList.add("generator_item");
        text.innerHTML = gen.humanName;
        text.onclick = () => {
            activateGeneratorDiv(canvas, gen, board);
        }
        generators.appendChild(text)
    }
}


function turnOffGeneratorsDiv() {
    const div =  document.getElementById("generators_div");
    if (div == null) return;
    div.style.display = "none";
}

export function turn_on_generators_div() {
    const div =  document.getElementById("generators_div");
    if (div == null) return;
    div.style.display = "block";
}

function activateGeneratorDiv(canvas: HTMLCanvasElement, gen: GraphGenerator, board: ClientBoard) {
    const div = document.getElementById("generator_configuration");
    if (div == null) return;
    div.innerHTML = ""; // TODO clear better ??

    const title = document.createElement("h2");
    title.innerText = gen.humanName;
    title.classList.add("generator_title");
    div.appendChild(title);

    for (const attribute of gen.attributes) {
        attribute.reset_inputs(board);
        const attributeDiv = document.createElement("div");
        attributeDiv.classList.add("attribute_container");

        // const label = document.createElement("label");
        // label.innerText = attribute.name + ": ";
        // label.classList.add("attribute_label");

        // attributeDiv.appendChild(label);
        attributeDiv.appendChild(attribute.div);
        div.appendChild(attributeDiv);
    }

    // Graph preview
    const preview = gen.svg;
    div.appendChild(preview)



    // Generate Button
    const generateButton = document.createElement("button");
    generateButton.classList.add("generate_button_generators");
    generateButton.textContent = "Generate";
    generateButton.onclick = (e) => {

        const params = new Array();
        for ( const p of gen.attributes){
            params.push(p.value)
        }
        // board.emitGenerateGraph( gen.id, params);


        for( const attribute of gen.attributes.values() ){
            if( attribute.div.classList.contains("invalid")){
                return;
            }
        }

        const selectionInteractor = board.interactors.get(INTERACTOR_TYPE.SELECTION);
        if (typeof selectionInteractor != "undefined"){
            console.log("Load Interactor: Selection")
            selectionInteractor.select()
        }
        
        const mousePos = new CanvasCoord(e.pageX, e.pageY, board.camera);
        board.addGraphToClipboard(gen.graph, mousePos)
        // lastGenerator = gen;
        turnOffGeneratorsDiv();
    }
    div.appendChild(generateButton);
}




export function regenerate_graph(e: MouseEvent, board: ClientBoard){
    if ( typeof lastGenerator != "undefined"){
        // board.setGraphClipboard(lastGenerator.generate(new CanvasCoord(e.pageX, e.pageY), board), new CanvasCoord(e.pageX, e.pageY), true);
    }
}


function handleSearchOnKeyup() {
    const input = <HTMLInputElement>document.getElementById('generator_search_input');
    const filter = input.value.toUpperCase();
    const divContent = document.getElementById("generators_div_content");
    if (divContent == null) return;
    const elements = <HTMLCollectionOf<HTMLDivElement>>divContent.getElementsByClassName('generator_item');

    for (let i = 0; i < elements.length; i++) {
        const txtValue = elements[i].innerHTML;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            elements[i].style.display = "";
        } else {
            elements[i].style.display = "none";
        }
    }
}