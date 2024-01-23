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

## Boards

Boards are permanent. 
To share a board, share the url or click on the SHARE icon to copy the link.



## Functionalities / Modes

In any mode, move the camera by dragging the cursor while holding down the right mouse button.

<img src="${svgIcons["selection"]}" class="help" />
Move and select elements. 
To select all elements in a rectangle, click on the board and describe a rectangle while keeping the CTRL key pressed.
To select a connected component of the (undirected) graph, click on a vertex while keeping the SHIFT key ⇧ pressed.
By moving a vertex over another vertex, it will merge them.

Add vertices and edges or arcs with <img src="${svgIcons["edition"]}" class="help"/> <img src="${svgIcons["arc"]}" class="help"/>. 
Use CTRL key to create paths easily.
By creating a vertex over an edge or an arc, it will subdivide the link in two.

Edges and arcs are by default rectilinear. 
To bend them, use the "control point" mode <img src="${svgIcons["control_point"]}" class="help" /> by clicking on an edge.
Use CTRL key to force the control point to be on the metdiator of the extremities of the link.
To revert the edge/arc rectilinear, click on the link to delete the control point.


<img src="${svgIcons["area"]}" class="help" />
An area is a rectangular zone on the board that is used for computing parameters only for the subgraph contained within it.


<img src="${svgIcons["text"]}" class="help"/> 
Add a text zone on the board by clicking on the board.
Text zones support LaTeX and Markdown.
Add weights on the edges/arcs/vertices of the graph by clicking on them.


The options <img src="${svgIcons["index_number_unstable"]}" class="help"/>  <img src="${svgIcons["index_number_stable"]}" class="help"/> show the indices of the vertices. Their indices are either stable <img src="${svgIcons["index_number_stable"]}" class="help"/> or unstable <img src="${svgIcons["index_number_unstable"]}" class="help"/> to vertices deletions. If they are unstable, then they are between 0 and n-1 (where n is the number of vertices of the graph).


## Parameters

Add a parameter on the whole graph or only on the subgraph induced by an area by clicking on the + button.
Most of the parameters are recomputed at each modification of the graph.
The less efficient parameters are updated only by clicking on the UPDATE button.



## Todo

- the user can code its own parameter, interactor, generator ...
- a lot of little things (loops, multi edge)
    

## Developpers

Lucas Isenmann, Jocelyn Thiebaut

    `;
    content.innerHTML = marked.parse(text);
    
}