import { User } from "./user";
import { ClientStroke } from "./board/stroke";
import { update_params_loaded } from "./parametors/parametor_manager";
import { ClientArea } from "./board/area";
import { update_options_graphs } from "./parametors/div_parametor";
import { SENSIBILITY } from "./parametors/parametor";
import {  Coord,  ORIENTATION, Vect } from "gramoloss";
import { ClientTextZone } from "./board/text_zone";
import { BoardElementType, ClientBoard } from "./board/board";
import { handleServerVersion } from "./handlers/serverVersion";
import { handleErrorLog } from "./handlers/errorLog";


import { io } from "socket.io-client";
import { Color } from "./board/display/colors_v2";
import { translate_by_canvas_vect } from "./board/resizable";
import { LinkElement, ShapeElement, VertexElement } from "./board/element";
import { setCurrentShape } from "./side_bar/interactors/rectangle";


const adress = import.meta.env.VITE_SERVER_ADDRESS;
console.log("connecting to: ", adress);
export const socket = io(adress);


// console.log("Connecting to " + "ws://" + ENV.serverAdress + ":" + ENV.port);
// export const socket = new WebSocket("ws://" + ENV.serverAdress + ":" + ENV.port);


export function setupHandlers(board: ClientBoard) {
    const g = board.graph;

    // GENERIC
    socket.on("error", handleErrorLog);
    
    // USERS
    socket.on('server-version', handleServerVersion);
    socket.on('myId', handleMyId);
    socket.on('room_id', handleRoomId);
    socket.on('update_room_id', handleUpdateRoomId);
    socket.on('update_user', update_user);
    socket.on('remove_user', handleRemoveUser);
    socket.on('clients', handleClients);
    socket.on('update_other_self_user', handleUpdateOtherUsers);
    socket.on('send_view', handleSendView);
    socket.on('view_follower', handleUpdateViewFollower);

    function handleRoomId(currentRoomId: number){
        console.log( `Handle: room id: ${currentRoomId}` )
        const url = new URL(document.URL);
        const uri = url.searchParams.get("room_id");
        if (uri == null) {
            window.history.replaceState(null, "", "?room_id="+currentRoomId);
        } else {
            const room_id = encodeURI(uri);
            if (room_id === "null") {
                window.history.replaceState(null, "", "?room_id="+currentRoomId);
            }
        }
        
    }

    function handleUpdateRoomId(newRoomId: number){
        console.log(`Handle: update room id ${newRoomId}`);
        window.history.replaceState(null, "", "?room_id="+newRoomId);
    }

    function handleUpdateViewFollower(x:number, y:number, zoom:number, id:string){
        // console.log("FOLLOWING USER:", x,y,zoom, id);
        if(board.otherUsers.has(id) && board.selfUser.following == id){
            // console.log("Following......")
            board.camera.camera = new Coord(x, y);
            board.camera.zoom = zoom;
            board.update_after_camera_change();
            board.requestDraw();
        }
        else{
            // console.log("reset....");
            board.selfUser.following = undefined;
        }
    }

    function handleSendView(){
        // console.log("SENDING MY VIEW");
        socket.emit("my_view", board.camera.camera.x, board.camera.camera.y, board.camera.zoom);
    }

    function handleUpdateOtherUsers(id:string, label:string, color:string){
        // console.log(id, label, color);
        const user = board.otherUsers.get(id);
        if ( typeof user != "undefined") {
            user.setColor(color);
            user.label = label;
        }
        else {
            board.otherUsers.set(id, new User(id, label, color, board.camera));
        }
        board.update_user_list_div();
        requestAnimationFrame(function () { board.draw() });
    }


    function handleMyId(id: string, label: string, color :string) {
        console.log(`Handle: my id: ${id}`)
        const url = new URL(document.URL);
        const uri = url.searchParams.get("room_id");
        if (uri != null){
            const room_id = encodeURI(uri);
            if (room_id != "null") {
                console.log("room_id : ", room_id);
                socket.emit("change_room_to", room_id);
            }
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
        const user =  board.otherUsers.get(id);
        if (typeof user != "undefined") {
            user.label = label;
           user.set_pos(newPos, board);
        }
        else {
            board.otherUsers.set(id, new User(id, label, color, board.camera,  newPos));
            board.update_user_list_div();
        }
        requestAnimationFrame(function () { board.draw() });
    }


    function handleRemoveUser(userid: string) {
        console.log(`Handle: remove user: ${userid}`)
        if(board.selfUser.following == userid){
            board.selfUser.unfollow(userid);
        }
        board.otherUsers.delete(userid);
        board.update_user_list_div();
        requestAnimationFrame(function () { board.draw() });
    }

    
    function handleClients(users_entries: Array<[string, {label: string, color: string}]>){
        board.otherUsers.clear();
        for (const data of users_entries) {
            //TODO: Corriger ca: on est obligé de mettre de fausses coordonnées aux autres users à l'init car le serveur ne les stocke pas 
            const new_user = new User(data[0], data[1].label, data[1].color, board.camera, new Coord(-100, -100));
            board.otherUsers.set(data[0], new_user);
        }
        // console.log(users);
        requestAnimationFrame(function () { board.update_user_list_div() });
    }



    // GRAP API

    // GRAPH 
    socket.on("graph", handleResetGraph); // ALL
    socket.on("areas", handleAreas); // AREA
    socket.on("strokes", handleStrokes); // STROKES
    socket.on("reset_board", handleResetBoard);

    // Generic
    socket.on("update_element", handleUpdateElement);
    socket.on("add_elements", handleAddElements);
    socket.on("delete_elements", handleDeleteElements);
    socket.on("translate_elements", handleTranslateElements);


    function handleTranslateElements(data: { shift: {x: number, y: number}, indices: [[string, number]]}, sensibilities: [SENSIBILITY]){
        // console.log("handleTranslateElements", data);
        const shift = new Vect(data.shift.x, data.shift.y);
        const cshift = board.camera.create_canvas_vect(shift);
        for (const [kind, index] of data.indices){
            if (kind == "Rectangle"){
                board.translateElement(BoardElementType.Rectangle, index, cshift);
                // const rectangle = board.rectangles.get(index);
                // if (typeof rectangle != "undefined"){
                //     translate_by_canvas_vect(rectangle, cshift, board.camera);
                // }
            } else if ( kind == "TextZone"){
                const text_zone = board.text_zones.get(index);
                if (typeof text_zone != "undefined") {
                    text_zone.translate(cshift, board.camera);
                }
            } else if ( kind == "Stroke"){
                const stroke = board.strokes.get(index);
                if (typeof stroke != "undefined"){
                    stroke.translate_by_canvas_vect(cshift, board.camera);
                }
            } else if ( kind == "Area"){
                const area = board.areas.get(index);
                if (typeof area != "undefined"){
                    const vertices_contained = g.verticesContaintedByArea(area);
                    board.translate_area(cshift, area, vertices_contained);
                    for (const link of g.links.values()){
                        if (vertices_contained.has(link.startVertex.index) || vertices_contained.has(link.endVertex.index)){
                            link.setAutoWeightDivPos();
                        }
                    }
                }
            } else if (kind == "Vertex"){
                board.translateElement(BoardElementType.Vertex, index, cshift);
                // g.translate_vertex_by_canvas_vect(index, cshift, board.camera);
                // for (const link of g.links.values()){
                //     if (link.startVertex.index == index || link.endVertex.index == index){
                //         link.setAutoWeightDivPos();
                //     }
                // }
                // update_params_loaded(g, new Set([SENSIBILITY.GEOMETRIC]), false);
            } else if (kind == "ControlPoint"){
                const link = g.links.get(index);
                if (typeof link != "undefined"){
                    if ( typeof link.data.cp != "undefined" && typeof link.data.cp_canvas_pos != "string"){
                        link.data.cp.translate(shift);
                        link.data.cp_canvas_pos.translate_by_canvas_vect(cshift);
                    }
                    link.setAutoWeightDivPos();
                    update_params_loaded(g, new Set([SENSIBILITY.GEOMETRIC]), false);
                }
                
            } else {
                console.log(`translate element: kind ${kind} not supported`);
            }
        }
        
        board.requestDraw();
    }

    function handleAddElements( datas: [{kind: string, index: number, element: any}], sensibilities: [SENSIBILITY]){
        // console.log("handleAddElements", datas);
        for(const data of datas){
            if (data.kind == "Rectangle"){
                const c1 = new Coord(data.element.c1.x, data.element.c1.y);
                const c2 = new Coord(data.element.c2.x,data.element.c2.y);
                const color = data.element.color as Color;
                new ShapeElement(board, data.index, c1, c2, color);

                for (const element of board.elements.values()){
                    if (element instanceof ShapeElement && element.serverId == data.index){
                        setCurrentShape(element);
                    }
                }
            }
             else if (data.kind == "Stroke"){
                const positions = new Array<Coord>();
                data.element.positions.forEach((e: { x: number; y: number; }) => {
                    positions.push(new Coord(e.x, e.y));
                });
                const new_stroke = new ClientStroke(positions, data.element.color, data.element.width, board.camera, data.index);
                board.strokes.set(data.index, new_stroke);
            } 
            else if (data.kind == "TextZone"){
                const pos = new Coord(data.element.pos.x, data.element.pos.y);
                const width = data.element.width as number;
                const text = data.element.text as string;
                const new_text_zone = new ClientTextZone(pos, width, text , board, data.index);
                board.text_zones.set(data.index, new_text_zone);
            } 
            else if (data.kind == "Area"){
                const c1 = new Coord(data.element.c1.x, data.element.c1.y);
                const c2 = new Coord(data.element.c2.x,data.element.c2.y);
                const new_area = new ClientArea( data.element.label, c1, c2, data.element.color, board, data.index);
                board.areas.set(data.index, new_area);
                //TO CHECK: I added this line here because the panels were not updated when creating a new area. Is it still how we are supposed to do it now ? 
                update_options_graphs(board);
       
            } 
            else if (data.kind == "Vertex"){
                const x = data.element.data.pos.x as number;
                const y = data.element.data.pos.y as number;
                const weight = data.element.data.weight as string;
                const color = data.element.data.color as Color;
                // const newVertex = board.graph.set_vertex(data.index, new ClientVertexData(x,y,weight, board.camera, color));
                // update_params_loaded(g, new Set([SENSIBILITY.ELEMENT]), false);
                // g.compute_vertices_index_string();

                new VertexElement(board, data.index, x, y, "", weight, color );
            } 
            else if (data.kind == "Link"){
                console.log("Create Link");
                const startIndex = data.element.startVertex.index as number;
                const endIndex = data.element.endVertex.index as number;
                const cp = typeof data.element.data.cp == "undefined" ? undefined : new Coord(data.element.data.cp.x, data.element.data.cp.y);
                let orient = ORIENTATION.UNDIRECTED;
                if (data.element.orientation == "DIRECTED"){
                    orient = ORIENTATION.DIRECTED;
                }
                const color = data.element.data.color as Color;
                const weight = data.element.data.weight as string;

                // const newLinkData = new ClientLinkData(cp, color, weight, board.camera);
                // const newLink = board.graph.setLink(data.index, startIndex, endIndex, orient, newLinkData);
                // update_params_loaded(g, new Set([SENSIBILITY.ELEMENT]), false);

                // Check if startIndex and endIndex vertices exist
                let startVertex: undefined | VertexElement = undefined;
                let endVertex: undefined | VertexElement = undefined;
                for (const element of board.elements.values()){
                    if (element instanceof VertexElement){
                        if (element.serverId == startIndex){
                            startVertex = element;
                        } else if (element.serverId == endIndex){
                            endVertex = element;
                        }
                    }
                }

                if (typeof startVertex != "undefined" && typeof endVertex != "undefined"){
                    new LinkElement(board, data.index, startVertex, endVertex, orient == ORIENTATION.DIRECTED, weight, color );
                }


            }
        }
        board.requestDraw();        
    }

    function handleDeleteElements(data: [[string,number]], sensibilities: [SENSIBILITY]){
        // console.log("handleDeleteElements", data);
        for ( const [kind, index] of data){
            // console.log(kind, index);
            if (kind == "Rectangle"){
                board.deleteShape(index);
            } else if ( kind == "Stroke"){
                board.strokes.delete(index);
            } else if (kind == "TextZone"){
                const textZone = board.text_zones.get(index);
                if( typeof textZone != "undefined"){
                    textZone.div.remove();
                }
                board.text_zones.delete(index);
            } else if (kind == "Area"){
                board.delete_area(index);
            } else if (kind == "Vertex"){
                board.deleteVertex(index);
                // update_params_loaded(g, new Set([SENSIBILITY.ELEMENT]), false);
            } else if (kind == "Link"){
                board.deleteLink(index);
                // update_params_loaded(g, new Set([SENSIBILITY.ELEMENT]), false);
            }
        }
        board.requestDraw();
    }



    function handleUpdateElement(data: {kind: string, param: string, index: number, value: any}){
        // console.log("handleUpdateElement", data);
        let weightUpdate = false;
        if (data.kind == "TextZone"){
            const textZone = board.text_zones.get(data.index);
            if (typeof textZone == "undefined") return;
            if (data.param == "width"){
                const width = data.value as number;
                textZone.width = width;
                textZone.div.style.width = String(width) + "px";
            }
            else if (data.param == "text"){
                if (document.activeElement != null && document.activeElement.id != ("text_zone_content_" + data.index)){
                    console.log("update text zone : ", data.index);
                    const text = data.value as string;
                    textZone.updateText(text);
                }
            }
        } else if (data.kind == "Vertex"){
            if (data.param == "color"){
                board.setColor(BoardElementType.Vertex, data.index, data.value as Color);
            }

            // const vertex = board.graph.vertices.get(data.index);
            // if (typeof vertex == "undefined") return;
            // if (data.param == "weight"){
            //     if ( (document.activeElement && typeof vertex.data.weightDiv != "undefined" && document.activeElement.id == vertex.data.weightDiv.id) == false ){
            //         const text = data.value as string;
            //         vertex.setWeight(text);
            //         weightUpdate = true;
            //     }
            // }
        }else if (data.kind == "Link"){
            if (data.param == "color"){
                board.setColor(BoardElementType.Link, data.index, data.value as Color);
            }

            const link = board.graph.links.get(data.index);
            if (typeof link == "undefined") return;
            if (data.param == "weight"){
                const weight = data.value as string;
                if ( (document.activeElement && typeof link.data.weightDiv != "undefined" && document.activeElement.id == link.data.weightDiv.id) == false ){
                    console.log("update link");
                    link.setWeight(weight);
                    weightUpdate = true;
                }
            } else if (data.param == "cp"){
                if (typeof data.value == "undefined"){
                    link.data.cp = undefined;
                    link.data.cp_canvas_pos = "";
                } else {
                    const new_cp = new Coord(data.value.x, data.value.y);
                    link.set_cp(new_cp, board.camera);
                }
                link.setAutoWeightDivPos();
            }
        }else if (data.kind == "Stroke"){
            const stroke = board.strokes.get(data.index);
            if (typeof stroke == "undefined") return;
            if(data.param == "color"){
                const color = data.value as string;
                stroke.color = color as Color;
            }
        } else if (data.kind == "Area"){
            const area = board.areas.get(data.index);
            if (typeof area == "undefined") return;
            if(data.param == "c1"){
                const new_c1 = new Coord(data.value.x , data.value.y);
                area.c1 = new_c1;
                area.update_canvas_pos(board.camera);
            } else if(data.param == "c2"){
                const new_c2 = new Coord(data.value.x , data.value.y);
                area.c2 = new_c2;
                area.update_canvas_pos(board.camera);
            }
        } else if (data.kind == "Rectangle"){
            if (data.param == "color"){
                board.setColor(BoardElementType.Rectangle, data.index, data.value as Color);
            }

            if (data.param == "c1"){
                board.setC1(data.index, data.value.x, data.value.y);
            }
            if (data.param == "c2"){
                board.setC2(data.index, data.value.x, data.value.y);
            }

            const rectangle = board.rectangles.get(data.index);
            if (typeof rectangle == "undefined") return;
            if(data.param == "c1"){
                const new_c1 = new Coord(data.value.x , data.value.y);
                rectangle.c1 = new_c1;
                rectangle.update_after_camera_change(board.camera);
            } else if(data.param == "c2"){
                const new_c2 = new Coord(data.value.x , data.value.y);
                rectangle.c2 = new_c2;
                rectangle.update_after_camera_change(board.camera);
            } else if (data.param == "color"){
                rectangle.color = data.value as Color;
            }
        } else {
            console.log("Kind not supported :", data.kind);
        }
        if (weightUpdate){
            update_params_loaded(g, new Set([SENSIBILITY.WEIGHT]), false);
        }
        board.requestDraw();
    }

    function handleResetBoard(rawTextZones: [[number, {pos: {x: number, y: number}, width: number, text: string}]], rawRectangles: [{c1: {x: number, y: number}, c2:{x: number, y: number}, color: string, index: number}]){
        console.log("[Handle] reset board");
        // board.clear();
        // for (const data of rawTextZones) {
        //     const pos = new Coord(data[1].pos.x, data[1].pos.y);
        //     const width = data[1].width as number;
        //     const text = data[1].text as string;
        //     const text_zone = new ClientTextZone(pos, width, text, board, data[0] )
        //     board.text_zones.set(data[0], text_zone);
        // }

        for (const rectangle of rawRectangles){
            const c1 = new Coord(rectangle.c1.x, rectangle.c1.y);
            const c2 = new Coord(rectangle.c2.x, rectangle.c2.y);
            const color = rectangle.color as Color;
            new ShapeElement(board, rectangle.index, c1, c2, color)
            console.log(c1, c2)
            // board.rectangles.set(rectangle.index, new ClientRectangle(c1, c2, color, board, rectangle.index));
        }


        // board.requestDraw();
    }



    function handleStrokes(data: [[number, {positions: [{x: number, y: number}], color: string, width: number}]]){
        // console.log(data);
        board.strokes.clear();
        for(const [index, rawStroke] of data){
            const positions = new Array<Coord>();
            rawStroke.positions.forEach(e => {
                positions.push(new Coord(e.x, e.y));
            });
            const new_stroke = new ClientStroke(positions, rawStroke.color as Color, rawStroke.width, board.camera, index);
            board.strokes.set(index, new_stroke);
        }
        // update_params_loaded(g,false);
        board.requestDraw();
    }



    function handleAreas(data: [[number, {c1: {x: number, y: number}, c2: {x: number, y: number}, color: string, label: string}]]){
        console.log("[Handle] reset areas")
        board.clearAreas();
        for(const [index,rawArea] of data){
            const c1 = new Coord(rawArea.c1.x, rawArea.c1.y);
            const c2 = new Coord(rawArea.c2.x, rawArea.c2.y);
            const new_area = new ClientArea( rawArea.label, c1, c2, rawArea.color, board, index);
            board.areas.set(index, new_area);
        }
        
        update_params_loaded(g, new Set([SENSIBILITY.ELEMENT, SENSIBILITY.COLOR, SENSIBILITY.GEOMETRIC]), false);
        update_options_graphs(board);
        // console.log("update???")
        board.requestDraw();
    }



    function handleResetGraph(
        rawVertices: [[number, {data: {pos: {x: number, y: number}, weight: string, color: string}}]], 
        rawLinks: [[number, {orientation: string, startVertex: {index: number}, endVertex: {index: number}, data: {cp: {x: number, y: number} | undefined , color: string, weight: string} }]], 
        sensibilities: [SENSIBILITY])
         {
        console.log("[Handle] resetGraph");
        console.time("resetGraph")

        // pour les vertices_entries c'est parce que on peut pas envoyer des Map par socket ...
        // edges = new_graph.edges marche pas car bizarrement ça ne copie pas les méthodes ...

        for (const element of board.elements.values()){
            if (element instanceof VertexElement){
                board.deleteVertex(element.serverId);
            } else if(element instanceof LinkElement) {
                board.deleteLink(element.serverId);
            }
        }

        for (const data of rawVertices) {
            new VertexElement(board, data[0], data[1].data.pos.x, data[1].data.pos.y, "", data[1].data.weight, data[1].data.color as Color)
        }

        for (const data of rawLinks) {
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
            // const newLinkData = new ClientLinkData(cp, rawLink.data.color as Color, rawLink.data.weight, board.camera);
            // const newLink = g.setLink(data[0], rawLink.startVertex.index, rawLink.endVertex.index, orient, newLinkData);

            // Check if startIndex and endIndex vertices exist

            let startVertex: undefined | VertexElement = undefined;
            let endVertex: undefined | VertexElement = undefined;
            for (const element of board.elements.values()){
                if (element instanceof VertexElement){
                    if (element.serverId == rawLink.startVertex.index){
                        startVertex = element;
                    } else if (element.serverId == rawLink.endVertex.index){
                        endVertex = element;
                    }
                }
            }

            if (typeof startVertex != "undefined" && typeof endVertex != "undefined"){
                new LinkElement(board, data[0], startVertex, endVertex, orient == ORIENTATION.DIRECTED, rawLink.data.weight, rawLink.data.color as Color);
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
        // for (const link of g.links.values()){
        //     console.log(link.startVertex.index, link.endVertex.index, link.orientation);
        // }

        g.compute_vertices_index_string();


        // TODO sensibilities is unsued
        const sensi2 = new Set<SENSIBILITY>();
        sensi2.add(SENSIBILITY.ELEMENT)
        update_params_loaded(g, sensi2, true);
        console.timeEnd('resetGraph')
        board.requestDraw();
    }

}
