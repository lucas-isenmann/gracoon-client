
import { ClientGraph } from '../board/graph';
import { Parametor, SENSIBILITY } from './parametor';
import { Coord, Graph, ORIENTATION, Vect } from 'gramoloss';
import { ClientLink, ClientLinkData } from '../board/link';
import { local_board } from '../setup';
import { ClientVertex } from '../board/vertex';
import { ClientRectangle } from '../board/rectangle';

export let param_has_cycle = new Parametor("Has cycle?", "has_cycle", "?has_cycle", "Check if the graph has an undirected cycle", true, true, [SENSIBILITY.ELEMENT], false);

param_has_cycle.compute = ((g: ClientGraph) => {
    return String(g.has_cycle());
})

export let param_has_directed_cycle = new Parametor("Has directed cycle?", "has_directed_cycle", "?has_directed_cycle", "Check if the graph has a directed cycle", true, true, [SENSIBILITY.ELEMENT], false);

param_has_directed_cycle.compute = ((g: ClientGraph) => {
    return String(g.has_directed_cycle());
})

export let param_nb_vertices = new Parametor("Vertices number", "vertex_number", "#vertices", "Print the number of vertices", true, false, [SENSIBILITY.ELEMENT], true);

param_nb_vertices.compute = ((g: ClientGraph) => {
    return String(g.vertices.size)
})


export let param_nb_edges = new Parametor("Edges number", "edge_number", "#edges", "Print the number of edges", true, false, [SENSIBILITY.ELEMENT], true);

param_nb_edges.compute = ((g: ClientGraph) => {
    let counter = 0;
    for (var link of g.links.values()) {
        if (link.orientation == ORIENTATION.UNDIRECTED) {
            counter++;
        }
    }
    return String(counter);
})



export let param_is_connected = new Parametor("Is connected?", "is_connected", "is connected?", "Is the graph/area connected?", true, true, [SENSIBILITY.ELEMENT], true);

param_is_connected.compute = ((g: ClientGraph) => {
    return String(g.is_connected());
});



export let param_number_connected_comp = new Parametor("Number connected component", "number_connected_comp", "#connected comp.", "Compute the number of connected component (undirected)", true, false, [SENSIBILITY.ELEMENT], true);

param_number_connected_comp.compute = ((g: ClientGraph) => {

    if (g.vertices.size < 1) {
        return "0";
    }
    const visited = new Map();
    for (const index of g.vertices.keys()) {
        visited.set(index, false);
    }

    let cc = 0;
    let all_visited = false;

    while (!all_visited) {
        all_visited = true;
        let first_vertex_index;

        for (const index of g.vertices.keys()) {
            if (visited.get(index) === false) {
                first_vertex_index = index;
                all_visited = false;
                cc++;
                break;
            }
        }

        if (all_visited) {
            break;
        }

        g.DFS_recursive( first_vertex_index, visited);

    }
    return String(cc);
});


export let param_number_colors = new Parametor("Number vertex colors", "nb_vertex_colors", "#colors (vertices)", "Print the number of different colors used on the vertices", true, false, [SENSIBILITY.ELEMENT, SENSIBILITY.COLOR], true);

param_number_colors.compute = ((g: ClientGraph) => {
    let colors_set = new Set<string>();
    for (const v of g.vertices.values()) {
        colors_set.add(v.data.color);
    }
    return String(colors_set.size);

});


export let param_is_drawing_planar = new Parametor("Is drawing planar?", "is_drawing_planar", "is_drawing_planar", "Return true iff drawing is planar", true, true, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], true);

param_is_drawing_planar.compute = ((g: ClientGraph) => {
    console.log("is drawing planar update");
    if (g.is_drawing_planar()){
        return "true";
    } else {
        return "false";
    }
});



export let param_min_degree = new Parametor("Minimum degree", "min_degree", "min degree", "Print the minimum degree", true, false, [SENSIBILITY.ELEMENT], true);

param_min_degree.compute = ((g: ClientGraph, verbose) => {
    const data = g.get_degrees_data();
    if (verbose) {
        for (const vertex_index of data.min_vertices) {
            const vertex = g.vertices.get(vertex_index);
            vertex.data.color = "red";
        }
        g.vertices.forEach((vertex, vertex_index) => {
            vertex.data.update_param(param_min_degree.id, String(g.get_neighbors_list(vertex_index).length));
        })
    }
    return String(data.min_value);
});

export let param_min_indegree = new Parametor("Mininum indegree", "min_indegree", "min_indegree", "Minimum indegree", true, false, new Array(SENSIBILITY.ELEMENT), false);

param_min_indegree.compute = ((g: ClientGraph, verbose) => {
    const md = g.min_indegree();
    return String(md);
});




export let param_max_degree = new Parametor("Maximum degree", "max_degree", "max degree", "Print the minimum degree", true, false, [SENSIBILITY.ELEMENT], true);

param_max_degree.compute = ((g: ClientGraph) => {
    const data = g.get_degrees_data();
    return String(data.max_value);
});

export let param_average_degree = new Parametor("Average degree", "avg_degree", "avg. degree", "Print the average degree", true, false, [SENSIBILITY.ELEMENT], true);

param_average_degree.compute = ((g: ClientGraph) => {
    // Remark : If no loop, we can simply use that sum(degree) = 2|E| so avg(degree) = 2|E|/|V|
    const data = g.get_degrees_data();
    const avg = Math.round((data.avg + Number.EPSILON) * 100) / 100

    return String(avg);
});


export let param_has_proper_coloring = new Parametor("Proper vertex-coloring?", "has_proper_coloring", "proper vertex-coloring?", "Print if the current coloring of the vertices is proper or not", true, true, [SENSIBILITY.ELEMENT, SENSIBILITY.COLOR], true);

param_has_proper_coloring.compute = ((g: ClientGraph) => {

    if (g.vertices.size == 0) {
        return "true";
    }

    const visited = new Map();
    for (const index of g.vertices.keys()) {
        visited.set(index, false);
    }

    const v_index = g.vertices.keys().next().value;

    const S = Array();
    S.push(v_index);

    while (S.length !== 0) {
        const v_index = S.pop();
        if (!visited.get(v_index)) {
            visited.set(v_index, true);
            const v = g.vertices.get(v_index);
            const neighbors = g.get_neighbors_list(v_index);
            for (const u_index of neighbors) {
                const u = g.vertices.get(u_index);
                if (u.data.color === v.data.color) {
                    return "false";
                }
                S.push(u_index);
            }
        }
    }

    return "true";

});



export let param_diameter = new Parametor("Diameter", "diameter", "diameter", "Print the diameter of the graph", true, false, [SENSIBILITY.ELEMENT], true);

param_diameter.compute = ((g: ClientGraph) => {
    const FW = g.Floyd_Warhall(false);
    let diameter = 0;

    for (const v_index of g.vertices.keys()) {
        for (const u_index of g.vertices.keys()) {
            if (diameter < FW.distances.get(v_index).get(u_index)) {
                diameter = FW.distances.get(v_index).get(u_index);
            }
        }
    }

    if (diameter === Infinity) {
        return String("+∞")
    }
    return String(diameter);
});

// -----------------
export const paramDelaunayConstructor = new Parametor("Delaunay constructor", "delaunay", "delaunay", "Resets the edges of the graph", true, false, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], false);

paramDelaunayConstructor.compute = ((g: ClientGraph) => {
    g.resetDelaunayGraph((i,j) => {
        return new ClientLinkData(undefined, "black", "", local_board.view);
    });
    return String("/");
});


// -----------------
export const paramStretch = new Parametor("Stretch", "stretch", "stretch", "Computes the stretch", true, false, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], false);

paramStretch.compute = ((g: ClientGraph) => {
    return String(g.stretch().toFixed(3));
});



// // -----------------
// export const paramStretchGeneticMaximizer = new Parametor("Stretch Genetic Maximizer", "stretchG", "stretchG", "Computes the stretch", false, false, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], false);

// paramStretchGeneticMaximizer.compute = ((g: ClientGraph) => {
//     const popSize = 36;
//     const graphSize = 20;
//     const nbRows = 6;
//     const w = 70;
//     const margin = 20;
//     const mutRange = 4;

//     let maxStretch: number | undefined = undefined;
//     const topLeftCorners = new Array<Coord>();

//     for (let i = 0 ; i < popSize ; i ++){
//         topLeftCorners.push(new Coord( 100 + (i % nbRows)*(w+margin), 100+ Math.floor(i/ nbRows)*(w+margin)));
//     }

//     if( g.vertices.size == 0){
//         for ( let i = 0 ; i < popSize ; i ++){
//             const c1 = topLeftCorners[i];
//             const c2 = c1.add(new Coord(w,w));
//             for( let j = 0 ; j < graphSize ; j ++){
//                 const pos = c1.add(new Coord(Math.random()*w,Math.random()*w));
//                 const newVertex = new ClientVertex(pos.x,pos.y,"",local_board.view);
//                 g.addVertex(newVertex);
//             }
//             local_board.rectangles.set(i, new ClientRectangle(c1, c2 , "gray", local_board.view));
//             const subgraph = g.getSubgraphFromRectangle(c1,c2);
//             subgraph.resetDelaunayGraph((i,j) => {
//                 const vi = subgraph[i].vertices.get(i);
//                 const vj = subgraph[j].vertices.get(j);
//                 return new ClientLink(i,j,vi,vj,"", ORIENTATION.UNDIRECTED, "black", "", local_board.view)
//             });
//             const stretch = subgraph.stretch();
//             if (maxStretch == undefined){
//                 maxStretch = stretch;
//             } else if (stretch > maxStretch){
//                 maxStretch = stretch;
//             }
//             for (const link of subgraph.links.values()){
//                 g.addLink(link);
//             }
//         }
//     } else {
//         const population = new Array<ClientGraph>();
//         const fitness = new Array();
//         let totalFitness = 0;
//         for ( let i = 0 ; i < popSize ; i ++){
//             const c1 = topLeftCorners[i];
//             const c2 = c1.add(new Coord(w,w));
//             const subgraph = g.getSubgraphFromRectangle(c1,c2);
//             population.push(ClientGraph.fromGraph(subgraph));
//             const stretch = subgraph.stretch()
//             fitness.push(Math.pow(stretch,3))
//             totalFitness += Math.pow(stretch,3);
//         }
//         // Normalize fitness array
//         let minFitness = 100;
//         let maxFitness = 0;
//         for (let i = 0 ; i < popSize ; i ++){
//             fitness[i] = fitness[i]/totalFitness;
//             minFitness = Math.min(minFitness, fitness[i]);
//             maxFitness = Math.max(maxFitness, fitness[i]);
//             // console.log((100*fitness[i]).toFixed(2));
//         }

//         // Selection and mutate
//         g.clear();
//         const newPop = new Array<ClientGraph>();
//         let sumStretch = 0;
//         for( let i = 0 ; i < popSize ; i ++){
//             const c1 = topLeftCorners[i];
//             const r = Math.random();
//             let s = 0;
//             for ( let j = 0 ; j < popSize ; j ++ ){
//                 if ( r <= s + fitness[j]){
//                     newPop.push(population[j].clone());
//                     newPop[i].translateByServerVect(new Vect(((i%nbRows)-(j%nbRows))*(w+margin),((Math.floor(i/nbRows))-(Math.floor(j/nbRows)))*(w+margin)), local_board.view);

//                     // mutate
//                     const r2 = Math.floor(Math.random()* graphSize);
//                     const indices = Array.from(newPop[i].vertices.keys());
//                     const v = newPop[i].vertices.get(indices[r2]);
//                     if (typeof v != "undefined"){
//                         const nx = v.pos.x + Math.random()*mutRange -mutRange/2;
//                         const ny = v.pos.y + Math.random()*mutRange -mutRange/2;
//                         if ( c1.x <= nx && nx <= c1.x + w && c1.y <= ny && ny <= c1.y + w ){
//                             v.setPos(nx,ny);
//                         }
//                     }
//                     newPop[i].resetDelaunayGraph((i,j) => {
//                         const vi = newPop[i].vertices.get(i);
//                         const vj = newPop[j].vertices.get(j);
//                         return new ClientLink(i,j,vi,vj,"", ORIENTATION.UNDIRECTED, "black", "", local_board.view)
//                     });

//                     const stretch = newPop[i].stretch();
//                     sumStretch += stretch;
//                     if (maxStretch == undefined){
//                         maxStretch = stretch;
//                     } else if (stretch > maxStretch){
//                         maxStretch = stretch;
//                     }

//                     g.pasteGraph(newPop[i]);
//                     break;
//                 } 
//                 s += fitness[j];
//             }
//         }
//         console.log((100*minFitness).toFixed(2),(100*maxFitness).toFixed(2), (sumStretch/popSize).toFixed(3), maxStretch.toFixed(3));



//     }

//     paramStretchGeneticMaximizer.compute(g, false);

//     if (maxStretch){
//         return String(maxStretch.toFixed(3));
//     } else {
//         return "/"
//     }
// });





// -----------------

export let param_is_good_weight = new Parametor("Is good weight for our problem ?", "isgood", "isgood", "Paramètre trop stylé", true, true, [SENSIBILITY.ELEMENT, SENSIBILITY.WEIGHT], false);

param_is_good_weight.compute = ((g: ClientGraph) => {
    const FW = g.Floyd_Warhall( true);

    for (const v_index of g.vertices.keys()) {
        for (const u_index of g.vertices.keys()) {
            if (u_index != v_index) {
                for (const w_index of g.vertices.keys()) {
                    if (w_index != u_index && w_index != v_index) {
                        if (FW.distances.get(u_index).get(v_index) == FW.distances.get(v_index).get(w_index)) {
                            g.vertices.get(v_index).data.color = "red";
                            g.vertices.get(u_index).data.color = "purple";
                            g.vertices.get(w_index).data.color = "purple";
                            return "false";
                        }
                    }
                }
            }
        }
    }
    return "true";
})

// -----------------

export const param_weighted_distance_identification = new Parametor("Weighted distance identification number", "wdin", "wdin", "Weighted distance identification number", false, false, [SENSIBILITY.ELEMENT, SENSIBILITY.WEIGHT], false);

param_weighted_distance_identification.compute = ((g: ClientGraph) => {
    console.log("compute TIME");
    console.time('wdi')
    let k = 1;

    if (g.is_connected() == false) {
        return "NC";
    }

    while (true) {
        console.log("k = ", k);
  
        const heap = new Array<ClientLink>();
        for (const link of g.links.values()) {
            heap.push(link);
            link.data.weight = String(1);
        }

        while (true) {
            if (test(g)) {
                const debug = new Array();
                for (const link of g.links.values()) {
                    debug.push(link.data.weight);
                }
                console.log("try ", debug);
                console.timeEnd('wdi')
                return String(k);
            }

            // k k 1 2 3

            let b = 0;
            let done = false;
            while (b < heap.length && heap[b].data.weight == String(k)) {
                heap[b].data.weight = String(1);
                b += 1;
            }
            if (b == heap.length) {
                done = true; k++;
                break;
            } else {
                heap[b].data.weight = String(parseInt(heap[b].data.weight) + 1);
            }
        }
    }
})


export const param_wdin2 = new Parametor("Weighted distance identification number (for trees)", "wdin2", "wdin2", "Weighted distance identification number", false, false, [SENSIBILITY.ELEMENT, SENSIBILITY.WEIGHT], false);

param_wdin2.compute = ((g: ClientGraph) => {
    console.time("wdin2")

    if (g.is_connected() == false) {
        return "NC";
    }

    let k = g.max_degree();
    while (true) {
        console.log("try k = ", k);
        if ( wdin2_search(g, k)){
            const debug = new Array();
            for (const [link_index, link] of g.links.entries()) {
                debug.push(link.data.weight);
                link.setWeight(link.data.weight);
            }
            console.log("solution: ", debug);
            console.timeEnd("wdin2");
            return String(k);
        }
        k ++;
    }
})

function wdin2_order(g: ClientGraph, ordered_links: Array<number>, association: Array<number>){
    const no = ordered_links.length;
    const i = g.links.size;
    if ( i == 0 ){
        return;
    }
    if ( i == 1){
        for ( const link_index of g.links.keys()){
            association.push(ordered_links.length);
            ordered_links.push(link_index);
        }
        return;
    }
    const bridge_index = g.max_cut_edge();
    const bridge = g.links.get(bridge_index);
    g.links.delete(bridge_index);
    const g1 = g.get_connected_component_of(bridge.startVertex.index) as ClientGraph;
    const g2 = g.get_connected_component_of(bridge.endVertex.index) as ClientGraph;
    wdin2_order(g1, ordered_links, association);
    wdin2_order(g2, ordered_links, association);
    g.links.set(bridge_index, bridge);
    association.push(no);
    ordered_links.push(bridge_index);
    
}

// g is supposed connected
function wdin2_search(g: ClientGraph, k: number): boolean{
    const m = g.links.size;
    const ordered_links = new Array<number>();
    const association = new Array<number>();
    wdin2_order(g,ordered_links, association);

    const olinks = new Array();
    for ( let i = 0 ; i < ordered_links.length ; i ++){
        olinks.push( g.links.get(ordered_links[i]));
        olinks[i].weight = String(1);
    }

    const subgraph = new Array();
    const constraints = new Array<Array<Array<[number,boolean]>>>();
    for (let i = 0 ; i < m ; i ++){
        const newg = new ClientGraph();
        for ( let j = association[i]; j <= i ; j ++){
            const link = g.links.get(ordered_links[j]);
            const start_vertex = link.startVertex;
            newg.set_vertex(link.startVertex.index, start_vertex.data);
            const end_vertex = link.endVertex;
            newg.set_vertex(link.endVertex.index, end_vertex.data)
            newg.links.set(ordered_links[j], link);
            newg.setLink(ordered_links[j], link.startVertex.index, link.endVertex.index, link.orientation, link.data);
        } 
        subgraph.push(newg);
        constraints.push(make_constraints(newg, ordered_links[i]));
    }



    let i_init = 0;
    while (true){
        let is_ok = true;
        for ( let i = i_init; i < m ; i ++){
            if ( test2(subgraph[i], constraints[i]) == false){ 
            //if ( test(subgraph[i]) == false){ 
                // compute next weight on [ass[i],i] links
                let b = i;
                while (b >= 0 && olinks[b].weight == String(k)) {
                    olinks[b].weight = String(1);
                    b -= 1;
                }
                if (b == -1) {
                    return false;
                } else {
                    i_init = association[b];
                    olinks[b].weight = String(parseInt(olinks[b].weight) + 1);
                }
                
                for (let j = i+1 ; j < m ; j ++){
                    olinks[j].weight = String(1);
                }
                is_ok = false;
                break;
            }
        }
        if (is_ok){
            return true;
        }
    }
}

function test2(g: ClientGraph, constraints: Array<Array<[number,boolean]>>): boolean{
    for (const constraint of constraints){
        let sum = 0;
        for (const [link_index, b] of constraint){
            const weight = parseInt(g.links.get(link_index).data.weight);
            if ( b ){
                sum += weight;
            } else {
                sum -= weight;
            }
        }
        if (sum == 0){
            return false;
        }
    }
    return true;
}

// only for trees
function make_constraints(g: ClientGraph, bridge_index: number): Array<Array<[number,boolean]>>{
    const paths = new Map<number, Map<number,Array<number>>>();
    for ( const v_index of g.vertices.keys()){
        const paths_from_v = new Map<number,Array<number>>();
        const visited = new Set();
        const stack = new Array();
        stack.push(v_index);
        visited.add(v_index);
        paths_from_v.set(v_index, new Array<number>());
        while (stack.length > 0){
            const u_index = stack.pop();
            for ( const [link_index, link] of g.links.entries() ){
                if (link.orientation == ORIENTATION.UNDIRECTED){
                    if ( (link.startVertex.index == u_index && visited.has(link.endVertex.index) == false) || (link.endVertex.index == u_index && visited.has(link.startVertex.index) == false) ){
                        let n_index = link.endVertex.index;
                        if ( link.endVertex.index == u_index) { n_index = link.startVertex.index} 
                        stack.push(n_index);
                        visited.add(n_index);
                        const new_path = new Array<number>();
                        for ( const lindex of paths_from_v.get(u_index)){
                            new_path.push(lindex);
                        }
                        new_path.push(link_index);
                        paths_from_v.set(n_index, new_path);
                    }
                } 
            }
        }
        paths.set(v_index, paths_from_v);
    }

    const constraints = new Array<Array<[number,boolean]>>();
    for (const v_index of g.vertices.keys()) {
        for (const u_index of g.vertices.keys()) {
            if (u_index != v_index) {
                for (const w_index of g.vertices.keys()) {
                    if (w_index != u_index && w_index != v_index) {
                        if ( paths.get(v_index).get(u_index).indexOf(bridge_index) >= 0 || paths.get(v_index).get(w_index).indexOf(bridge_index) >= 0) {
                            const constraint = new Array<[number,boolean]>();
                            const path1 = paths.get(v_index).get(u_index);
                            const path2 = paths.get(v_index).get(w_index);
                            for ( const link_index of path1){
                                constraint.push([link_index, true]);
                            }
                            for (const link_index of path2){
                                constraint.push([link_index, false]);
                            }
                            constraints.push(constraint);
                        }
                        
                    }
                }
            }
        }
    }
    return constraints;
}


function test(g: ClientGraph): boolean {
    const FW = g.Floyd_Warhall(true);
    for (const v_index of g.vertices.keys()) {
        for (const u_index of g.vertices.keys()) {
            if (u_index != v_index) {
                for (const w_index of g.vertices.keys()) {
                    if (w_index != u_index && w_index != v_index) {
                        if (FW.distances.get(u_index).get(v_index) == FW.distances.get(v_index).get(w_index)) {
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
}




// --------------------

