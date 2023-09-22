import { ClientLink } from '../../board/link';
import { CanvasCoord } from '../../board/display/canvas_coord';
import { DOWN_TYPE } from '../../interactors/interactor';
import { ORIENTATION_INFO } from '../element_side_bar';
import { InteractorV2 } from '../interactor_side_bar';
import { ClientVertex } from '../../board/vertex';
import { ClientBoard } from '../../board/board';
import { ELEMENT_DATA_LINK, ELEMENT_DATA_VERTEX, PointedElementData } from '../../interactors/pointed_element_data';
import { Option } from 'gramoloss';

// INTERACTOR DETECTOR

export function createDetectorInteractor(board: ClientBoard){

    const interactor = new InteractorV2(board, "detector", "DEV Tool", "d", ORIENTATION_INFO.LEFT, "detector", "default", new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK, DOWN_TYPE.STROKE]));

    const infobox = document.createElement("div");
    infobox.id = "the_infobox";
    infobox.classList.add("detector_infobox");
    document.body.appendChild(infobox);



    function set_element_infobox(pos: CanvasCoord) {
        infobox.style.display = "block";
        infobox.style.top = String(pos.y+5) + "px";
        infobox.style.left = String(pos.x+10) + "px";
    }

    function set_vertex_infobox(vertex: ClientVertex, pos: CanvasCoord){
        set_element_infobox(pos);
        infobox.innerHTML = 
        "Vertex index: " + vertex.index + "<br>" +
        "x: " + vertex.data.pos.x + "<br>" +
        "y: " + vertex.data.pos.y + "<br>"+
        "color: " + vertex.data.color + "<br>" +
        "canvas_x: " + Math.floor(vertex.data.canvas_pos.x) + "<br>" +
        "canvas_y: " + Math.floor(vertex.data.canvas_pos.y);
    }

    function set_link_infobox(link: ClientLink, pos: CanvasCoord){
        set_element_infobox(pos);
        infobox.innerHTML = JSON.stringify(link, null, "&nbsp&nbsp&nbsp").replace(/\n/g, "<br />");;
    }

    function turn_off_infobox() {
        infobox.style.display = "none";
    }



    interactor.mousemove = ((board: ClientBoard, pointed: Option<PointedElementData>, e: CanvasCoord) => {
        if (typeof pointed == "undefined") return false;

        board.clear_all_selections();
        const element = board.get_element_nearby(e, interactor.interactable_element_type);
        if ( element instanceof ELEMENT_DATA_VERTEX ){
            set_vertex_infobox(element.element, e);
            return true; 
        }
        else if ( element instanceof ELEMENT_DATA_LINK ){
            set_link_infobox(element.element, e);
            return true; 
        }
        else {
            turn_off_infobox();
            return true;
        }
        
    });

    return interactor;
}


