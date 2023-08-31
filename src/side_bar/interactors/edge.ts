// INTERACTOR EDGE

import { ORIENTATION } from "gramoloss";
import { ClientGraph } from "../../board/graph";
import { CanvasCoord } from "../../board/canvas_coord";
import { draw_circle, drawLine, real_color, draw_head } from "../../draw_basics";
import { DOWN_TYPE } from "../../interactors/interactor";
import { last_down, last_down_index } from "../../interactors/interactor_manager";
import { local_board } from "../../setup";
import { ORIENTATION_INFO } from "../element_side_bar";
import { InteractorV2 } from "../interactor_side_bar";
import { ClientVertexData } from "../../board/vertex";
import { LinkPreData } from "../../board/link";

var index_last_created_vertex = null; // est ce qu'on peut pas intégrer ça dans interactor_edge directement ?


export const edge_interactorV2 = new InteractorV2("edge", "Creating edges", "e", ORIENTATION_INFO.RIGHT, "edition", "default", new Set([DOWN_TYPE.VERTEX, DOWN_TYPE.LINK]));

edge_interactorV2.mousedown = ((canvas, ctx, g: ClientGraph, e) => {
    if (last_down == DOWN_TYPE.EMPTY) {
        local_board.view.is_link_creating = true;
        const pos = g.align_position(e, new Set(), canvas, local_board.view);

        local_board.view.link_creating_start = pos;
        local_board.view.link_creating_type = ORIENTATION.UNDIRECTED;
        const server_pos = local_board.view.create_server_coord(pos);
        local_board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", local_board.view), (response) => { index_last_created_vertex = response } );
    } 
    else if (last_down == DOWN_TYPE.LINK){
        local_board.view.is_link_creating = true;
        local_board.view.link_creating_start = e;
        local_board.view.link_creating_type = ORIENTATION.UNDIRECTED;
        const pos = local_board.view.create_server_coord(e);
        local_board.emitSubdivideLink( last_down_index, pos, (response) => { index_last_created_vertex = response } );
    } 
    else if (last_down === DOWN_TYPE.VERTEX) {
        let vertex = g.vertices.get(last_down_index);
        local_board.view.is_link_creating = true;
        local_board.view.link_creating_start = vertex.data.canvas_pos;
    }
})

edge_interactorV2.mousemove = ((canvas, ctx, g: ClientGraph, e) => {
    local_board.view.creating_vertex_pos = g.align_position(e, new Set(), canvas, local_board.view);
    return true;
})

edge_interactorV2.mouseup = ((canvas, ctx, g: ClientGraph, e) => {
    local_board.view.is_link_creating = false;
    const firstVertexIndex = (last_down == DOWN_TYPE.VERTEX) ? last_down_index : index_last_created_vertex;
    

    const vertexIndex = g.get_vertex_index_nearby(g.align_position(e, new Set(), canvas, local_board.view));
    if (vertexIndex != null){
        if ( firstVertexIndex != vertexIndex) { // there is a vertex nearby and it is not the previous one
            local_board.emit_add_element(new LinkPreData(firstVertexIndex, vertexIndex,  ORIENTATION.UNDIRECTED), (response: number) => {});
        } 
    } else {
        const link = g.nearbyLink(e);
        if (typeof link == "undefined"){
            const aligned_mouse_pos = g.align_position(e, new Set(), canvas, local_board.view);
            const server_pos = aligned_mouse_pos.toCoord(local_board.view);
            local_board.emit_add_element(new ClientVertexData(server_pos.x, server_pos.y, "", local_board.view), (response) => { 
                local_board.emit_add_element( new LinkPreData(firstVertexIndex, response, ORIENTATION.UNDIRECTED), () => {} )
            });
        }
        else {
            local_board.emitSubdivideLink(link.index, e.toCoord(local_board.view), (response) => { 
                local_board.emit_add_element( new LinkPreData(firstVertexIndex, response, ORIENTATION.UNDIRECTED), () => {} )
            });
        }
    }
    

})

edge_interactorV2.trigger = (mouse_pos: CanvasCoord) => {
    local_board.view.is_creating_vertex = true;
    local_board.view.creating_vertex_pos = mouse_pos;
}


edge_interactorV2.draw = (ctx: CanvasRenderingContext2D) => {
    if (local_board.view.is_creating_vertex){
        draw_circle(local_board.view.creating_vertex_pos, "grey", 10, 0.5, ctx);
    }
    if (local_board.view.is_link_creating) {
        drawLine(local_board.view.link_creating_start, local_board.view.creating_vertex_pos, ctx, real_color("black", local_board.view.dark_mode),4);
        if (local_board.view.link_creating_type == ORIENTATION.DIRECTED) {
            draw_head(ctx, local_board.view.link_creating_start, local_board.view.creating_vertex_pos);
        }
    }
}