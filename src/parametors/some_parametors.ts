
import { ClientGraph } from '../board/graph';
import { Parametor, SENSIBILITY } from './parametor';
import { AbstractGraph, ORIENTATION } from 'gramoloss';
import { ClientLink, ClientLinkData } from '../board/link';
import { ClientVertex } from '../board/vertex';
import { shuffle } from '../utils';
import { Color } from '../board/display/colors_v2';
import { ClientDegreeWidthRep } from '../board/representations/degree_width_rep';



export const paramMinimalSpanningTree = new Parametor("Minimal weighted spanning tree", 
"minimalWeightedSpanningTree", "minWST", "Minimal weighted spanning tree", true, false, [SENSIBILITY.ELEMENT, SENSIBILITY.WEIGHT], false);

paramMinimalSpanningTree.compute = ((g: ClientGraph, verbose: boolean) => {
    const r = g.minimumSpanningTree();
    return [r[0].toString(), r[1]];
})

paramMinimalSpanningTree.showCertificate = ((g:ClientGraph, certificate: Array<ClientLink>) => {
    for (const link of certificate){
        link.data.highlight = 1;
    }
})

// ------------------
export const paramHasCycle = new Parametor("Has cycle?", "has_cycle", "?has_cycle", "Check if the graph has an undirected cycle", true, true, [SENSIBILITY.ELEMENT], false);

paramHasCycle.compute = ((g: ClientGraph, verbose: boolean) => {
    const r = g.hasCycle2();
    return [String(r[0]), r[1]];
});

paramHasCycle.showCertificate = (g: ClientGraph, cycle: Array<number>) => {
    for (let i = 0; i < cycle.length; i ++){
        const vId = cycle[i];
        const v = g.vertices.get(vId);
        if (typeof v != "undefined"){
            v.data.highlight = 0;
        }

        const nextId = cycle[(i+1)%cycle.length];
        for (const link of g.links.values()){
            if (link.signatureEquals(vId, nextId, ORIENTATION.UNDIRECTED)){
                link.data.highlight = 0;
                break;
            }
        }
    }
}

// ------------------
export const paramHasDirectedCycle = new Parametor("Has directed cycle?", "has_directed_cycle", "?has_directed_cycle", "Check if the graph has a directed cycle", true, true, [SENSIBILITY.ELEMENT], false);

paramHasDirectedCycle.compute = ((g: ClientGraph) => {
    return [String(g.hasDirectedCycleRecursive()), new Array()];
})

paramHasDirectedCycle.showCertificate = (g: ClientGraph, cycle: Array<number>) => {
    for (let i = 0; i < cycle.length; i ++){
        const vId = cycle[i];
        const v = g.vertices.get(vId);
        if (typeof v != "undefined"){
            v.data.highlight = 0;
        }

        const nextId = cycle[(i+1)%cycle.length];
        for (const link of g.links.values()){
            if (link.signatureEquals(vId, nextId, ORIENTATION.UNDIRECTED)){
                link.data.highlight = 0;
                break;
            }
        }
    }
}


// ------------------
export let paramNbVertices = new Parametor("Vertices number", "vertex_number", "#vertices", "Print the number of vertices", true, false, [SENSIBILITY.ELEMENT], true);

paramNbVertices.compute = ((g: ClientGraph) => {
    return [String(g.vertices.size), undefined]
})


export let paramNbEdges = new Parametor("Edges number", "edge_number", "#edges", "Print the number of edges", true, false, [SENSIBILITY.ELEMENT], true);

paramNbEdges.compute = ((g: ClientGraph) => {
    let counter = 0;
    for (var link of g.links.values()) {
        if (link.orientation == ORIENTATION.UNDIRECTED) {
            counter++;
        }
    }
    return [String(counter), undefined];
})





export const paramIsConnected = new Parametor("Is connected?", "is_connected", "is connected?", "Is the graph/area connected?", true, true, [SENSIBILITY.ELEMENT], true);

paramIsConnected.compute = ((g: ClientGraph) => {
    return [String(g.isConnected()), undefined];
});



export const paramNbConnectedComp = new Parametor("Number connected component", "number_connected_comp", "#connected comp.", "Compute the number of connected component (undirected)", true, false, [SENSIBILITY.ELEMENT], true);

paramNbConnectedComp.compute = ((g: ClientGraph) => {

    if (g.vertices.size < 1) {
        return ["0", undefined];
    }
    const visited = new Map();
    for (const index of g.vertices.keys()) {
        visited.set(index, false);
    }

    let cc = 0;
    let all_visited = false;
    const component = new Map<number, number>()
    for (const index of g.vertices.keys()){
        component.set(index, -1);
    }

    while (!all_visited) {
        all_visited = true;
        let first_vertex_index = 0;

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

        g.DFSrecursive( first_vertex_index, visited);
        
        // Visited vertex which has no component assignation, is in component cc
        for (const index of g.vertices.keys()){
            const isVisited = visited.get(index);
            const comp = component.get(index);
            if ( typeof isVisited != "undefined" && isVisited && typeof comp != "undefined" && comp == -1  ){
                component.set(index, cc);
            }
        }

    }
    return [String(cc), component ];
});

paramNbConnectedComp.showCertificate = (g:ClientGraph, component: Map<number, number>) => {
    for (const v of g.vertices.values()){
        const c = component.get(v.index);
        if (typeof c != "undefined"){
            v.data.highlight = c;
        }
    }
}




export let paramNumberColors = new Parametor("Number vertex colors", "nb_vertex_colors", "#colors (vertices)", "Print the number of different colors used on the vertices", true, false, [SENSIBILITY.ELEMENT, SENSIBILITY.COLOR], true);

paramNumberColors.compute = ((g: ClientGraph) => {
    let colors_set = new Set<string>();
    for (const v of g.vertices.values()) {
        colors_set.add(v.data.color);
    }
    return [String(colors_set.size), undefined];
});


export const paramIsDrawingPlanar = new Parametor("Is drawing planar?", "is_drawing_planar", "is_drawing_planar", "Return true iff drawing is planar", true, true, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], true);

paramIsDrawingPlanar.compute = ((g: ClientGraph) => {
    console.log("is drawing planar update");
    const crossings = g.crossings();
    console.log(crossings);
    const result = crossings.length == 0 ? "true" : "false";
    return [result, crossings];
});

paramIsDrawingPlanar.showCertificate = (g: ClientGraph, crossings: Array<[number, number]>) => {
    for (const [lId1, lId2] of crossings){
        const link1 = g.links.get(lId1);
        const link2 = g.links.get(lId2);
        if (typeof link1 != "undefined" && typeof link2 != "undefined"){
            link1.data.highlight = 0;
            link2.data.highlight = 0;
        }
    }
}


export const paramMinDegree = new Parametor("Minimum degree", "min_degree", "min degree", "Print the minimum degree", true, false, [SENSIBILITY.ELEMENT], true);

paramMinDegree.compute = ((g: ClientGraph, verbose: boolean) => {
    const data = g.getDegreesData();
    const minVertices = new Array();
    for (const v of g.vertices.values()){
        if (data.min_value == g.degree(v.index)){
            minVertices.push(v);
        }
    }
    return [String(data.min_value), minVertices];
});

paramMinDegree.showCertificate = (g: ClientGraph, minVertices: Array<ClientVertex>) => {
    for (const v of minVertices){
        v.data.highlight = 0;
    }
}

export let paramMinIndegree = new Parametor("Mininum in-degree", "min_indegree", "min_indegree", "Minimum indegree", true, false, new Array(SENSIBILITY.ELEMENT), false);

paramMinIndegree.compute = ((g: ClientGraph, verbose) => {
    const md = g.minIndegree();
    const minVertices = new Array();
    for (const v of g.vertices.values()){
        if (md == g.inDegree(v.index)){
            minVertices.push(v);
        }
    }
    return [String(md), minVertices];
});

paramMinIndegree.showCertificate = (g: ClientGraph, minVertices: Array<ClientVertex>) => {
    for (const v of minVertices){
        v.data.highlight = 0;
    }
}

export let paramMaxIndegree = new Parametor("Maximum in-degree", "max_indegree", "max_indegree", "Maximum in-degree", true, false, new Array(SENSIBILITY.ELEMENT), false);

paramMaxIndegree.compute = ((g: ClientGraph, verbose) => {
    const md = g.maxIndegree();
    const vertices = new Array();
    for (const v of g.vertices.values()){
        if (md == g.inDegree(v.index)){
            vertices.push(v);
        }
    }
    return [String(md), vertices];
});

paramMaxIndegree.showCertificate = (g: ClientGraph, vertices: Array<ClientVertex>) => {
    for (const v of vertices){
        v.data.highlight = 0;
    }
}

export let paramMinOutdegree = new Parametor("Minimum out-degree", "min_out_degree", "min_out_degree", "Minimum out-degree", true, false, new Array(SENSIBILITY.ELEMENT), false);

paramMinOutdegree.compute = ((g: ClientGraph, verbose) => {
    const md = g.minOutdegree();
    const vertices = new Array();
    for (const v of g.vertices.values()){
        if (md == g.outDegree(v.index)){
            vertices.push(v);
        }
    }
    return [String(md), vertices];
});

paramMinOutdegree.showCertificate = (g: ClientGraph, vertices: Array<ClientVertex>) => {
    for (const v of vertices){
        v.data.highlight = 0;
    }
}

export let paramMaxOutdegree = new Parametor("Maximum out-degree", "max_out_degree", "max_out_degree", "Maximum out-degree", true, false, new Array(SENSIBILITY.ELEMENT), false);

paramMaxOutdegree.compute = ((g: ClientGraph, verbose) => {
    const md = g.maxOutdegree();
    const vertices = new Array();
    for (const v of g.vertices.values()){
        if (md == g.outDegree(v.index)){
            vertices.push(v);
        }
    }
    return [String(md), vertices];
});

paramMaxOutdegree.showCertificate = (g: ClientGraph, vertices: Array<ClientVertex>) => {
    for (const v of vertices){
        v.data.highlight = 0;
    }
}




export let paramMaxDegree = new Parametor("Maximum degree", "max_degree", "max degree", "Print the minimum degree", true, false, [SENSIBILITY.ELEMENT], true);

paramMaxDegree.compute = ((g: ClientGraph, verbose: boolean) => {
    const data = g.getDegreesData();
    return [String(data.max_value), data.max_vertices];
});

paramMaxDegree.showCertificate = (g: ClientGraph, certificate: Set<number>) =>  {
    for (const vId of certificate){
        const v = g.vertices.get(vId);
        if (typeof v != "undefined"){
            v.data.highlight = 0;
        }
    }
}

export let paramAverageDegree = new Parametor("Average degree", "avg_degree", "avg. degree", "Print the average degree", true, false, [SENSIBILITY.ELEMENT], true);

paramAverageDegree.compute = ((g: ClientGraph) => {
    // Remark : If no loop, we can simply use that sum(degree) = 2|E| so avg(degree) = 2|E|/|V|
    const data = g.getDegreesData();
    const avg = Math.round((data.avg + Number.EPSILON) * 100) / 100

    return [String(avg), undefined];
});


export let paramIsProperColoring = new Parametor("Proper vertex-coloring?", "has_proper_coloring", "proper vertex-coloring?", "Print if the current coloring of the vertices is proper or not", true, true, [SENSIBILITY.ELEMENT, SENSIBILITY.COLOR], true);

paramIsProperColoring.compute = ((g: ClientGraph) => {

    if (g.vertices.size == 0) {
        return ["true", undefined];
    }

    const visited = new Set<number>();
    const [vStart] = g.vertices.values(); 
    const S = Array<ClientVertex>(vStart);

    while (S.length !== 0) {
        const v = S.pop();
        if (typeof v != "undefined" && !visited.has(v.index)) {
            visited.add(v.index);
            const neighbors = g.getNeighbors(v);
            for (const u of neighbors) {
                if (u.data.color === v.data.color) {
                    return ["false", [u,v]];
                }
                S.push(u);
            }
        }
    }

    return ["true", undefined];
});

paramIsProperColoring.showCertificate = (g: ClientGraph, certificate: Array<ClientVertex>) => {
    for (const v of certificate){
        v.data.highlight = 0;
    }
}




export let paramDiameter = new Parametor("Diameter", "diameter", "diameter", "Print the diameter of the graph", true, false, [SENSIBILITY.ELEMENT], true);

paramDiameter.compute = ((g: ClientGraph) => {
    const FW = g.FloydWarshall(undefined);
    let diameter = 0;
    const certificate = new Array();
    const shortestPath = new Array();

    for (const v_index of g.vertices.keys()) {
        for (const u_index of g.vertices.keys()) {
            const vDist = FW.distances.get(v_index);
            if (typeof vDist != "undefined"){
                const dist = vDist.get(u_index);
                if (typeof dist != "undefined" && diameter < dist ) {
                    diameter = dist;
                    certificate.splice(0, certificate.length);
                    certificate.push(u_index, v_index);
                    shortestPath.splice(0, shortestPath.length);
                    let currentId = u_index;
                    if (diameter == Infinity) continue;
                    while (currentId != v_index){
                        shortestPath.push(currentId);
                        const r = FW.next.get(currentId)?.get(v_index);
                        if (typeof r != "undefined"){
                            currentId = r;
                        } else {
                            break;
                        }
                    }
                    shortestPath.push(v_index);
                    
                }
            }
        }
    }

    if (diameter === Infinity) {
        return [String("+∞"), certificate]
    }
    return [String(diameter), shortestPath];
});

paramDiameter.showCertificate = (g: ClientGraph, certificate: Array<number>) => {
    const v0 = g.vertices.get(certificate[0]);
    if (typeof v0 != "undefined"){
        v0.data.highlight = 1;
    }
    if (certificate.length == 1) return;
    const v1 = g.vertices.get(certificate[certificate.length-1]);
    if (typeof v1 != "undefined"){
        v1.data.highlight = 1;
    }

    for (let i = 0; i+1 < certificate.length; i ++){
        const v = g.vertices.get(certificate[i]);
        const w = g.vertices.get(certificate[i+1]);
        if (typeof v != "undefined" && typeof w != "undefined"){
            for (const link of g.links.values()){
                if (link.signatureEquals(v.index, w.index, ORIENTATION.UNDIRECTED)){
                    link.data.highlight = 1;
                }
            }
        }
    }
}

// -----------------
export const paramDelaunayConstructor = new Parametor("Delaunay constructor", "delaunay", "delaunay", "Resets the edges of the graph", true, false, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], false);

paramDelaunayConstructor.compute = ((g: ClientGraph) => {
    g.resetDelaunayGraph((i,j) => {
        return new ClientLinkData(undefined, Color.Neutral, "", g.board.camera);
    });
    return [String("/"), undefined];
});


// -----------------
export const paramStretch = new Parametor("Stretch", "stretch", "stretch", "Computes the stretch", true, false, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], false);

paramStretch.compute = ((g: ClientGraph) => {
    const [stretch, path] = g.stretch();
    if (typeof stretch != "undefined"){
        return [String(stretch.toFixed(3)), path];
    } else {
        return ["NAN", new Array()]
    }
});

paramStretch.showCertificate = (g: ClientGraph, certificate: Array<number>) => {
    if (certificate.length <= 0) return;
    const v0 = g.vertices.get(certificate[0]);
    if (typeof v0 != "undefined"){
        v0.data.highlight = 1;
    }
    if (certificate.length == 1) return;
    const v1 = g.vertices.get(certificate[certificate.length-1]);
    if (typeof v1 != "undefined"){
        v1.data.highlight = 1;
    }

    for (let i = 0; i+1 < certificate.length; i ++){
        const v = g.vertices.get(certificate[i]);
        const w = g.vertices.get(certificate[i+1]);
        if (typeof v != "undefined" && typeof w != "undefined"){
            for (const link of g.links.values()){
                if (link.signatureEquals(v.index, w.index, ORIENTATION.UNDIRECTED)){
                    link.data.highlight = 1;
                }
            }
        }
    }
}


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
//                 const newVertex = new ClientVertex(pos.x,pos.y,"",local_board.camera);
//                 g.addVertex(newVertex);
//             }
//             local_board.rectangles.set(i, new ClientRectangle(c1, c2 , "gray", local_board.camera));
//             const subgraph = g.getSubgraphFromRectangle(c1,c2);
//             subgraph.resetDelaunayGraph((i,j) => {
//                 const vi = subgraph[i].vertices.get(i);
//                 const vj = subgraph[j].vertices.get(j);
//                 return new ClientLink(i,j,vi,vj,"", ORIENTATION.UNDIRECTED, "black", "", local_board.camera)
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
//                     newPop[i].translateByServerVect(new Vect(((i%nbRows)-(j%nbRows))*(w+margin),((Math.floor(i/nbRows))-(Math.floor(j/nbRows)))*(w+margin)), local_board.camera);

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
//                         return new ClientLink(i,j,vi,vj,"", ORIENTATION.UNDIRECTED, "black", "", local_board.camera)
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
    const FW = g.FloydWarshall( undefined);

    for (const v of g.vertices.values()) {
        for (const u of g.vertices.values()) {
            if (u.index != v.index) {
                for (const w of g.vertices.values()) {
                    if (w.index != u.index && w.index != v.index) {
                        const uDist = FW.distances.get(u.index);
                        const vDist = FW.distances.get(v.index);
                        if (typeof uDist == "undefined" || typeof vDist == "undefined") continue;
                        if (uDist.get(v.index) == vDist.get(w.index)) {
                            v.data.highlight = 0;
                            u.data.highlight = 1;
                            w.data.highlight = 1;
                            return ["false", undefined];
                        }
                    }
                }
            }
        }
    }
    return ["true", undefined];
})

// -----------------

export const param_weighted_distance_identification = new Parametor("Weighted distance identification number", "wdin", "wdin", "Weighted distance identification number", false, false, [SENSIBILITY.ELEMENT, SENSIBILITY.WEIGHT], false);

param_weighted_distance_identification.compute = ((g: ClientGraph) => {
    console.log("compute TIME");
    console.time('wdi')
    let k = 1;

    if (g.isConnected() == false) {
        return ["NC", undefined];
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
                return [String(k), undefined];
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

    if (g.isConnected() == false) {
        return ["NC", undefined];
    }

    let k = g.maxDegree();
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
            return [String(k), undefined];
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
    const bridge_index = g.maxCutEdge();
    const bridge = g.links.get(bridge_index);
    if (typeof bridge == "undefined") return;
    g.links.delete(bridge_index);
    const g1 = g.getConnectedComponentOf(bridge.startVertex.index) as ClientGraph;
    const g2 = g.getConnectedComponentOf(bridge.endVertex.index) as ClientGraph;
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
        const newg = new ClientGraph(g.board);
        for ( let j = association[i]; j <= i ; j ++){
            const link = g.links.get(ordered_links[j]);
            if (typeof link != "undefined"){
                const start_vertex = link.startVertex;
                newg.set_vertex(link.startVertex.index, start_vertex.data);
                const end_vertex = link.endVertex;
                newg.set_vertex(link.endVertex.index, end_vertex.data)
                newg.links.set(ordered_links[j], link);
                newg.setLink(ordered_links[j], link.startVertex.index, link.endVertex.index, link.orientation, link.data);
            }
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
        for (const [linkIndex, b] of constraint){
            const link = g.links.get(linkIndex);
            if (typeof link == "undefined") continue;
            const weight = parseInt(link.data.weight);
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
                        const pathsvu = paths_from_v.get(u_index);
                        if (typeof pathsvu == "undefined") continue;
                        for ( const lindex of pathsvu){
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
                        const pathv = paths.get(v_index);
                        if (typeof pathv == "undefined") continue;
                        const pathvu = pathv.get(u_index);
                        if (typeof pathvu == "undefined") continue;
                        const pathvw = pathv.get(w_index);
                        if (typeof pathvw == "undefined") continue;
                        if ( pathvu.indexOf(bridge_index) >= 0 || pathvw.indexOf(bridge_index) >= 0) {
                            const constraint = new Array<[number,boolean]>();
                            for ( const linkIndex of pathvu){
                                constraint.push([linkIndex, true]);
                            }
                            for (const linkIndex of pathvw){
                                constraint.push([linkIndex, false]);
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

    const FW = g.FloydWarshall(undefined);
    for (const v_index of g.vertices.keys()) {
        for (const u_index of g.vertices.keys()) {
            if (u_index != v_index) {
                for (const w_index of g.vertices.keys()) {
                    if (w_index != u_index && w_index != v_index) {
                        const du = FW.distances.get(u_index);
                        const dv = FW.distances.get(v_index);
                        if (typeof du == "undefined") continue;
                        if (typeof dv == "undefined") continue;
                        if (du.get(v_index) == dv.get(w_index)) {
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
}



// -------------------


export const paramFVSN = new Parametor("Feedback Vertex Set Number", "fvsn", "fvsn", "Feedback Vertex Set Number", false, false, [SENSIBILITY.ELEMENT], false);

paramFVSN.compute = ((g: ClientGraph) => {
    return [g.fvsn().toString(), undefined];
})


// -------------

export const paramMinQuasiKernel = new Parametor("Minimum Quasi Kernel", "minQuasiKernel", "minQK", "Minimum Quasi Kernel", true, false, [SENSIBILITY.ELEMENT], false);

paramMinQuasiKernel.compute = (g: ClientGraph) => {
    const minQK = g.minQuasiKernel();
    return [minQK.size.toString(), minQK];
}

paramMinQuasiKernel.showCertificate = (g: ClientGraph, quasiKernel: Set<number>) => {
    for (const vId of quasiKernel){
        const v = g.vertices.get(vId);
        if (typeof v != "undefined"){
            v.data.highlight = 1;
        }
    }
}





// --------------------
export const paramIsQuasiKernel = new Parametor("Is Quasi Kernel", "is_quasi_kernel", "isQK", "Is Quasi Kernel", true, true, [SENSIBILITY.ELEMENT, SENSIBILITY.COLOR, SENSIBILITY.WEIGHT], false);

paramIsQuasiKernel.compute = ((g: ClientGraph) => {

    for (const v of g.vertices.values()){
        if (v.data.color != Color.Neutral){
            for ( const neighbor of g.getOutNeighbors(v)){
                if (neighbor.data.color != Color.Neutral){
                    return ["false", undefined];
                }
            }
            continue;
        }
        let covered = false;
        for ( const neighbor of g.getOutNeighbors(v)){
            if (neighbor.data.color != Color.Neutral){
                covered = true;
                break;
            }
            for (const neighbor2 of g.getOutNeighbors(neighbor)){
                if (neighbor2.data.color != Color.Neutral){
                    covered = true;
                    break;
                }
            }
            if (covered){
                break;
            }
        }
        if (covered == false){
            return ["false", undefined];
        }
    }

    return ["true", undefined];

})


// --------



function getUncoveredVertex(g: ClientGraph): ClientVertex | undefined{
    let l = [...g.vertices.values()];
    l = shuffle(l);
    
    for (const v of l){
        if (v.data.color != Color.Neutral){
            continue;
        }
        let covered = false;
        for ( const neighbor of g.getOutNeighbors(v)){
            if (neighbor.data.color != Color.Neutral){
                covered = true;
                break;
            }
            for (const neighbor2 of g.getOutNeighbors(neighbor)){
                if (neighbor2.data.color != Color.Neutral){
                    covered = true;
                    break;
                }
            }
            if (covered){
                break;
            }
        }
        if (covered == false){
            return v;
        }
    }
    return undefined;
}




export const paramIsQKAlgoOK = new Parametor("Is Algo OK", "paramIsQKAlgoOK", "isQK", "Is Quasi Kernel", false, true, [SENSIBILITY.ELEMENT, SENSIBILITY.COLOR, SENSIBILITY.WEIGHT], false);

paramIsQKAlgoOK.compute = ((g: ClientGraph) => {
    console.log("compute");
    for (const v of g.vertices.values()){
        v.data.color = Color.Neutral;
    }

    let treated = new Set<number>();
    let v = getUncoveredVertex(g);
    while (typeof v != "undefined"){
        console.log(v.index);
        if (treated.has(v.index)){
            console.log("was treated");
            v.data.color = Color.Green;
            for (const neighbor of g.getOutNeighbors(v)){
                neighbor.data.color = Color.Neutral;
            }
            for (const neighbor of g.getInNeighbors(v)){
                neighbor.data.color = Color.Neutral;
            }
        } else {
            treated.add(v.index);
            for (const outNeighbor of shuffle(g.getOutNeighbors(v)) ){
                outNeighbor.data.color = Color.Green;
                for (const outNeighbor2 of g.getOutNeighbors(outNeighbor)){
                    outNeighbor2.data.color = Color.Neutral;
                }
                for (const inNeighbor2 of g.getInNeighbors(outNeighbor)){
                    inNeighbor2.data.color = Color.Neutral;
                }
                break;
            }
        }

        v = getUncoveredVertex(g);
    }

    let colored = [];
    let counter = 0;
    for (const v of g.vertices.values()){
        if (v.data.color != Color.Neutral){
            counter ++;
            colored.push(v.index);
        }
    }
    return [2*counter <= g.vertices.size ? "true": "false", undefined];

})


export const paramVertexCover = new Parametor("Vertex cover number", "vertexCoverNumber", "VC", "Vertex cover number", false, false, [SENSIBILITY.ELEMENT], false);

paramVertexCover.compute = ((g: ClientGraph) => {
    const minVC = g.minVertexCover();
    return [minVC.size.toString(), minVC];
})

paramVertexCover.showCertificate = ((g: ClientGraph, vertexCover: Set<number>) => {
    for (const vIndex of vertexCover){
        const v = g.vertices.get(vIndex);
        if (typeof v != "undefined"){
            v.data.highlight = 1;
        }
    }
})


export const paramCliqueNumber = new Parametor("Clique number", "cliqueNumber", "w", "Clique number", false, false, [SENSIBILITY.ELEMENT], false);

paramCliqueNumber.compute = ((g: ClientGraph) => {
    const maxClique = g.maximumClique();
    return [maxClique.size.toString(), maxClique];
});

paramCliqueNumber.showCertificate = (g: ClientGraph, clique: Set<number>) =>{
    for (const vId of clique){
        const v = g.vertices.get(vId);
        if (typeof v != "undefined"){
            v.data.highlight = 1;
        }
    }
}


export const paramChromaticNumber = new Parametor("Chromatic number", "chromaticNumber", "χ", "Chromatic number", false, false, [SENSIBILITY.ELEMENT], false);

paramChromaticNumber.compute = ((g: ClientGraph) => {
    const minColoring = g.minimalProperColoring();
    const colors = new Set<number>();
    for (const color of minColoring.values()){
        colors.add(color);
    }

    return [colors.size.toString(), minColoring];
})

paramChromaticNumber.showCertificate = (g: ClientGraph, coloring: Map<number, number>) => {
    for (const [vId, colorId] of coloring){
        const v = g.vertices.get(vId);
        if (typeof v != "undefined"){
            v.data.highlight = colorId;
        }
    }
}


export const paramChromaticIndex = new Parametor("Chromatic index", "chromaticIndex", "χ'", "Chromatic index", false, false, [SENSIBILITY.ELEMENT], false);

paramChromaticIndex.compute = ((g: ClientGraph) => {
    const cliques = new Set<Set<number>>();
    for (const i of g.vertices.keys()){
        const clique = new Set<number>();
        for (const link of g.links.values()){
            if (link.startVertex.index == i || link.endVertex.index == i){
                clique.add(link.index);
            }
        }
        cliques.add(clique);
    }

    const lineGraph = AbstractGraph.lineGraph(g);
    const minColoring = lineGraph.minimalProperColoring(cliques);
    const colors = new Set<number>();
    for (const color of minColoring.values()){
        colors.add(color);
    }
    return [colors.size.toString(), minColoring];
})

paramChromaticIndex.showCertificate = (g: ClientGraph, coloring: Map<number, number>) => {
    for (const [vId, colorId] of coloring){
        const l = g.links.get(vId);
        if (typeof l != "undefined"){
            l.data.highlight = colorId;
        }
    }
}


export const paramGeomChromaticIndex = new Parametor("Geometric chromatic index", "paramGCI", "gci", "Geometric chromatic index", false, false, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], false);

paramGeomChromaticIndex.compute = ((g: ClientGraph) => {

    const cliques = new Set<Set<number>>();
    for (const i of g.vertices.keys()){
        const clique = new Set<number>();
        for (const link of g.links.values()){
            if (link.startVertex.index == i || link.endVertex.index == i){
                clique.add(link.index);
            }
        }
        cliques.add(clique);
    }

    const glg = AbstractGraph.geometricLineGraph(g);
    const coloring = glg.minimalProperColoring(cliques);

    const colors = new Set<number>();
    for (const color of coloring.values()){
        colors.add(color);
    }

    return [colors.size.toString(), coloring];
})

paramGeomChromaticIndex.showCertificate = (g: ClientGraph, coloring: Map<number, number>) => {
    for (const [vId, colorId] of coloring){
        const l = g.links.get(vId);
        if (typeof l != "undefined"){
            l.data.highlight = colorId;
        }
    }
}


export const paramDegreeWidth = new Parametor("Degreewidth of tournaments", "paramDW", "dw", "Degreewidth", false, false, [SENSIBILITY.ELEMENT], false);

paramDegreeWidth.compute = ((g: ClientGraph) => {

    if (g.vertices.size <= 0){
        return ["0", undefined];
    }

    const [dw, ordering] = g.degreewidth();
    console.log("DW optimal ordering: ", ordering);

    for (const repre of g.board.representations.values()){
        if (repre instanceof ClientDegreeWidthRep){
            const length = Math.abs(repre.c1.x - repre.c2.x);
            for (let i = 0; i < ordering.length; i ++){
                repre.x.set(ordering[i], i);
            }
            repre.distribute();
        }
    }

    return [dw.toString(), undefined];
});


