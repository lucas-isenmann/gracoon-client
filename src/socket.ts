import { Self, update_users_canvas_pos,  User, users } from "./user";
import { ClientStroke } from "./board/stroke";
import { update_params_loaded } from "./parametors/parametor_manager";
import { ClientArea } from "./board/area";
import { update_options_graphs } from "./parametors/div_parametor";
import { init_list_parametors_for_area } from "./board/area_div";
import { get_sensibilities, SENSIBILITY } from "./parametors/parametor";
import { ClientVertexData } from "./board/vertex";
import { Coord, ORIENTATION, Vect } from "gramoloss";
import { ClientLinkData } from "./board/link";
import { ClientTextZone } from "./board/text_zone";
import { ClientBoard } from "./board/board";
import { handleServerVersion } from "./handlers/serverVersion";

import ENV from './.env.json';

import { io } from "socket.io-client";
import { Color } from "./colors_v2";

const port = ENV.port;
const adress = "http://" + ENV.serverAdress + ":" + port;
console.log("connecting to: ", adress);
export const socket = io(adress);


// console.log("Connecting to " + "ws://" + ENV.serverAdress + ":" + ENV.port);
// export const socket = new WebSocket("ws://" + ENV.serverAdress + ":" + ENV.port);


export function setup_socket(board: ClientBoard) {
    const g = board.graph;
    
    // USERS
    socket.on('server-version', handleServerVersion);
    socket.on('myId', handle_my_id);
    socket.on('room_id', handle_room_id);
    socket.on('update_room_id', handle_update_room_id);
    socket.on('update_user', update_user);
    socket.on('remove_user', remove_user);
    socket.on('clients', handle_clients);
    socket.on('update_other_self_user', update_other_self_user);
    socket.on('send_view', handle_send_view);
    socket.on('view_follower', handle_update_view_follower);

    function handle_room_id(romm_id: number){
        let url = new URL(document.URL);
        let urlsp = url.searchParams;
        let room_id = encodeURI(urlsp.get("room_id"));
        if (room_id === "null") {
            window.history.replaceState(null, null, "?room_id="+romm_id);
        }
    }

    function handle_update_room_id(new_romm_id:number){
            window.history.replaceState(null, null, "?room_id="+new_romm_id);
    }

    function handle_update_view_follower(x:number, y:number, zoom:number, id:string){
        // console.log("FOLLOWING USER:", x,y,zoom, id);
        if(users.has(id) && board.selfUser.following == id){
            // console.log("Following......")
            board.view.camera = new Coord(x, y);
            board.view.zoom = zoom;
            board.update_canvas_pos(board.view);
            update_users_canvas_pos(board.view);
            requestAnimationFrame(function () { board.draw() });
        }
        else{
            // console.log("reset....");
            board.selfUser.following = undefined;
        }
    }

    function handle_send_view(){
        // console.log("SENDING MY VIEW");
        socket.emit("my_view", board.view.camera.x, board.view.camera.y, board.view.zoom);
    }

    function update_other_self_user(id:string, label:string, color:string){
        // console.log(id, label, color);
        if (users.has(id)) {
            users.get(id).setColor(color);
            users.get(id).label = label;
        }
        else {
            users.set(id, new User(id, label, color, board.view));
        }
        board.selfUser.update_user_list_div();
        requestAnimationFrame(function () { board.draw() });
    }


    function handle_my_id(id: string, label: string, color :string) {
        let url = new URL(document.URL);
        let urlsp = url.searchParams;
        let room_id = encodeURI(urlsp.get("room_id"));
        if (room_id != "null") {
            console.log("room_id : ", room_id);
            socket.emit("change_room_to", room_id);
        }

        board.selfUser.init(id, label, color);
        board.selfUser.update_self_user_div();
    }

    function update_user(id: string, label: string, color: string, rawPos: null | {x: number, y: number}) {
        // console.log("Handle: update_user ", id, rawPos);
        const newPos: undefined | Coord = (rawPos == null ? undefined : new Coord(rawPos.x, rawPos.y));
        // console.log(newPos);
        if (board.selfUser.id == null || id == board.selfUser.id){
            return;
        }
        const user =  users.get(id);
        if (typeof user != "undefined") {
            user.label = label;
           user.set_pos(newPos, board);
        }
        else {
            users.set(id, new User(id, label, color, board.view,  newPos));
            board.selfUser.update_user_list_div();
        }
        requestAnimationFrame(function () { board.draw() });
    }


    function remove_user(userid: string) {
        if(board.selfUser.following == userid){
            board.selfUser.unfollow(userid);
        }
        users.delete(userid);
        board.selfUser.update_user_list_div();
        requestAnimationFrame(function () { board.draw() });
    }

    
    function handle_clients(users_entries: Array<[string, {label: string, color: string}]>){
        users.clear();
        for (const data of users_entries) {
            //TODO: Corriger ca: on est obligé de mettre de fausses coordonnées aux autres users à l'init car le serveur ne les stocke pas 
            const new_user = new User(data[0], data[1].label, data[1].color, board.view, new Coord(-100, -100));
            users.set(data[0], new_user);
        }
        // console.log(users);
        requestAnimationFrame(function () { board.selfUser.update_user_list_div() });
    }



    // GRAP API

    // GRAPH 
    socket.on("graph", handleResetGraph); // ALL
    socket.on("areas", handle_areas); // AREA
    socket.on("strokes", handle_strokes); // STROKES
    socket.on("reset_board", handle_reset_board);

    // Generic
    socket.on("update_element", handle_update_element);
    socket.on("add_elements", handle_add_elements);
    socket.on("delete_elements", handle_delete_elements);
    socket.on("translate_elements", handle_translate_elements);


    function handle_translate_elements(data, sensibilities){
        // console.log("handle_translate_elements", data);
        const shift = new Vect(data.shift.x, data.shift.y);
        const cshift = board.view.create_canvas_vect(shift);
        for (const [kind, index] of data.indices){
            if ( kind == "TextZone"){
                const text_zone = board.text_zones.get(index);
                text_zone.translate(cshift, board.view);
            } else if ( kind == "Stroke"){
                const stroke = board.strokes.get(index);
                stroke.translate_by_canvas_vect(cshift, board.view);
            } else if ( kind == "Area"){
                const area = board.areas.get(index);
                const vertices_contained = g.vertices_contained_by_area(area);
                board.translate_area(cshift, area, vertices_contained);
                for (const link of g.links.values()){
                    if (vertices_contained.has(link.startVertex.index) || vertices_contained.has(link.endVertex.index)){
                        link.setAutoWeightDivPos();
                    }
                }
            } else if (kind == "Vertex"){
                g.translate_vertex_by_canvas_vect(index, cshift, board.view);
                for (const link of g.links.values()){
                    if (link.startVertex.index == index || link.endVertex.index == index){
                        link.setAutoWeightDivPos();
                    }
                }
                update_params_loaded(g, new Set([SENSIBILITY.GEOMETRIC]), false);
            } else if (kind == "ControlPoint"){
                const link = g.links.get(index);
                if ( typeof link.data.cp != "undefined" && typeof link.data.cp_canvas_pos != "string"){
                    link.data.cp.translate(shift);
                    link.data.cp_canvas_pos.translate_by_canvas_vect(cshift);
                }
                link.setAutoWeightDivPos();
                update_params_loaded(g, new Set([SENSIBILITY.GEOMETRIC]), false);
            } else {
                console.log(`translate element: kind ${kind} not supported`);
            }
        }
        
        requestAnimationFrame(function () {board.draw() });
    }

    function handle_add_elements( datas, sensibilities){
        // console.log("handle_add_elements", datas);
        for(const data of datas){
            if (data.kind == "Stroke"){
                const positions = new Array<Coord>();
                data.element.positions.forEach(e => {
                    positions.push(new Coord(e.x, e.y));
                });
                const new_stroke = new ClientStroke(positions, data.element.color, data.element.width, board.view);
                board.strokes.set(data.index, new_stroke);
            } else if (data.kind == "TextZone"){
                const pos = new Coord(data.element.pos.x, data.element.pos.y);
                const width = data.element.width as number;
                const text = data.element.text as string;
                const new_text_zone = new ClientTextZone(pos, width, text , board, data.index);
                board.text_zones.set(data.index, new_text_zone);
            } else if (data.kind == "Area"){
                const c1 = new Coord(data.element.c1.x, data.element.c1.y);
                const c2 = new Coord(data.element.c2.x,data.element.c2.y);
                const new_area = new ClientArea( data.element.label, c1, c2, data.element.color, board.view);
                board.areas.set(data.index, new_area);
                init_list_parametors_for_area(board, data.index);
                //TO CHECK: I added this line here because the panels were not updated when creating a new area. Is it still how we are supposed to do it now ? 
                update_options_graphs(board);
       
            } else if (data.kind == "Vertex"){
                const x = data.element.data.pos.x as number;
                const y = data.element.data.pos.y as number;
                const weight = data.element.data.weight as string;
                const color = data.element.data.color as Color;
                const newVertex = board.graph.set_vertex(data.index, new ClientVertexData(x,y,weight, board.view, color));
                if (weight != ""){
                    newVertex.afterSetWeight(board);
                }
                update_params_loaded(g, new Set([SENSIBILITY.ELEMENT]), false);
            } else if (data.kind == "Link"){
                const startIndex = data.element.startVertex.index as number;
                const endIndex = data.element.endVertex.index as number;
                const cp = typeof data.element.data.cp == "undefined" ? undefined : new Coord(data.element.data.cp.x, data.element.data.cp.y);
                let orient = ORIENTATION.UNDIRECTED;
                if (data.element.orientation == "DIRECTED"){
                    orient = ORIENTATION.DIRECTED;
                }
                const color = data.element.data.color as Color;
                const weight = data.element.data.weight as string;

                const newLinkData = new ClientLinkData(cp, color, weight, board.view);
                const newLink = board.graph.setLink(data.index, startIndex, endIndex, orient, newLinkData);
                if (data.weight != ""){
                    newLink.afterSetWeight(board);
                }
                update_params_loaded(g, new Set([SENSIBILITY.ELEMENT]), false);
            }
        }
        
        requestAnimationFrame(function () {board.draw() });
    }

    function handle_delete_elements(data, sensibilities){
        // console.log("handle_delete_elements", data);
        for ( const element of data){
            if (element[0] == "Stroke"){
                board.strokes.delete(element[1]);
            } else if (element[0] == "TextZone"){
                const text_zone = board.text_zones.get(element[1]);
                text_zone.div.remove();
                board.text_zones.delete(element[1]);
            } else if (element[0] == "Area"){
                board.areas.delete(element[1]);
            } else if (element[0] == "Vertex"){
                board.graph.delete_vertex(element[1]);
                update_params_loaded(g, new Set([SENSIBILITY.ELEMENT]), false);
            } else if (element[0] == "Link"){
                if ( board.graph.links.has(element[1])){
                    const link = board.graph.links.get(element[1]);
                    if ( typeof link.data.weightDiv !== "undefined"){
                        link.data.weightDiv.remove();
                    }
                    board.graph.links.delete(element[1]);
                }
                update_params_loaded(g, new Set([SENSIBILITY.ELEMENT]), false);
            }
        }
        requestAnimationFrame(function () {board.draw() });
    }



    function handle_update_element(data){
        console.log("handle_update_element", data);
        if (data.kind == "TextZone"){
            const text_zone = board.text_zones.get(data.index);
            if (data.param == "width"){
                const width = data.value as number;
                text_zone.width = width;
                text_zone.div.style.width = String(width) + "px";
            }
            else if (data.param == "text"){
                if (document.activeElement.id != ("text_zone_content_" + data.index)){
                    console.log("update text zone : ", data.index);
                    const text = data.value as string;
                    text_zone.update_text(text);
                }
            }
        } else if (data.kind == "Vertex"){
            const vertex = board.graph.vertices.get(data.index);
            if(data.param == "color"){
                const color = data.value as string;
                vertex.data.color = color as Color;
            } else if (data.param == "weight"){
                if (document.activeElement.id != ("vertex_weight_" + data.index)){
                    const text = data.value as string;
                    vertex.data.weight = text;
                    vertex.afterSetWeight(board);
                }
            }
        }else if (data.kind == "Link"){
            const link = board.graph.links.get(data.index);
            if(data.param == "color"){
                const color = data.value as string;
                link.data.color = color as Color;
            } else if (data.param == "weight"){
                const weight = data.value as string;
                link.setWeight(weight);
            } else if (data.param == "cp"){
                if (typeof data.value == "undefined"){
                    link.data.cp = undefined;
                    link.data.cp_canvas_pos = "";
                } else {
                    const new_cp = new Coord(data.value.x, data.value.y);
                    link.set_cp(new_cp, board.view);
                }
                link.afterSetWeight(board);
            }
        }else if (data.kind == "Stroke"){
            const stroke = board.strokes.get(data.index);
            if(data.param == "color"){
                const color = data.value as string;
                stroke.color = color as Color;
            }
        } else if (data.kind == "Area"){
            const area = board.areas.get(data.index);
            if(data.param == "c1"){
                const new_c1 = new Coord(data.value.x , data.value.y);
                area.c1 = new_c1;
                area.update_canvas_pos(board.view);
            } else if(data.param == "c2"){
                const new_c2 = new Coord(data.value.x , data.value.y);
                area.c2 = new_c2;
                area.update_canvas_pos(board.view);
            }
        } else {
            console.log("Kind not supported :", data.kind);
        }
        requestAnimationFrame(function () {board.draw() });
    }

    function handle_reset_board(text_zones_entries){
        // console.log("handle reset board");
        board.clear();
        for (const data of text_zones_entries) {
            const pos = new Coord(data[1].pos.x, data[1].pos.y);
            const width = data[1].width as number;
            const text = data[1].text as string;
            const text_zone = new ClientTextZone(pos, width, text, board, data[0] )
            board.text_zones.set(data[0], text_zone);
        }

        requestAnimationFrame(function () { board.draw() });
    }



    function handle_strokes(data){
        // console.log(data);
        board.strokes.clear();
        for(const s of data){
            const positions = new Array<Coord>();
            s[1].positions.forEach(e => {
                positions.push(new Coord(e.x, e.y));
            });
            const new_stroke = new ClientStroke(positions, s[1].color, s[1].width, board.view);
            board.strokes.set(s[0], new_stroke);
        }
        // update_params_loaded(g,false);
        requestAnimationFrame(function () { 
            board.draw() 
        });
        
    }



    function handle_areas(data){
        let old_area_ids = new Set<number>();
        for ( const index of board.areas.keys()){
            old_area_ids.add(index);
        }

        board.areas.clear();
        for(const s of data){
            const c1 = new Coord(s[1].c1.x, s[1].c1.y);
            const c2 = new Coord(s[1].c2.x, s[1].c2.y);
            const new_area = new ClientArea( s[1].label, c1, c2, s[1].color, board.view);
            board.areas.set(s[0], new_area);
            init_list_parametors_for_area(board, s[0]);
        }

        let new_area_ids = new Set<number>();
        for ( const index of board.areas.keys()){
            new_area_ids.add(index);
        }

        for ( const index of old_area_ids){
            if (new_area_ids.has(index) == false){
                document.getElementById("area_"+ index).remove();
            }
        }
        
        update_params_loaded(g, new Set([SENSIBILITY.ELEMENT, SENSIBILITY.COLOR, SENSIBILITY.GEOMETRIC]), false);
        update_options_graphs(board);
        // console.log("update???")
        // make_list_areas(canvas, ctx, g);
        requestAnimationFrame(function () { 
            board.draw()
        });
    }



    function handleResetGraph(vertices_entries, links_entries, sensibilities) {
        console.log("Handle: resetGraph");
        console.time("resetGraph")

        // pour les vertices_entries c'est parce que on peut pas envoyer des Map par socket ...
        // edges = new_graph.edges marche pas car bizarrement ça ne copie pas les méthodes ...

        g.clear_vertices();
        for (const data of vertices_entries) {
            const vertexData = new ClientVertexData(data[1].data.pos.x, data[1].data.pos.y, data[1].data.weight, board.view, data[1].data.color as Color);
            vertexData.color = data[1].data.color;
            const newVertex = g.set_vertex(data[0], vertexData);
            if (vertexData.weight != ""){
                newVertex.afterSetWeight(board);
            }
        }

        g.clear_links();
        for (const data of links_entries) {
            const rawLink = data[1];
            let orient = ORIENTATION.UNDIRECTED;
            switch (rawLink.orientation) {
                case "UNDIRECTED":
                    orient = ORIENTATION.UNDIRECTED
                    break;
                case "DIRECTED":
                    orient = ORIENTATION.DIRECTED
                    break;
            }
            const cp = typeof rawLink.data.cp == "undefined" ? undefined : new Coord(rawLink.data.cp.x, rawLink.data.cp.y);
            const newLinkData = new ClientLinkData(cp, rawLink.data.color, rawLink.data.weight, board.view);
            // console.log("update_graph, cp ", newLinkData.cp);
            const newLink = g.setLink(data[0], rawLink.startVertex.index, rawLink.endVertex.index, orient, newLinkData);
            // console.log("update_graph, cp ", newLink.data.cp);
            if (newLinkData.weight != ""){
                newLink.afterSetWeight(board);
            }
        }

        /*
        // Console.log the graph in list of abstract links
        let s = "";
        for (const data of links_entries){
            s += "[" + data[1].start_vertex + ","  + data[1].end_vertex + "],"
        }
        console.log("[" + s + "]");
        */

        g.compute_vertices_index_string(board.view);

        init_list_parametors_for_area(board, -1);

        const sensi = get_sensibilities(sensibilities);
        update_params_loaded(g, sensi, false);
        console.timeEnd('resetGraph')
        requestAnimationFrame(function () { board.draw() });
    }

}
