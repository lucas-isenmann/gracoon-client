import { Option } from "gramoloss";
import { ClientBoard } from "../board/board";
import { createPopup } from "../popup";
import { GeneratorId } from "gramoloss";
import { Integer, Percentage } from "./attribute";
import { GraphGenerator } from "./generator";


const independentGenerator = new GraphGenerator(GeneratorId.IndependentCircle, "independent", [new Integer("n", 3)])
const cliqueGenerator = new GraphGenerator(GeneratorId.CliqueCircle, "clique Kn", [new Integer("n", 3)])
const randomTournament = new GraphGenerator(GeneratorId.RandomTournament, "random tournament", [new Integer("n", 3)])
const randomGNP = new GraphGenerator(GeneratorId.RandomGNP, "GNP", [new Integer("n", 3), new Percentage("p")]);
const randomStar = new GraphGenerator(GeneratorId.Star, "star", [new Integer("n", 3)])
const completeBipartite = new GraphGenerator(GeneratorId.CompleteBipartite, "Complete bipartite Knm", [new Integer("n",1),new Integer("m",1)]);
const gridGenerator = new GraphGenerator(GeneratorId.Grid, "grid", [new Integer("n (column)",1),new Integer("m (row)",1)]);
const aztecDiamondGenerator = new GraphGenerator(GeneratorId.AztecDiamond, "Aztec Diamond", [new Integer("n",1)]);

const generators_available = new Array<GraphGenerator>();
generators_available.push(independentGenerator);
generators_available.push(cliqueGenerator);
generators_available.push(randomGNP);
generators_available.push(randomStar);
generators_available.push(completeBipartite);
generators_available.push(gridGenerator);
generators_available.push(randomTournament);
generators_available.push(new GraphGenerator(GeneratorId.Paley, "Paley", [new Integer("q", 3)]));
generators_available.push(new GraphGenerator(GeneratorId.UnitDisk, "Random Unit Disk Graph", [new Integer("n", 2), new Integer("d", 0)]))
generators_available.push(aztecDiamondGenerator);
generators_available.push(new GraphGenerator(GeneratorId.UTournament, "U tournament", [new Integer("n", 3)]));




let lastGenerator: Option<GraphGenerator>;



export function setup_generators_div(canvas: HTMLCanvasElement, board: ClientBoard) {
    const [main_div, content] = createPopup("generators_div", "Generators");
    content.style.display = "flex";
    content.classList.add("scrolling_y","non_scrolling_bar");

    const generators_list_container = document.createElement("div");
    generators_list_container.id = "generators_list_container";
    generators_list_container.classList.add("scrolling_y","non_scrolling_bar");

    const search_input_container = document.createElement("div");
    search_input_container.classList.add("search_filter_container");
    generators_list_container.appendChild(search_input_container);


    const search_input = document.createElement("input");
    search_input.classList.add("search_filter");    
    search_input.type = "text";
    search_input.id = "generator_search_input";
    search_input.onkeyup = handle_search_onkeyup;
    search_input.placeholder = "Search for names...";
    search_input_container.appendChild(search_input);

    const generators_list = document.createElement("div");
    generators_list.id = "generators_list";
    content.appendChild(generators_list_container);
    generators_list_container.appendChild(generators_list);
    
     
    const generator_activated_div = document.createElement("div");
    generator_activated_div.id = "generator_configuration";
    generator_activated_div.classList.add("non_scrolling_bar", "scrolling_y");
    content.appendChild(generator_activated_div);
    const generator_activated_container_div = document.createElement("div");
    generator_activated_div.appendChild(generator_activated_container_div);

    // create list of generators
    for (const gen of generators_available) {
        const text = document.createElement("div");
        text.classList.add("generator_item");
        text.innerHTML = gen.humanName;
        text.onclick = () => {
            activate_generator_div(canvas, gen, board);
        }
        generators_list.appendChild(text)
    }
}

function turn_off_generators_div() {
    const div =  document.getElementById("generators_div");
    if (div == null) return;
    div.style.display = "none";
}

export function turn_on_generators_div() {
    const div =  document.getElementById("generators_div");
    if (div == null) return;
    div.style.display = "block";
}

function activate_generator_div(canvas: HTMLCanvasElement, gen: GraphGenerator, board: ClientBoard) {
    const div = document.getElementById("generator_configuration");
    if (div == null) return;
    div.innerHTML = ""; // TODO clear better ??

    const title = document.createElement("h2");
    title.innerText = gen.humanName;
    title.classList.add("generator_title");
    div.appendChild(title);

    for (const attribute of gen.attributes) {
        attribute.reset_inputs(board);
        const attribute_div = document.createElement("div");
        attribute_div.classList.add("attribute_container");

        // const label = document.createElement("label");
        // label.innerText = attribute.name + ": ";
        // label.classList.add("attribute_label");

        // attribute_div.appendChild(label);
        attribute_div.appendChild(attribute.div);
        div.appendChild(attribute_div);
    }

    const generate_button = document.createElement("button");
    generate_button.classList.add("generate_button_generators");
    generate_button.textContent = "Generate";
    generate_button.onclick = (e) => {

        const params = new Array();
        for ( const p of gen.attributes){
            params.push(p.value)
        }
        board.emitGenerateGraph( gen.id, params);


        // for( const attribute of gen.attributes.values() ){
        //     if( attribute.div.classList.contains("invalid")){
        //         return;
        //     }
        // }
        // board.setGraphClipboard(gen.generate(new CanvasCoord(e.pageX, e.pageY), board), new CanvasCoord(e.pageX, e.pageY) , true);
        // lastGenerator = gen;
        turn_off_generators_div();
    }
    div.appendChild(generate_button);
}




export function regenerate_graph(e: MouseEvent, board: ClientBoard){
    if ( typeof lastGenerator != "undefined"){
        // board.setGraphClipboard(lastGenerator.generate(new CanvasCoord(e.pageX, e.pageY), board), new CanvasCoord(e.pageX, e.pageY), true);
    }
}


function handle_search_onkeyup() {
    const input = <HTMLInputElement>document.getElementById('generator_search_input');
    const filter = input.value.toUpperCase();
    const div_content = document.getElementById("generators_div_content");
    if (div_content == null) return;
    const param_list = <HTMLCollectionOf<HTMLDivElement>>div_content.getElementsByClassName('generator_item');

    for (let i = 0; i < param_list.length; i++) {
        const txtValue = param_list[i].innerHTML;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            param_list[i].style.display = "";
        } else {
            param_list[i].style.display = "none";
        }
    }
}