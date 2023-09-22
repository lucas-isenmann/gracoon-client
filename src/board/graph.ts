import { View } from "./camera";
import { ClientVertex, ClientVertexData } from "./vertex";
import { CanvasCoord } from "./canvas_coord";
import { ClientLink, ClientLinkData } from "./link";
import { BasicGraph, Coord,  ORIENTATION, Vect, Option, linesIntersection, bezier_curve_point, Vertex, Link } from "gramoloss";
import { CanvasVect } from "./canvasVect";
import { draw_circle, draw_head } from "../draw_basics";
import { DOWN_TYPE } from "../interactors/interactor";
import { angleAround, auxCombMap, comparePointsByAngle, coordToSVGcircle, curvedStanchionUnder2, h2FromEdgeLength, hFromEdgeLength, pathToSVGPath, QuarterPoint, segmentToSVGLine } from "./stanchion";
import { Color, getCanvasColor } from "../colors_v2";
import { ClientBoard } from "./board";





export class ClientGraph extends BasicGraph<ClientVertexData, ClientLinkData> {
    vertices: Map<number, ClientVertex>;
    links: Map<number, ClientLink>;
    board: ClientBoard;

    constructor(board: ClientBoard) {
        super();
        this.board = board;
        this.vertices = new Map<number, ClientVertex>();
        this.links = new Map<number, ClientLink>()
    }


    set_vertex(index: number, vertexData: ClientVertexData): ClientVertex {
        const newVertex = new ClientVertex(index, vertexData, this.board);
        this.vertices.set(index, newVertex);
        return newVertex;
    }

    setLink(index: number, startIndex: number, endIndex: number, orientation: ORIENTATION, linkData: ClientLinkData): Option<ClientLink> {
        const startVertex = this.vertices.get(startIndex);
        const endVertex = this.vertices.get(endIndex);
        if (typeof startVertex === "undefined" || typeof endVertex === "undefined"){
            return undefined;
        }
        const newLink = new ClientLink(index, startVertex, endVertex, orientation, linkData, this.board);
        this.links.set(index, newLink);
        return newLink;
    }


    override delete_vertex(index: number){
        const vertex = this.vertices.get(index);
        if ( typeof vertex == "undefined") return;
        if (typeof vertex.data.weightDiv != "undefined"){
            vertex.data.weightDiv.remove();
        }
        for (const link of this.links.values()){
            if (link.startVertex.index == vertex.index || link.endVertex.index == vertex.index){
                if(typeof link.data.weightDiv != "undefined"){
                    link.data.weightDiv.remove()
                }
            }
        }
        super.delete_vertex(index);
    }

    /**
     * Draw the graph on the context.
     */
    draw(){
        this.drawLinks(this.board.ctx);
        this.drawVertices(this.board.ctx);
    }

    /**
     * Draw the vertices of the graph.
     */
    drawVertices(ctx: CanvasRenderingContext2D){
        for (const v of this.vertices.values()) {
            v.draw(this.board);
        }
    }

    /**
     * Draw the links of the graph.
     */
    drawLinks(ctx: CanvasRenderingContext2D) {
        for (const link of this.links.values()) {
            const u = link.startVertex;
            const v = link.endVertex;

            const posu = u.data.canvas_pos; 
            const posv = v.data.canvas_pos; 
            const poscp = link.data.cp_canvas_pos;
            const color = getCanvasColor(link.data.color, this.board.isDarkMode());

            const isMouseOver = (this.board.elementOver instanceof ClientLink && this.board.elementOver.index == link.index);

            if (link.data.is_selected || isMouseOver) {
                ctx.strokeStyle = color;
                if (isMouseOver){
                    ctx.globalAlpha = 0.5;
                }
                ctx.beginPath();
                ctx.moveTo(posu.x, posu.y);
                ctx.lineWidth = 8;
                if (isMouseOver){
                    ctx.lineWidth = 12;
                }

                if ( typeof poscp == "string"){
                    ctx.lineTo(posv.x, posv.y);
                }else {
                    ctx.quadraticCurveTo(poscp.x, poscp.y, posv.x, posv.y);
                    //ctx.bezierCurveTo(poscp.x, poscp.y, poscp.x, poscp.y, posv.x, posv.y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            ctx.beginPath();
            ctx.moveTo(posu.x, posu.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            if ( typeof poscp == "string"){
                ctx.lineTo(posv.x, posv.y);
            }else {
                ctx.quadraticCurveTo(poscp.x, poscp.y, posv.x, posv.y);
                //ctx.bezierCurveTo(poscp.x, poscp.y, poscp.x, poscp.y, posv.x, posv.y);
            }
            ctx.stroke();

            
        if (typeof poscp != "string"){
                if ( typeof this.board.interactorLoaded != "undefined" && this.board.interactorLoaded.interactable_element_type.has(DOWN_TYPE.CONTROL_POINT)){
                    draw_circle(poscp, "grey", 4, 1, ctx);
                }
            }
            if (link.orientation == ORIENTATION.DIRECTED) {
                let cp = posu.middle(posv);
                if (typeof poscp != "string"){
                    cp = poscp
                }
                draw_head(ctx, cp, posv, this.board.getIndexType());
            }
        }
    }



    translate_by_canvas_vect(shift: CanvasVect, view: View){
        for ( const vertex of this.vertices.values()){
            vertex.translate_by_canvas_vect(shift, view);
        }
        for ( const link of this.links.values()){
            link.translate_cp_by_canvas_vect(shift, view);
        }
    }

    translateByServerVect(shift: Vect, view: View){
        for ( const vertex of this.vertices.values()){
            vertex.translate_by_server_vect(shift, view);
        }
        for ( const link of this.links.values()){
            link.translateByServerVect(shift, view);
        }
    }

    /**
     * Converts the graph into a ClientGraph.
     * It does not clone the elements.
     */
    static fromGraph(g: BasicGraph<ClientVertexData, ClientLinkData>, board: ClientBoard): ClientGraph{
        const newGraph = new ClientGraph(board);
        for( const [index, vertex] of g.vertices){
            newGraph.set_vertex(index, vertex.data);
        }
        for (const [index, link] of g.links){
            newGraph.setLink(index, link.startVertex.index, link.endVertex.index, link.orientation, link.data);
        }
        return newGraph;
    }

    // clone(): ClientGraph {
    //     const newGraph = new ClientGraph();
    //     for( const [index, vertex] of this.vertices){
    //         newGraph.set_vertex(index, vertex.clone());
    //     }
    //     for (const [index, link] of this.links){
    //         newGraph.setLink(index, link.clone());
    //     }
    //     return newGraph;
    // }



    deselect_all_vertices() {
        this.vertices.forEach(vertex => {
            vertex.data.is_selected = false;
        });
    }

    deselect_all_links() {
        this.links.forEach(link => {
            link.data.is_selected = false;
        });
    } 
    
    



    

    get_vertex_index_nearby(pos: CanvasCoord) {
        for (const [index, v] of this.vertices.entries()) {
            if (v.is_nearby(pos, 150)) {
                return index;
            }
        }
        return null;
    }


    select_vertices_in_rect(corner1: CanvasCoord, corner2: CanvasCoord) {
        for (const vertex of this.vertices.values()) {
            if (vertex.is_in_rect(corner1, corner2)) {
                vertex.data.is_selected = true;
            }
        }
    }

    select_links_in_rect(corner1: CanvasCoord, corner2: CanvasCoord) {
        for (const [index, link] of this.links.entries()) {
            if (link.is_in_rect(corner1, corner2)) {
                link.data.is_selected = true;
            }
        }
    }

    is_click_over_link(link_index: number, e: CanvasCoord, view: View) {
        const link = this.links.get(link_index);
        if (typeof link == "undefined") return;
        const v = link.startVertex;
        const w = link.endVertex;
        const linkcp_canvas = link.data.cp_canvas_pos;
        const v_canvas_pos = v.data.canvas_pos;
        const w_canvas_pos = w.data.canvas_pos
        if (typeof linkcp_canvas != "string"){
            return e.is_nearby_beziers_1cp(v_canvas_pos, linkcp_canvas, w_canvas_pos);
        }
        else {
            // OPT dont need beziers as it is a straight line
            const middle = v_canvas_pos.middle(w_canvas_pos);
            return e.is_nearby_beziers_1cp(v_canvas_pos, middle, w_canvas_pos);
        }
    }

    /**
     * Update the index string of every vertex according to the indexType of board
     */
    compute_vertices_index_string() {
        this.vertices.forEach((vertex, index) => { 
            vertex.updateIndexString();
        })
    }

    // align_position
    // return a CanvasCoord near mouse_canvas_coord which aligned on other vertices or on the grid
    align_position(pos_to_align: CanvasCoord, excluded_indices: Set<number>, canvas: HTMLCanvasElement, view: View): CanvasCoord {
        const aligned_pos = new CanvasCoord(pos_to_align.x, pos_to_align.y);
        if (view.is_aligning) {
            view.alignement_horizontal = false;
            view.alignement_vertical = false;
            this.vertices.forEach((vertex: ClientVertex, index) => {
                if (excluded_indices.has(index) == false) {
                    if (Math.abs(vertex.data.canvas_pos.y - pos_to_align.y) <= 15) {
                        aligned_pos.y = vertex.data.canvas_pos.y;
                        view.alignement_horizontal = true;
                        view.alignement_horizontal_y = view.canvasCoordY(vertex.data.pos);
                        return;
                    }
                    if (Math.abs(vertex.data.canvas_pos.x - pos_to_align.x) <= 15) {
                        aligned_pos.x = vertex.data.canvas_pos.x;
                        view.alignement_vertical = true;
                        view.alignement_vertical_x = view.canvasCoordX(vertex.data.pos);
                        return;
                    }
                }
            })
        }
        if (view.grid_show) {
            const grid_size = view.grid_size;
            for (let x = view.camera.x % grid_size; x < canvas.width; x += grid_size) {
                if (Math.abs(x - pos_to_align.x) <= 15) {
                    aligned_pos.x = x;
                    break;
                }
            }
            for (let y = view.camera.y % grid_size; y < canvas.height; y += grid_size) {
                if (Math.abs(y - pos_to_align.y) <= 15) {
                    aligned_pos.y = y;
                    break;
                }
            }
        }
        if (view.display_triangular_grid) {
            const grid_size = view.grid_size;
            const h = grid_size*Math.sqrt(3)/2;

            // find the corners of the quadrilateral containing the point
            const px = ((pos_to_align.x-view.camera.x)- (pos_to_align.y-view.camera.y)/Math.sqrt(3))/grid_size;
            const py = (pos_to_align.y-view.camera.y)/h;
            const i = Math.floor(px);
            const j = Math.floor(py);
            const corners = [
                new Coord(i*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2), // top left
                new Coord((i+1)*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2), // top right
                new Coord(i*grid_size + (j+1)*grid_size/2, Math.sqrt(3)*(j+1)*grid_size/2), // bottom left
                new Coord((i+1)*grid_size + (j+1)*grid_size/2, Math.sqrt(3)*(j+1)*grid_size/2) // bottom right
            ]
            
            // align on the corners if the point is near enough
            for (let corner of corners){
                corner = corner.add(view.camera);
                if (Math.sqrt(corner.dist2(pos_to_align)) <= 2*15){
                    aligned_pos.x = corner.x;
                    aligned_pos.y = corner.y;
                    return aligned_pos;
                }
            }

            // projection on the \ diagonal starting at the top left corner
            const projection1 = pos_to_align.orthogonal_projection(corners[0], new Vect(1 , Math.sqrt(3))) ; 
            if (projection1.dist2(pos_to_align) <= 15*15){
                aligned_pos.x = projection1.x;
                aligned_pos.y = projection1.y;
            }

            // projection on the \ diagonal starting at the top right corner
            const projection2 = pos_to_align.orthogonal_projection(corners[1], new Vect(1 , Math.sqrt(3))) ; 
            if (projection2.dist2(pos_to_align) <= 15*15){
                aligned_pos.x = projection2.x;
                aligned_pos.y = projection2.y;
            }

            // projection on the / diagonal starting at the top right corner
            const projection = pos_to_align.orthogonal_projection(corners[1], new Vect(-1 , Math.sqrt(3))) ; 
            if (projection.dist2(pos_to_align) <= 15*15){
                aligned_pos.x = projection.x;
                aligned_pos.y = projection.y;
            }

            // align on the horizontal lines
            for (let k of [0,3]){ // 0 and 3 are the indices of the top left and bottom right corner
                // of the quadrilateral containing the point
                let y = corners[k].y;
                if (Math.abs(y - pos_to_align.y) <= 15) {
                    aligned_pos.y = y;
                    break;
                }
            }
            
        }
        return aligned_pos;
    }

    get_selected_vertices(): Set<number> {
        const set = new Set<number>();
        this.vertices.forEach((v, index) => {
            if (v.data.is_selected) {
                set.add(index);
            }
        })
        return set;
    }



    /**
     * Est ce qu'on veut pas un AbstractGraph ?
     * Ah non peut être ça sert pour la copie d'un sous-graphe induit.
     */
    get_induced_subgraph_from_selection(view: View): ClientGraph{
        const subgraph = new ClientGraph(this.board);
        for (const [index, v] of this.vertices.entries()) {
            if(v.data.is_selected){
                subgraph.set_vertex(index, new ClientVertexData(v.data.pos.x, v.data.pos.y, v.data.weight, view, v.data.color))
            }
        }

        for (const [index, e] of this.links.entries()){
            const u = e.startVertex;
            const v = e.endVertex;
            if(u.data.is_selected && v.data.is_selected){
                subgraph.setLink(index, e.startVertex.index, e.endVertex.index, e.orientation, new ClientLinkData(e.data.cp, e.data.color, e.data.weight, view ) );
            }
        }
        return subgraph;
    }

    



    clear_vertices(){
        for( const vertex of this.vertices.values()){
            if (vertex.data.weightDiv != null){
                vertex.data.weightDiv.remove();
            }
        }
        this.vertices.clear();
    }

    clear_links(){
        for( const link of this.links.values()){
            if (typeof link.data.weightDiv != "undefined"){
                link.data.weightDiv.remove();
            }
        }
        this.links.clear();
    }

    addVertex(vertexData: ClientVertexData): ClientVertex {
        const v = super.addVertex(vertexData);
        const v2 = new ClientVertex(v.index, vertexData, this.board);
        this.vertices.set(v.index, v2);
        return v2;
    }

    addDefaultVertexFromCoord(pos: Coord, view: View): ClientVertex{
        const vData = new ClientVertexData( pos.x, pos.y, "", view, Color.Neutral);
        const v = this.addVertex(vData);
        return v;
    }

    /**
     * Add a default vertex positioned at a position on the Canvas (e.g. the center of the screen)
     */
    addDefaultVertex(pos: CanvasCoord): ClientVertex{
        const p = pos.toCoord(this.board.view);
        const vData = new ClientVertexData( p.x, p.y, "", this.board.view, Color.Neutral);
        const v = this.addVertex(vData);
        return v;
    }

    addLink(startIndex: number, endIndex: number, orientation: ORIENTATION, data: ClientLinkData): Option<ClientLink> {
        const link = super.addLink(startIndex, endIndex, orientation, data);
        if (typeof link == "undefined") return undefined;
        const startVertex = new ClientVertex(link.startVertex.index, link.startVertex.data, this.board);
        const endVertex = new ClientVertex(link.endVertex.index, link.endVertex.data, this.board);
        const link2 = new ClientLink(link.index, startVertex, endVertex, orientation, data, this.board);
        this.links.set(link.index, link2);
        return link2;
    }

    addDefaultEdge(startIndex: number, endIndex: number){
        const linkData = new ClientLinkData(undefined, Color.Neutral, "", this.board.view);
        this.addLink(startIndex, endIndex, ORIENTATION.UNDIRECTED, linkData);
    }

    addDefaultArc(startIndex: number, endIndex: number){
        const linkData = new ClientLinkData(undefined, Color.Neutral, "", this.board.view);
        this.addLink(startIndex, endIndex, ORIENTATION.DIRECTED, linkData);
    }


    /**
     * Return a nearby link if there exists one.
     */
    nearbyLink(pos: CanvasCoord): Option<ClientLink>{
        for (const [linkIndex, link] of this.links){
            if (link.isPosNear(pos)){
                return link;
            }
        }
        return undefined
    }


    translate_vertex_by_canvas_vect(index: number, cshift: CanvasVect, view: View){
        const vertex = this.vertices.get(index);
 
        if (typeof vertex != "undefined") {
            const previous_pos = vertex.data.pos.copy();
            vertex.translate_by_canvas_vect(cshift, view);
            const new_pos = vertex.data.pos.copy();

            for (const [link_index, link] of this.links.entries()) {
                if ( typeof link.data.cp != "undefined"){
                    if (link.startVertex.index == index) {
                        link.transformCP(new_pos, previous_pos, link.endVertex.data.pos);
                        link.data.cp_canvas_pos = view.create_canvas_coord(link.data.cp);
                    } else if (link.endVertex.index == index) {
                        link.transformCP(new_pos, previous_pos, link.startVertex.data.pos);
                        link.data.cp_canvas_pos = view.create_canvas_coord(link.data.cp);
                    }
                }
            }
        }
    }


    getNeighbors(v: ClientVertex): Array<ClientVertex>{
        const neighbors = super.getNeighbors(v);
        const neighbors2 = new Array<ClientVertex>();
        for (const v of neighbors){
            neighbors2.push(v as ClientVertex);
        }
        return neighbors2;
    }




    getCombinatorialMap(ctx: CanvasRenderingContext2D, h: number, h2: number, crossRatio: number, adaptToEdgeLength: boolean, ratio: number, durete: number){
        const quarterPoints = new Map<number, QuarterPoint>(); // quarter points data
        
        // We cannot assign the edgeAdj of the QPs at the time of their creation.
        // Therefore we create these two structures to gather enough information to assign them later.
        const adjQP = new Map<number, Array<QuarterPoint>>(); // array of QPs around a vertex
        const prepareEdgeAdj = new Map<number, number>();

        // The number of QP seen. They are treated 2 by 2 : around each vertex, for each edge.
        // The even QP is on the left, the odd on the right (starting from the vertex).
        let nbQP = 0;

        for ( const [vertexId, vertex] of this.vertices){
            const vertexQPadj = new Array();
            const baseQPnb = nbQP;

            const neighbors = this.getNeighbors(vertex);
            neighbors.sort((v1, v2) => comparePointsByAngle(vertex.getPos(), v1.getPos(), v2.getPos()));

            // We now create 2* neighbors.length QuarterPoints

            if (neighbors.length == 1){

                const neighbor = neighbors[0];
                const edgeDir = Vect.from_coords(vertex.getPos(), neighbor.getPos());
                let hh = (adaptToEdgeLength) ? hFromEdgeLength(edgeDir) : h; 
                edgeDir.setNorm(hh);
                edgeDir.rotate(Math.PI/2);

                const edgeDir2 = Vect.from_coords(vertex.getPos(), neighbor.getPos());
                edgeDir2.setNorm(1.4*hh);
                
                const qp1pos = vertex.getPos().copy();
                qp1pos.rtranslate(edgeDir);
                const cp1 = qp1pos.copy();
                cp1.rtranslate(edgeDir2);
                const qp2pos = vertex.getPos().copy();
                qp2pos.translate(edgeDir);
                const cp2 = qp2pos.copy();
                cp2.rtranslate(edgeDir2);

                // nbQP
                const qp1 = new QuarterPoint(nbQP, qp1pos, cp1, 
                    nbQP+1,
                    neighbor.index,
                    nbQP+1,
                    vertex );
                prepareEdgeAdj[nbQP] = neighbor.index;
                vertexQPadj.push(qp1);

                // nbQP+1
                const qp2 = new QuarterPoint(nbQP+1, qp2pos, cp2, 
                    nbQP,
                    neighbor.index,
                    nbQP,
                    vertex );
                prepareEdgeAdj[nbQP+1] = neighbor.index;
                vertexQPadj.push(qp2);

                // compute the edgeAdj if possible
                const neighborAdj = adjQP.get(neighbor.index);
                if (neighborAdj){
                    for (const neighborQP of neighborAdj){
                        if (prepareEdgeAdj[neighborQP.id] == vertex.index && neighborQP.id %2 == 1){
                            qp1.edgeAdj = neighborQP.id;
                            neighborQP.edgeAdj = qp1.id;
                            // draw_line(this.board.view.create_canvas_coord(qp1.pos), this.board.view.create_canvas_coord(neighborQP.pos), ctx, "gray" )
                        } else if (prepareEdgeAdj[neighborQP.id] == vertex.index && neighborQP.id %2 == 0){
                            qp2.edgeAdj = neighborQP.id;
                            neighborQP.edgeAdj = qp2.id;
                            // draw_line(this.board.view.create_canvas_coord(qp2.pos), this.board.view.create_canvas_coord(neighborQP.pos), ctx, "gray" )
                        }
                    }
                }

                quarterPoints.set(nbQP, qp1);
                quarterPoints.set(nbQP+1, qp2);
                nbQP += 2;

                adjQP.set(vertexId, vertexQPadj);
                continue;
            }


            for (let i = 0 ; i < neighbors.length; i ++){
                const neighbor = neighbors[i];
                const j =  i+1 >= neighbors.length ? 0 : i+1; 
                const nextNeighbor = neighbors[j];
                const k = i-1 < 0 ? neighbors.length-1 : i-1;
                const previousNeighbor = neighbors[k];

                const [qp0pos, cp0, qp1pos] = auxCombMap(vertex, previousNeighbor, neighbor, h, adaptToEdgeLength, durete);
                const [qp2pos, cp2, qp3pos] = auxCombMap(vertex, neighbor, nextNeighbor, h, adaptToEdgeLength, durete);

                // nbQP
                const qp1 = new QuarterPoint(nbQP, qp1pos, cp0, 
                    nbQP -1 < baseQPnb ? baseQPnb + 2*neighbors.length-1 : nbQP-1,
                    neighbor.index,
                    nbQP+1,
                    vertex );
                prepareEdgeAdj[nbQP] = neighbor.index;
                vertexQPadj.push(qp1);

                // nbQP+1
                const qp2 = new QuarterPoint(nbQP+1, qp2pos, cp2, 
                    nbQP +2 >= baseQPnb + 2*neighbors.length ? baseQPnb : nbQP+2,
                    neighbor.index,
                    nbQP,
                    vertex );
                prepareEdgeAdj[nbQP+1] = neighbor.index;
                vertexQPadj.push(qp2);

                

                // compute the edgeAdj if possible
                const neighborAdj = adjQP.get(neighbor.index);
                if (neighborAdj){
                    for (const neighborQP of neighborAdj){
                        if (prepareEdgeAdj[neighborQP.id] == vertex.index && neighborQP.id %2 == 1){
                            qp1.edgeAdj = neighborQP.id;
                            neighborQP.edgeAdj = qp1.id;
                        } else if (prepareEdgeAdj[neighborQP.id] == vertex.index && neighborQP.id %2 == 0){
                            qp2.edgeAdj = neighborQP.id;
                            neighborQP.edgeAdj = qp2.id;
                        }

                    }
                }

                quarterPoints.set(nbQP, qp1);
                quarterPoints.set(nbQP+1, qp2);
                nbQP += 2;
            }
            adjQP.set(vertexId, vertexQPadj);
        }
        
        // compute Edge Projection Points
        for (const qp of quarterPoints.values()){
            const qpJump = quarterPoints.get(qp.jumpAdj);
            const qpEdge = quarterPoints.get(qp.edgeAdj);
            qp.computeEdgePoint(qpJump, qpEdge);
        }

        // compute QuarterEdgePoints and MiddleEdgePoints
        for (const qp of quarterPoints.values()){
            const qpEdge = quarterPoints.get(qp.edgeAdj);
            qp.computeQuarterMiddlePoints(qpEdge, h, ratio, crossRatio);
        }

        return quarterPoints;
    }


    
    /**
     * TODO: adaptToEdgeLength
     */
    drawCombinatorialMap(file: string | undefined, ctx: CanvasRenderingContext2D, h: number, h2: number, crossRatio: number, adaptToEdgeLength: boolean, ratio: number, durete: number, width: number){
        const drawOnBoard = (typeof file === "undefined");

        const quarterPoints = this.getCombinatorialMap(ctx, h, h2, crossRatio, adaptToEdgeLength, ratio, durete);

        let svgString = "";

        let minx = 0;
        let miny = 0;
        let maxx = 600;
        let maxy = 600;

        svgString += `<?xml version="1.0" standalone="yes"?>
        <svg
            width="100%"
            height="100%"
            viewBox="${minx} ${miny} ${maxx} ${maxy}"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            >`;
        

        const visited = new Set<number>();
        const colors = ["black", "red", "blue", "green"];
        let currentColor = 0;
        
        for (const qp of quarterPoints.values()){
            if (visited.has(qp.id) == false){
                let currentQp = qp;
                let d = `M ${qp.pos.x} ${qp.pos.y}`;
                while (visited.has(currentQp.id) == false ){

                    visited.add(currentQp.id);

                    let nextQp = quarterPoints.get(currentQp.edgeAdj);
                    nextQp = quarterPoints.get(nextQp.jumpAdj);
                    visited.add(nextQp.id);
                    // if (adaptToEdgeLength){
                    //     const edgeDir = Vect.from_coords(currentQp.vertexAdj.getPos(), nextQp.vertexAdj.getPos());
                    //     const hh = hFromEdgeLength(edgeDir);
                    //     const hh2 = h2FromEdgeLength(edgeDir);
                    //     d += curvedStanchionUnder2(currentQp, nextQp, hh, hh2, crossRatio);
                    // } else {
                        this.board.drawLine(ctx, currentQp.pos, currentQp.quarterEdgePoint, colors[currentColor], width);

                        d += `L ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y}`;
                        if ( currentQp.id %2 == 1){
                            this.board.drawBezierCurve(ctx, currentQp.quarterEdgePoint, currentQp.quarterEdgeCP, currentQp.middleEdgeCP, currentQp.middleEdgePoint, colors[currentColor], width);
                            this.board.drawBezierCurve(ctx, nextQp.middleEdgePoint, nextQp.middleEdgeCP, nextQp.quarterEdgeCP, nextQp.quarterEdgePoint, colors[currentColor], width);

                            
                            d += `C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${currentQp.middleEdgeCP.x} ${currentQp.middleEdgeCP.y}, ${currentQp.middleEdgePoint.x} ${currentQp.middleEdgePoint.y}`;
                            d += `M ${nextQp.middleEdgePoint.x} ${nextQp.middleEdgePoint.y}`;
                            d += `C ${nextQp.middleEdgeCP.x} ${nextQp.middleEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`;
                            
                        } else {
                            this.board.drawBezierCurve(ctx, currentQp.quarterEdgePoint, currentQp.quarterEdgeCP, nextQp.quarterEdgeCP, nextQp.quarterEdgePoint, colors[currentColor], width);
                            
                            d += `C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`;
                        }

                        this.board.drawLine(ctx, nextQp.quarterEdgePoint, nextQp.pos, colors[currentColor], width);
                        d += `L ${nextQp.pos.x} ${nextQp.pos.y}`;
                    // }


                    this.board.drawCircle(ctx, currentQp.cp, 3, "green");
                    if ( currentQp.id %2 == 0 ){
                        this.board.drawCircle(ctx, currentQp.pos, 3, "blue");
                    } else {
                        this.board.drawCircle(ctx, currentQp.pos, 3, "red");
                    }

                    currentQp = nextQp;

                    nextQp = quarterPoints.get(currentQp.interiorAdj);
                    this.board.drawBezierCurve(ctx, currentQp.pos, currentQp.cp, nextQp.cp, nextQp.pos, colors[currentColor], width);
                    d += `C ${currentQp.cp.x} ${currentQp.cp.y} ${nextQp.cp.x} ${nextQp.cp.y} ${nextQp.pos.x} ${nextQp.pos.y}`;

                    this.board.drawCircle(ctx, currentQp.cp, 3, "green");
                    if ( currentQp.id %2 == 0 ){
                        this.board.drawCircle(ctx, currentQp.pos, 3, "blue");
                    } else {
                        this.board.drawCircle(ctx, currentQp.pos, 3, "red");
                    }

                    currentQp = nextQp;
                }

                d += `M ${currentQp.pos.x} ${currentQp.pos.y}`;
                d += "Z";
                svgString += pathToSVGPath(d, width, colors[currentColor] );
                currentColor = (currentColor + 1) % colors.length;
            }
        }

        svgString += "</svg>";

        if (drawOnBoard == false){
            const a = document.createElement("a");
            a.href = window.URL.createObjectURL(new Blob([svgString], { type: "text/plain" }));
            a.download = "moebius_stanchions.svg";
            a.click();
        }
    }


    /**
     * OBSOLETE
     */
    generateMSStoSVGversion2(ctx: CanvasRenderingContext2D, h: number, h2: number, t: number, adaptToEdgeLength: boolean, ratio: number, durete: number){
        const quarterPoints = this.getCombinatorialMap(ctx, h, h2, t, adaptToEdgeLength, ratio, durete);

        const width = 3;

        let svgString = "";

        let minx = 0;
        let miny = 0;
        let maxx = 600;
        let maxy = 600;

        svgString += `<?xml version="1.0" standalone="yes"?>
        <svg
            width="100%"
            height="100%"
            viewBox="${minx} ${miny} ${maxx} ${maxy}"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            >`;
        
        // for (const v of this.vertices.values()){
        //     svgString += coordToSVGcircle(v.getPos(), 2, "black");
        // }


        // for (const qp of quarterPoints.values()){
        //     svgString += coordToSVGcircle(qp.pos, 2, "blue");
        //     svgString += coordToSVGcircle(qp.cp, 2, "green");

        //     svgString +=
        //       `<text 
        //       font-size="5px"
        //       x="${qp.pos.x}" 
        //       y="${qp.pos.y+7}" 
        //       text-anchor="middle" 
        //       alignment-baseline="middle">${qp.id} ${qp.interiorAdj} ${qp.jumpAdj} ${qp.edgeAdj}</text>`;
        // }



        const visited = new Set<number>();
        const colors = ["black", "red", "blue", "green"];
        let currentColor = 0;
        
        for (const qp of quarterPoints.values()){
            if (visited.has(qp.id) == false){
                let currentQp = qp;
                let d = `M ${qp.pos.x} ${qp.pos.y}`;
                while (visited.has(currentQp.id) == false ){

                    visited.add(currentQp.id);

                    let nextQp = quarterPoints.get(currentQp.edgeAdj);
                    nextQp = quarterPoints.get(nextQp.jumpAdj);
                    visited.add(nextQp.id);
                    if (adaptToEdgeLength){
                        const edgeDir = Vect.from_coords(currentQp.vertexAdj.getPos(), nextQp.vertexAdj.getPos());
                        const hh = hFromEdgeLength(edgeDir);
                        const hh2 = h2FromEdgeLength(edgeDir);
                        d += curvedStanchionUnder2(currentQp, nextQp, hh, hh2, t);
                    } else {
                        if ( currentQp.id %2 == 1){
                            // this.board.drawBezierCurve(ctx, qp.quarterEdgePoint, qp.quarterEdgeCP, qp.middleEdgeCP, qp.middleEdgePoint, "gray");
                            d += `L ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y}`;
                            d += `C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${currentQp.middleEdgeCP.x} ${currentQp.middleEdgeCP.y}, ${currentQp.middleEdgePoint.x} ${currentQp.middleEdgePoint.y}`;
                            d += `M ${nextQp.middleEdgePoint.x} ${nextQp.middleEdgePoint.y}`;
                            d += `C ${nextQp.middleEdgeCP.x} ${nextQp.middleEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`;
                            d += `L ${nextQp.pos.x} ${nextQp.pos.y}`;
                        } else {
                            // this.board.drawBezierCurve(ctx, qp.quarterEdgePoint, qp.quarterEdgeCP, oppositeQp.quarterEdgeCP, oppositeQp.quarterEdgePoint, "gray");
                            d += `L ${currentQp.quarterEdgePoint.x} ${currentQp.quarterEdgePoint.y}`;
                            d += `C ${currentQp.quarterEdgeCP.x} ${currentQp.quarterEdgeCP.y}, ${nextQp.quarterEdgeCP.x} ${nextQp.quarterEdgeCP.y}, ${nextQp.quarterEdgePoint.x} ${nextQp.quarterEdgePoint.y}`;
                            d += `L ${nextQp.pos.x} ${nextQp.pos.y}`;
                        }

                        // d += `L ${nextQp.pos.x} ${nextQp.pos.y}`;
                        // d += `L ${nextQp.pos.x} ${nextQp.pos.y}`; // line draw
                        // d += curvedStanchionUnder2(currentQp, nextQp, h, h2, t);
                    }
                    currentQp = nextQp;

                    nextQp = quarterPoints.get(currentQp.interiorAdj);
                    d += `C ${currentQp.cp.x} ${currentQp.cp.y} ${nextQp.cp.x} ${nextQp.cp.y} ${nextQp.pos.x} ${nextQp.pos.y}`;
                    currentQp = nextQp;
                }

                d += `M ${currentQp.pos.x} ${currentQp.pos.y}`;
                d += "Z";
                svgString += pathToSVGPath(d, 2, colors[currentColor] );
                currentColor = (currentColor + 1) % colors.length;
            }
        }

        svgString += "</svg>";
        
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(new Blob([svgString], { type: "text/plain" }));
        a.download = "moebius_stanchions.svg";
        a.click();
    }



    /**
     * OBSOLETE
     */
    generateMoebiusStanchionsSVG(){
        const h = 5;
        const h2 = 20;
        const t = 0.40;
        const width = 3;

        //                           vertex      neighbor
        const angleCWPoints = new Map<number, Map<number, Coord>>();
        const angleCCWPoints = new Map<number, Map<number, Coord>>();

        // for each vertex, for each neighbor the cp and the anglePoint next
        const anglePointNext = new Map<number, Map<number, [Coord, Coord]>>();


        let svgString = "";

        let minx = 0;
        let miny = 0;
        let maxx = 600;
        let maxy = 600;

        svgString += `<?xml version="1.0" standalone="yes"?>
        <svg
            width="100%"
            height="100%"
            viewBox="${minx} ${miny} ${maxx} ${maxy}"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            >`;

        for ( const [vertexId, vertex] of this.vertices){
            console.log(vertexId);
            const vAngleCWPoints = new Map();
            const vAngleCCWPoints = new Map();


            svgString += coordToSVGcircle(vertex.getPos(), 3, "black");

            const neighbors = this.getNeighbors(vertex);
            neighbors.sort((v1, v2) => comparePointsByAngle(vertex.getPos(), v1.getPos(), v2.getPos()));
            console.log(neighbors);
            if ( neighbors.length <= 1) continue;
            for (let i = 0 ; i < neighbors.length; i ++){
                console.log(neighbors[i].index);
                const dir = Vect.from_coords(vertex.getPos(), neighbors[i].getPos());
                
                const save = dir.y; // rotate clockwise by 1/4 2pi
                dir.y = dir.x;
                dir.x = -save;
                dir.setNorm(h);

                const vshifted = vertex.getPos().copy();
                vshifted.translate(dir);
                const nshifted = neighbors[i].getPos().copy();
                nshifted.translate(dir);

                // svgString += segmentToSVGLine(vshifted, nshifted, "black", 1);
                // svgString += coordToSVGcircle(vshifted, 2, "red");
                // svgString += coordToSVGcircle(nshifted, 2, "red");

                const j =  i+1 >= neighbors.length ? 0 : i+1; 
                const dir2 = Vect.from_coords(vertex.getPos(), neighbors[j].getPos());
                
                const save2 = dir2.y; // rotate clockwise by 1/4 2pi
                dir2.y = -dir2.x;
                dir2.x = save2;
                dir2.setNorm(h);

                const vshifted2 = vertex.getPos().copy();
                vshifted2.translate(dir2);
                const nshifted2 = neighbors[j].getPos().copy();
                nshifted2.translate(dir2);

                // svgString += segmentToSVGLine(vshifted2, nshifted2, "black", 1);
                // svgString += coordToSVGcircle(vshifted2, 2, "blue");
                // svgString += coordToSVGcircle(nshifted2, 2, "blue");

                const w = linesIntersection(vshifted, nshifted, vshifted2, nshifted2);
                if (typeof w === "undefined"){
                    vAngleCWPoints.set(neighbors[i].index, vshifted);
                    vAngleCCWPoints.set(neighbors[j].index, vshifted2)
                    continue;
                } 
                // svgString += coordToSVGcircle(w, 3, "green");

                const angle = angleAround(vertex.getPos(), neighbors[i].getPos(), neighbors[j].getPos());
                console.log(vertex.index, neighbors[i].index, neighbors[j].index, angle);
                if ( -Math.PI < angle && angle < 0){
                    svgString += `<path d="M ${vshifted.x} ${vshifted.y} C ${w.x} ${w.y}, ${w.x} ${w.y}, ${vshifted2.x} ${vshifted2.y}" stroke="black" fill="none"/>`;

                    vAngleCWPoints.set(neighbors[i].index, vshifted);
                    vAngleCCWPoints.set(neighbors[j].index, vshifted2)
                    
                } else {
                    const m1 = new Coord(2*w.x - vshifted.x, 2*w.y - vshifted.y);
                    const m2 = new Coord(2*w.x - vshifted2.x, 2*w.y - vshifted2.y);
    
                    svgString += `<path d="M ${m1.x} ${m1.y} C ${w.x} ${w.y}, ${w.x} ${w.y}, ${m2.x} ${m2.y}" stroke="black" fill="none"/>`;
                
                    vAngleCWPoints.set(neighbors[i].index, m1);
                    vAngleCCWPoints.set(neighbors[j].index, m2)
                }


            }
            angleCWPoints.set(vertex.index, vAngleCWPoints);
            angleCCWPoints.set(vertex.index, vAngleCCWPoints);

        }



        for (const link of this.links.values()){
            
            const v1 = link.startVertex;
            const v2 = link.endVertex;

            const middle = v1.getPos().middle(v2.getPos());
            const dir = Vect.from_coords(v1.getPos(), v2.getPos());
            dir.rotate(Math.PI/2);
            dir.setNorm(h);
            const middleA = middle.copy();
            middleA.translate(dir);
            const middleB = middle.copy();
            middleB.rtranslate(dir);

            const ap1 = angleCWPoints.get(v1.index).get(v2.index);
            const ap2 = angleCCWPoints.get(v2.index).get(v1.index);
            const middle1 = middleA.copy();
            const middle2 = middleA.copy();
            const dir1 = Vect.from_coords(ap1, ap2);
            dir1.setNorm(h2);
            middle2.translate(dir1)
            middle1.rtranslate(dir1);

            

            svgString += segmentToSVGLine(ap1, middle1, "black", 1);
            // svgString += segmentToSVGLine(middle2, ap2, "black", 1);

            const ap3 = angleCWPoints.get(v2.index).get(v1.index);
            const ap4 = angleCCWPoints.get(v1.index).get(v2.index);
            const middle3 = middleB.copy();
            const middle4 = middleB.copy();
            const dir2 = Vect.from_coords(ap3, ap4);
            dir2.setNorm(h2);
            middle4.translate(dir2)
            middle3.rtranslate(dir2);

            svgString += segmentToSVGLine(ap3, middle3, "black", 1);
            // svgString += segmentToSVGLine(middle4, ap4, "black", 1);

            // First complete branch
            // svgString += `<path d="M ${middle1.x} ${middle1.y} C ${middleA.x} ${middleA.y}, ${middleB.x} ${middleB.y}, ${middle3.x} ${middle3.y}" stroke="black" fill="none"/>`;

            // Incomplete branch
            const w1 = bezier_curve_point(t, [middle1, middleA, middleB, middle3]);

            const c1 = middle1.copy();
            const cd1 = Vect.from_coords(middle1, middleA);
            cd1.x *= t;
            cd1.y *= t;
            c1.translate(cd1);

            const cw1 = w1.copy();
            const cdw1 = Vect.from_coords(w1, c1);
            cdw1.setNorm(cd1.norm());
            cw1.translate(cdw1);

            svgString += `<path d="M ${middle1.x} ${middle1.y} C ${c1.x} ${c1.y}, ${cw1.x} ${cw1.y}, ${w1.x} ${w1.y}" stroke="black" fill="none"/>`;

            // --
            const w3 = bezier_curve_point(t, [middle3, middleB, middleA, middle1]);

            const c3 = middle3.copy();
            const cd3 = Vect.from_coords(middle3, middleB);
            cd3.x *= t;
            cd3.y *= t;
            c3.translate(cd3);

            const cw3 = w3.copy();
            const cdw3 = Vect.from_coords(w3, c3);
            cdw3.setNorm(cd3.norm());
            cw3.translate(cdw3);

            svgString += `<path d="M ${middle3.x} ${middle3.y} C ${c3.x} ${c3.y}, ${cw3.x} ${cw3.y}, ${w3.x} ${w3.y}" stroke="black" fill="none"/>`;

            
            // 2eme branche
            // ap2 m2 (mA) (mB) m4 ap4
            let path2 = `M ${ap2.x} ${ap2.y}`;
            path2 += `L ${middle2.x} ${middle2.y}`;
            path2 += `C ${middleA.x} ${middleA.y}, ${middleB.x} ${middleB.y}, ${middle4.x} ${middle4.y}`;
            path2 += `L ${ap4.x} ${ap4.y}`;
            svgString += pathToSVGPath(path2, 4, "black");
            // svgString += `<path d="M ${middle2.x} ${middle2.y} C ${middleA.x} ${middleA.y}, ${middleB.x} ${middleB.y}, ${middle4.x} ${middle4.y}" stroke="black" fill="none"/>`;

        }

        svgString += "</svg>";
        
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(new Blob([svgString], { type: "text/plain" }));
        a.download = "moebius_stanchions.svg";
        a.click();
    }

        

}
