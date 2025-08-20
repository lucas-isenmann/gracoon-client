
import { Parametor, SENSIBILITY } from './parametor';
import { AbstractGraph, DominationVariant, EmbeddedGraph, ORIENTATION, Vertex } from 'gramoloss';
import { shuffle } from '../utils';
import { Color } from '../board/display/colors_v2';
import { ClientDegreeWidthRep } from '../board/representations/degree_width_rep';
import { BoardElementType, ClientBoard } from '../board/board';
import { Graph2, VertexData2 } from '../board/graph2';
import { BoardVertex } from '../board/elements/vertex';
import { color } from '@codemirror/theme-one-dark';




export const paramNumberArcs = new Parametor(
    "Number of arcs",
    "nb_arcs",
    "nb_arcs",
    "Number of arcs",
    true,
    false,
    [SENSIBILITY.ELEMENT],
    false
);

paramNumberArcs.compute = (g: Graph2, verbose: boolean) => {
    let nbArcs = 0;
    for (const link of g.links.values()){
        if (link.orientation == ORIENTATION.DIRECTED){
            nbArcs ++;
        }
    }
    return [nbArcs.toString(), []];
}

export const paramNumberLinks = new Parametor(
    "Number of links (edges or arcs)",
    "nb_links",
    "nb_links",
    "Number of inks (edges or arcs)",
    true,
    false,
    [SENSIBILITY.ELEMENT],
    false
);

paramNumberLinks.compute = (g: Graph2, verbose: boolean) => {
    return [g.links.size.toString(), []];
}





// -----------------------------------------

export const paramDichromaticNumber = new Parametor(
    "Dichromatic number",
    "dichromatic_nb",
    "dchr",
    "Dichromatic number",
    true,
    false,
    [SENSIBILITY.ELEMENT],
    false
);





paramDichromaticNumber.compute = (g: Graph2, verbose: boolean) => {
    const minColoring = g.minimumProperDicoloring();

    const coloring = new Map();
    for (let i = 0; i < minColoring.length; i ++){
        coloring.set(i,  minColoring[i]);
    }
    const colors = new Set<number>();
    for (const color of minColoring.values()){
        colors.add(color);
    }
    return [colors.size.toString(), coloring];
}

paramDichromaticNumber.showCertificate = ((board: ClientBoard, coloring: Map<number, number>) => {
    for (const [vId, colorId] of coloring){
        board.highlight([[BoardElementType.Vertex, vId, colorId]])
    }
})



// -----------------------------------------

export const paramIsLight = new Parametor(
    "Is light?",
    "is_light",
    "is_light",
    "Is light",
    true,
    true,
    [SENSIBILITY.ELEMENT],
    false
);


paramIsLight.compute= ((g: Graph2, verbose: boolean) => {
    const conflict = g.lightnessConflict();
    console.log(conflict)
    if (typeof conflict == "undefined"){
        return ["true", []];
    } else {
        return ["false", conflict]
    }
})

paramIsLight.showCertificate = ((board: ClientBoard, conflict: Array<number>) => {
    for (let i = 0 ; i < conflict.length; i ++){
        if (i == 0){
            board.highlightVertex(conflict[i], 0)
        }
        if (i == 1){
            board.highlightVertex(conflict[i], 1)
        }
        if (i > 1){
            board.highlightVertex(conflict[i], 2)
        }
    }
})


// Has tournament a light extension?


export const paramHasLightExtension = new Parametor(
    "Has tournament light extension?",
    "has_light_extension",
    "has_light_extension",
    "has_light_extension",
    true,
    true,
    [SENSIBILITY.ELEMENT],
    false
);


paramHasLightExtension.compute= ((g: Graph2, verbose: boolean) => {
    const b = g.hasLightExtension();

    if (b){
        return ["true", []];
    } else {
        return ["false", []]
    }
})





// -----------------------------------------------------------------

export const paramIsLightCritic = new Parametor(
    "Is light critic?",
    "is_light_critic",
    "is_light_critic",
    "Is light critic?",
    true,
    true,
    [SENSIBILITY.ELEMENT],
    false
);


paramIsLightCritic.compute= ((g: Graph2, verbose: boolean) => {
    const conflict = g.lightnessConflict();
    
    if (typeof conflict == "undefined"){

        // Copy g
        const h = new AbstractGraph();
        for (const [id, v] of g.vertices){
            h.setVertex(id, undefined);
        }

        for (const [id, link] of g.links){
            const id1 = link.startVertex.index;
            const id2 = link.endVertex.index;
            h.addLink(id1, id2, ORIENTATION.DIRECTED);
        }

        const u = h.addVertex();

        const todo = new Array<[number, number]>();
        const done = new Array<[number, number, number]>();

        for (const [id2, w] of g.vertices){
            if (u.index < id2){
                todo.push([u.index, id2]);
            } else {
                todo.push([id2, u.index]);
            }
        }

        let finito = false;
        while (finito == false){
            const r = todo.pop();
            if (typeof r != "undefined"){
                const [x,y] = r;
                const addedArc = h.addLink(x, y, ORIENTATION.DIRECTED);
                if (typeof addedArc != "undefined"){
                    if (h.isTournamentLight() == false){
                        h.deleteLink(addedArc.index);
                        if ( y > x){
                            // Rembobiner
                            while (true){
                                const r2 = done.pop();
                                if (typeof r2 == "undefined"){
                                    // Finito
                                    finito = true;
                                    break;
                                } else {
                                    const [a,b, arcId] = r2;
                                    h.deleteLink(arcId);
                                    
                                    if (a < b ){
                                        todo.push([b,a]);
                                        break;
                                    } else {
                                        todo.push([a,b]);
                                    }
                                }
                            }
                        }
                    } else {
                        done.push([x,y, addedArc.index]);
                    }
                }
            } else {
                // On a tout mis et c'est light
                // Check si c'est un twin
                let is_twin = true;
                for (const [id, v] of g.vertices){
                    
                }

                // Sinon return true

                // Rembobiner
                while (true){
                    const r2 = done.pop();
                    if (typeof r2 == "undefined"){
                        // Finito
                        finito = true;
                        break;
                    } else {
                        const [a,b, arcId] = r2;
                        h.deleteLink(arcId);
                        
                        if (a < b ){
                            todo.push([b,a]);
                            break;
                        } else {
                            todo.push([a,b]);
                        }
                    }
                }

            }
        }




        return ["true", []];
    } else {
        return ["false", conflict]
    }
})

paramIsLightCritic.showCertificate = ((board: ClientBoard, conflict: Array<number>) => {
    for (let i = 0 ; i < conflict.length; i ++){
        if (i == 0){
            board.highlightVertex(conflict[i], 0)
        }
        if (i == 1){
            board.highlightVertex(conflict[i], 1)
        }
        if (i > 1){
            board.highlightVertex(conflict[i], 2)
        }
    }
})




// ------------------
export const paramHasCycle = new Parametor("Has cycle?", "has_cycle", "?has_cycle", "Check if the graph has an undirected cycle", true, true, [SENSIBILITY.ELEMENT], false);

paramHasCycle.compute= ((g: Graph2, verbose: boolean) => {
    const r = g.hasCycle2();
    return [String(r[0]), r[1]];
});

paramHasCycle.showCertificate = (board: ClientBoard, cycle: Array<number>) => {
    for (let i = 0; i < cycle.length; i ++){
        const vId = cycle[i];
        board.highlightVertex(vId, 0)

        const nextId = cycle[(i+1)%cycle.length];
        for (const link of board.g.links.values()){
            if (link.signatureEquals(vId, nextId, ORIENTATION.UNDIRECTED)){
                board.highlightLink(link.index, 0)
                break;
            }
        }
    }
}

// -------------------------
export const paramGirth = new Parametor("Girth", "girth", "girth", "Shortest cycle", true, false, [SENSIBILITY.ELEMENT], false);

paramGirth.compute= ((g: Graph2, verbose: boolean) => {
    const cycle = g.shortestCycle();
    if (cycle.length == 0){
        return ["+∞", []];
    } else {
        return [cycle.length.toString(), cycle];
    }
    
});

paramGirth.showCertificate = (board: ClientBoard, cycle: Array<number>) => {
    for (let i = 0; i < cycle.length; i ++){
        const vId = cycle[i];
        board.highlightVertex(vId, 0);

        const nextId = cycle[(i+1)%cycle.length];
        for (const link of board.g.links.values()){
            if (link.signatureEquals(vId, nextId, ORIENTATION.UNDIRECTED)){
                board.highlightLink(link.index, 0)
                break;
            }
        }
    }
}

// ------------------
export const paramHasDirectedCycle = new Parametor("Has directed cycle?", "has_directed_cycle", "?has_directed_cycle", "Check if the graph has a directed cycle", true, true, [SENSIBILITY.ELEMENT], false);

paramHasDirectedCycle.compute= ((g: Graph2) => {
    const cycle = g.getDirectedCycle();
    if (typeof cycle == "undefined"){
        return [String(false), cycle];
    } else {
        return [String(true), cycle];
    }

    
})

paramHasDirectedCycle.showCertificate = (board: ClientBoard, cycle: Array<number>) => {
    for (let i = 0; i < cycle.length; i ++){
        const vId = cycle[i];
        board.highlightVertex(vId, 1);

        const nextId = cycle[(i+1)%cycle.length];
        for (const link of board.g.links.values()){
            if (link.signatureEquals(nextId, vId, ORIENTATION.DIRECTED)){
                board.highlightLink(link.index, 1)
                break;
            }
        }
    }
}


// ------------------
export let paramNbVertices = new Parametor("Vertices number", "vertex_number", "#vertices", "Print the number of vertices", true, false, [SENSIBILITY.ELEMENT], true);

paramNbVertices.compute= ((g: Graph2) => {
    return [String(g.vertices.size), undefined]
})


export let paramNbEdges = new Parametor("Edges number", "edge_number", "#edges", "Print the number of edges", true, false, [SENSIBILITY.ELEMENT], true);

paramNbEdges.compute= ((g: Graph2) => {
    let counter = 0;
    for (var link of g.links.values()) {
        if (link.orientation == ORIENTATION.UNDIRECTED) {
            counter++;
        }
    }
    return [String(counter), undefined];
})





export const paramIsConnected = new Parametor("Is connected?", "is_connected", "is connected?", "Is the graph/area connected?", true, true, [SENSIBILITY.ELEMENT], true);

paramIsConnected.compute= ((g: Graph2) => {
    return [String(g.isConnected()), undefined];
});



export const paramNbConnectedComp = new Parametor("Number connected component", "number_connected_comp", "#connected comp.", "Compute the number of connected component (undirected)", true, false, [SENSIBILITY.ELEMENT], true);

paramNbConnectedComp.compute= ((g: Graph2) => {

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

paramNbConnectedComp.showCertificate = (board: ClientBoard, component: Map<number, number>) => {
    for (const [serverId, value] of component){
        board.highlightVertex(serverId, value);
    }
}




export let paramNumberColors = new Parametor("Number vertex colors", "nb_vertex_colors", "#colors (vertices)", "Print the number of different colors used on the vertices", true, false, [SENSIBILITY.ELEMENT, SENSIBILITY.COLOR], true);

paramNumberColors.compute= ((g: Graph2) => {
    let colors_set = new Set<string>();
    for (const v of g.vertices.values()) {
        colors_set.add(v.data.color);
    }
    return [String(colors_set.size), undefined];
});




export const paramMinDegree = new Parametor("Minimum degree", "min_degree", "min degree", "Print the minimum degree", true, false, [SENSIBILITY.ELEMENT], true);

paramMinDegree.compute= ((g: Graph2, verbose: boolean) => {
    const data = g.getDegreesData();
    const minVertices = new Array();
    for (const v of g.vertices.values()){
        if (data.min_value == g.degree(v.index)){
            minVertices.push(v.index);
        }
    }
    return [String(data.min_value), minVertices];
});

paramMinDegree.showCertificate = (board: ClientBoard, minVertices: Array<number>) => {
    for (const vId of minVertices){
        board.highlight([[BoardElementType.Vertex, vId, 1]])
    }
}

export let paramMinIndegree = new Parametor("Mininum in-degree", "min_indegree", "min_indegree", "Minimum indegree", true, false, new Array(SENSIBILITY.ELEMENT), false);

paramMinIndegree.compute= ((g: Graph2, verbose) => {
    const md = g.minIndegree();
    const minVertices = new Array();
    for (const v of g.vertices.values()){
        if (md == g.inDegree(v.index)){
            minVertices.push(v.index);
        }
    }
    return [String(md), minVertices];
});

paramMinIndegree.showCertificate = (board: ClientBoard, minVertices: Array<number>) => {
    for (const vId of minVertices){
        board.highlight([[BoardElementType.Vertex, vId, 1]])
    }
}

export let paramMaxIndegree = new Parametor("Maximum in-degree", "max_indegree", "max_indegree", "Maximum in-degree", true, false, new Array(SENSIBILITY.ELEMENT), false);

paramMaxIndegree.compute= ((g: Graph2, verbose) => {
    const md = g.maxIndegree();
    const vertices = new Array();
    for (const v of g.vertices.values()){
        if (md == g.inDegree(v.index)){
            vertices.push(v.index);
        }
    }
    return [String(md), vertices];
});

paramMaxIndegree.showCertificate = (board: ClientBoard, vertices: Array<number>) => {
    for (const vId of vertices){
        board.highlight([[BoardElementType.Vertex, vId, 0]])
    }
}

export let paramMinOutdegree = new Parametor("Minimum out-degree", "min_out_degree", "min_out_degree", "Minimum out-degree", true, false, new Array(SENSIBILITY.ELEMENT), false);

paramMinOutdegree.compute= ((g: Graph2, verbose) => {
    const md = g.minOutdegree();
    const vertices = new Array();
    for (const v of g.vertices.values()){
        if (md == g.outDegree(v.index)){
            vertices.push(v.index);
        }
    }
    return [String(md), vertices];
});

paramMinOutdegree.showCertificate = (board: ClientBoard, vertices: Array<number>) => {
    for (const vId of vertices){
        board.highlight([[BoardElementType.Vertex, vId, 0]])
    }
}

export let paramMaxOutdegree = new Parametor("Maximum out-degree", "max_out_degree", "max_out_degree", "Maximum out-degree", true, false, new Array(SENSIBILITY.ELEMENT), false);

paramMaxOutdegree.compute= ((g: Graph2, verbose) => {
    const md = g.maxOutdegree();
    const vertices = new Array();
    for (const v of g.vertices.values()){
        if (md == g.outDegree(v.index)){
            vertices.push(v.index);
        }
    }
    return [String(md), vertices];
});

paramMaxOutdegree.showCertificate = (board: ClientBoard, vertices: Array<number>) => {
    for (const vId of vertices){
        board.highlight([[BoardElementType.Vertex, vId, 0]])
    }
}




export let paramMaxDegree = new Parametor("Maximum degree", "max_degree", "max degree", "Print the minimum degree", true, false, [SENSIBILITY.ELEMENT], true);

paramMaxDegree.compute= ((g: Graph2, verbose: boolean) => {
    const data = g.getDegreesData();
    return [String(data.max_value), data.max_vertices];
});

paramMaxDegree.showCertificate = (board: ClientBoard, certificate: Set<number>) =>  {
    for (const vId of certificate){
        board.highlight([[BoardElementType.Vertex, vId, 1]])
    }
}

export let paramAverageDegree = new Parametor("Average degree", "avg_degree", "avg. degree", "Print the average degree", true, false, [SENSIBILITY.ELEMENT], true);

paramAverageDegree.compute= ((g: Graph2) => {
    // Remark : If no loop, we can simply use that sum(degree) = 2|E| so avg(degree) = 2|E|/|V|
    const data = g.getDegreesData();
    const avg = Math.round((data.avg + Number.EPSILON) * 100) / 100

    return [String(avg), undefined];
});


export let paramIsProperColoring = new Parametor("Proper vertex-coloring?", "has_proper_coloring", "proper vertex-coloring?", "Print if the current coloring of the vertices is proper or not", true, true, [SENSIBILITY.ELEMENT, SENSIBILITY.COLOR], true);

paramIsProperColoring.compute= ((g: Graph2) => {

    if (g.vertices.size == 0) {
        return ["true", undefined];
    }

    const visited = new Set<number>();
    const [vStart] = g.vertices.values(); 
    const S = Array<Vertex<VertexData2>>(vStart);

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

paramIsProperColoring.showCertificate = (board: ClientBoard, certificate: Array<BoardVertex>) => {
    for (const v of certificate){
        v.setHighlight(1);
    }
}



// --------------------
// Domination parameters

export const paramDS = new Parametor(
    "Domination number", 
    "dominationNumber", 
    "DN", 
    "Domination number", 
    true, false, [SENSIBILITY.ELEMENT], false);

paramDS.compute= ((g: Graph2) => {
    const minDS = g.minDominatingSet(undefined);
    return [minDS.size.toString(), minDS];
})

paramDS.showCertificate= ((board: ClientBoard, minDS: Set<number>) => {
    for (const vIndex of minDS){
        board.highlightVertex(vIndex, 1);
    }
})

// ----------------------------------
export const paramIDS = new Parametor(
    "Independent Domination number", 
    "independentDominationNumber", 
    "IDN", 
    "Independent domination number", 
    true, false, [SENSIBILITY.ELEMENT], false);

paramIDS.compute= ((g: Graph2) => {
    const minIDS = g.minDominatingSet(DominationVariant.Independent);
    return [minIDS.size.toString(), minIDS];
})

paramIDS.showCertificate= ((board: ClientBoard, minIDS: Set<number>) => {
    for (const vIndex of minIDS){
        board.highlightVertex(vIndex, 1);
    }
})

// ----------------------------------
export const paramCDS = new Parametor(
    "Connected Domination number", 
    "connectedDominationNumber", 
    "CDN", 
    "Connected domination number", 
    true, false, [SENSIBILITY.ELEMENT], false);

paramCDS.compute= ((g: Graph2) => {
    const minCDS = g.minConnectedDominatingSet();
    if (typeof minCDS == "undefined"){
        return ["/", new Set()];
    } else {
        return [minCDS.size.toString(), minCDS];
    }
})

paramCDS.showCertificate= ((board: ClientBoard, minCDS: Set<number>) => {
    for (const vIndex of minCDS){
        board.highlightVertex(vIndex, 1);
    }
})


// -------------------------
export const paramVertexCover = new Parametor(
    "Vertex cover number", "vertexCoverNumber", "VC", "Vertex cover number", 
    false, false, [SENSIBILITY.ELEMENT], false);

paramVertexCover.compute= ((g: Graph2) => {
    const minVC = g.minVertexCover();
    return [minVC.size.toString(), minVC];
})

paramVertexCover.showCertificate= ((board: ClientBoard, vertexCover: Set<number>) => {
    for (const vIndex of vertexCover){
        board.highlightVertex(vIndex, 1);
    }
})


export const paramCliqueNumber = new Parametor("Clique number", "cliqueNumber", "w", "Clique number", false, false, [SENSIBILITY.ELEMENT], false);

paramCliqueNumber.compute= ((g: Graph2) => {
    const maxClique = g.maximumClique();
    return [maxClique.size.toString(), maxClique];
});

paramCliqueNumber.showCertificate = (board: ClientBoard, clique: Set<number>) =>{
    for (const vId of clique){
        board.highlightVertex(vId, 1);
    }
}


export const paramChromaticNumber = new Parametor("Chromatic number", "chromaticNumber", "χ", "Chromatic number", false, false, [SENSIBILITY.ELEMENT], false);

paramChromaticNumber.compute= ((g: Graph2) => {
    const minColoring = g.minimalProperColoring();
    const colors = new Set<number>();
    for (const color of minColoring.values()){
        colors.add(color);
    }

    return [colors.size.toString(), minColoring];
})

paramChromaticNumber.showCertificate = (board: ClientBoard, coloring: Map<number, number>) => {
    for (const [vId, colorId] of coloring){
        board.highlightVertex(vId, colorId);
    }
}


export const paramChromaticIndex = new Parametor("Chromatic index", "chromaticIndex", "χ'", "Chromatic index", false, false, [SENSIBILITY.ELEMENT], false);

paramChromaticIndex.compute= ((g: Graph2) => {
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

paramChromaticIndex.showCertificate = (board: ClientBoard, coloring: Map<number, number>) => {
    for (const [vId, colorId] of coloring){
        board.highlightLink(vId, colorId);
    }
}



