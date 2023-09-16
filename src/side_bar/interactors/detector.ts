import { Coord } from 'gramoloss';
import { ClientLink } from '../../board/link';
import { CanvasCoord } from '../../board/canvas_coord';
import { DOWN_TYPE } from '../../interactors/interactor';
import { ORIENTATION_INFO } from '../element_side_bar';
import { InteractorV2 } from '../interactor_side_bar';
import { ClientVertex } from '../../board/vertex';
import { ClientBoard } from '../../board/board';

// INTERACTOR DETECTOR

export class DetectorInteractor extends InteractorV2 {

    constructor(board: ClientBoard)
    {
        super(board, "detector", "DEV Tool", "d", ORIENTATION_INFO.LEFT, "detector", "default", new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK, DOWN_TYPE.STROKE]));

        const infobox = document.createElement("div");
        infobox.id = "the_infobox";
        infobox.classList.add("detector_infobox");
        document.body.appendChild(infobox);
        let is_infobox_displayed = false;



        function set_element_infobox(pos: Coord) {
            is_infobox_displayed = true;
            infobox.style.display = "block";
            infobox.style.top = String(pos.y+5) + "px";
            infobox.style.left = String(pos.x+10) + "px";
        }

        function set_vertex_infobox(index: number, vertex: ClientVertex, pos: Coord){
            set_element_infobox(pos);
            infobox.innerHTML = 
            "Vertex index: " + index + "<br>" +
            "x: " + vertex.data.pos.x + "<br>" +
            "y: " + vertex.data.pos.y + "<br>"+
            "color: " + vertex.data.color + "<br>" +
            "canvas_x: " + Math.floor(vertex.data.canvas_pos.x) + "<br>" +
            "canvas_y: " + Math.floor(vertex.data.canvas_pos.y);
        }

        function set_link_infobox(link: ClientLink, pos: Coord){
            set_element_infobox(pos);
            infobox.innerHTML = JSON.stringify(link, null, "&nbsp&nbsp&nbsp").replace(/\n/g, "<br />");;
        }

        function turn_off_infobox() {
            is_infobox_displayed = false;
            infobox.style.display = "none";
        }



        this.mousemove = ((board: ClientBoard, e: CanvasCoord) => {
            board.clear_all_selections();
            const element = board.get_element_nearby(e, this.interactable_element_type);
            switch (element.type) {
                case DOWN_TYPE.VERTEX:
                    const vertex = board.graph.vertices.get(element.index);
                    set_vertex_infobox(element.index, vertex, e);
                    vertex.data.is_selected = true;
                    return true;
                case DOWN_TYPE.STROKE:
                    const stroke = board.strokes.get(element.index);
                    stroke.is_selected = true;
                    return true;
                case DOWN_TYPE.LINK:
                    const link = board.graph.links.get(element.index);
                    set_link_infobox(link, e);
                    link.data.is_selected = true;
                    return true;
            }
            turn_off_infobox();
            return true;
        });


    }
}


