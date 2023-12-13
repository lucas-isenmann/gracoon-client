import { marked } from "marked";
import { createPopup } from "../popup";
import svgIcons from '../img/icons/*.svg';

export function launchHelpPopUp(){
    const div1 = document.getElementById("help");
    if (div1){
        div1.style.display = "block";
        return;
    } 
    const [div, content] = createPopup("help", `<img src="${svgIcons["help"]}" class="help" /> Gracoon: Graph Collaborating Online`);
    div.style.display = "block";

    const text = `
**Gracoon** aims to become a tool for collaborating online on graph theoretical problems.
While it is still under developpement, the basic functionnalities (draw graphs and share the link to collaborate) work.
Some basic *parameters* and graph *generators* are already incorporated but we want to add more of them and also let the user code its own parameter.

This tool could be also used for a presentation or for educationnal purpose.

You can submit ideas or issues on the <a href="https://github.com/lucas-test/gracoon-client">github repository</a> or by mail.

## Fonctionnalities

<img src="${svgIcons["selection"]}" class="help" />
Move and select elements. You can select multiple elements in the same time with control key.

Add vertices and edges or arcs with <img src="${svgIcons["edition"]}" class="help"/> <img src="${svgIcons["arc"]}" class="help"/>. Use control key to create paths easily.

Edges and arcs are by default rectilinear. If you want to bend them, use the "control point" tool <img src="${svgIcons["control_point"]}" class="help" /> by clicking on an edge.
If you want make the edge/arc rectilinear again, right click on the control point to delete it.

<img src="${svgIcons["area"]}" class="help" />
An area is a zone in the board used for computing parameters only for the subgraph inside this area.

<img src="${svgIcons["text"]}" class="help"/> You can add text zone on the board and you can also add weights on the edges/arcs/vertices of the graph.
Text zones support LaTeX and Markdown.

The options <img src="${svgIcons["index_number_unstable"]}" class="help"/>  <img src="${svgIcons["index_number_stable"]}" class="help"/> show the indices of the vertices. Their indices are either stable <img src="${svgIcons["index_number_stable"]}" class="help"/> or unstable <img src="${svgIcons["index_number_unstable"]}" class="help"/> to vertices deletions. If they are unstable, then they are between 0 and n-1.


## Todo

- the user can code its own parameter, interactor, generator ...
- a lot of little things (loops, multi edge)
    
    `;
    content.innerHTML = marked.parse(text);
    
}