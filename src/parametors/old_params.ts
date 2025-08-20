


export let paramDiameter = new Parametor("Diameter", "diameter", "diameter", "Print the diameter of the graph", true, false, [SENSIBILITY.ELEMENT], true);

paramDiameter.compute= ((g: Graph2) => {
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

paramDiameter.showCertificate = (board: ClientBoard, certificate: Array<number>) => {
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
export const paramStretch = new Parametor("Stretch", "stretch", "stretch", "Computes the stretch", true, false, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], false);

paramStretch.compute= ((g: Graph2) => {
    const [stretch, path] = g.stretch();
    if (typeof stretch != "undefined"){
        return [String(stretch.toFixed(3)), path];
    } else {
        return ["NAN", new Array()]
    }
});

paramStretch.showCertificate = (board: ClientBoard, certificate: Array<number>) => {
    if (certificate.length <= 0) return;
    board.highlightVertex(certificate[0], 1)

    if (certificate.length == 1) return;
    board.highlightVertex(certificate[certificate.length-1], 1)

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




export const paramMinimalSpanningTree = new Parametor("Minimal weighted spanning tree", 
"minimalWeightedSpanningTree", "minWST", "Minimal weighted spanning tree", true, false, [SENSIBILITY.ELEMENT, SENSIBILITY.WEIGHT], false);

paramMinimalSpanningTree.compute= ((g: Graph2, verbose: boolean) => {
    const r = g.minimumSpanningTree();
    return [r[0].toString(), r[1]];
})

paramMinimalSpanningTree.showCertificate = ((board: ClientBoard, certificate: Array<number>) => {
    for (const linkId of certificate){
        board.highlightLink(linkId, 1)
    }
})


// // -----------------
// export const paramStretchGeneticMaximizer = new Parametor("Stretch Genetic Maximizer", "stretchG", "stretchG", "Computes the stretch", false, false, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], false);

// paramStretchGeneticMaximizer.compute= ((g: Graph2) => {
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
//         const population = new Array<EmbeddedGraph>();
//         const fitness = new Array();
//         let totalFitness = 0;
//         for ( let i = 0 ; i < popSize ; i ++){
//             const c1 = topLeftCorners[i];
//             const c2 = c1.add(new Coord(w,w));
//             const subgraph = g.getSubgraphFromRectangle(c1,c2);
//             population.push(EmbeddedGraph.fromGraph(subgraph));
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
//         const newPop = new Array<EmbeddedGraph>();
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

export const param_weighted_distance_identification = new Parametor("Weighted distance identification number", "wdin", "wdin", "Weighted distance identification number", false, false, [SENSIBILITY.ELEMENT, SENSIBILITY.WEIGHT], false);

param_weighted_distance_identification.compute= ((g: Graph2) => {
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

param_wdin2.compute= ((g: Graph2) => {
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

function wdin2_order(g: EmbeddedGraph, ordered_links: Array<number>, association: Array<number>){
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
    const g1 = g.getConnectedComponentOf(bridge.startVertex.index) as EmbeddedGraph;
    const g2 = g.getConnectedComponentOf(bridge.endVertex.index) as EmbeddedGraph;
    wdin2_order(g1, ordered_links, association);
    wdin2_order(g2, ordered_links, association);
    g.links.set(bridge_index, bridge);
    association.push(no);
    ordered_links.push(bridge_index);
    
}

// g is supposed connected
function wdin2_search(g: EmbeddedGraph, k: number): boolean{
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
        const newg = new EmbeddedGraph(g.board);
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

function test2(g: EmbeddedGraph, constraints: Array<Array<[number,boolean]>>): boolean{
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
function make_constraints(g: EmbeddedGraph, bridge_index: number): Array<Array<[number,boolean]>>{
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


function test(g: EmbeddedGraph): boolean {

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

paramFVSN.compute= ((g: Graph2) => {
    return [g.fvsn().toString(), undefined];
})


// -------------

export const paramMinQuasiKernel = new Parametor("Minimum Quasi Kernel", "minQuasiKernel", "minQK", "Minimum Quasi Kernel", true, false, [SENSIBILITY.ELEMENT], false);

paramMinQuasiKernel.compute = (board: ClientBoard) => {
    const minQK = g.minQuasiKernel();
    return [minQK.size.toString(), minQK];
}

paramMinQuasiKernel.showCertificate = (board: ClientBoard, quasiKernel: Set<number>) => {
    for (const vId of quasiKernel){
        const v = g.vertices.get(vId);
        if (typeof v != "undefined"){
            v.data.highlight = 1;
        }
    }
}





// --------------------
export const paramIsQuasiKernel = new Parametor("Is Quasi Kernel", "is_quasi_kernel", "isQK", "Is Quasi Kernel", true, true, [SENSIBILITY.ELEMENT, SENSIBILITY.COLOR, SENSIBILITY.WEIGHT], false);

paramIsQuasiKernel.compute= ((g: Graph2) => {

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



function getUncoveredVertex(g: EmbeddedGraph): ClientVertex | undefined{
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

paramIsQKAlgoOK.compute= ((g: Graph2) => {
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


// ----------------------------------
// Directed Feedback Vertex Set Number
export const paramDFVS = new Parametor(
    "Min directed feedback vertex set", 
    "dfvsn", 
    "dfvsn", 
    "Min directed feedback vertex set", 
    true, false, [SENSIBILITY.ELEMENT], false);

paramDFVS.compute= ((g: Graph2) => {
    const set = g.minDirectedFeedbackVertexSet();
    return [set.size.toString(), set];
})

paramDFVS.showCertificate= ((g: Graph2, set: Set<number>) => {
    for (const vIndex of set){
        const v = g.vertices.get(vIndex);
        if (typeof v != "undefined"){
            v.data.highlight = 1;
        }
    }
})






export const paramIsDrawingPlanar = new Parametor("Is drawing planar?", "is_drawing_planar", "is_drawing_planar", "Return true iff drawing is planar", true, true, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], true);

paramIsDrawingPlanar.compute= ((g: Graph2) => {
    console.log("is drawing planar update");
    const crossings = g.crossings();
    console.log(crossings);
    const result = crossings.length == 0 ? "true" : "false";
    return [result, crossings];
});

paramIsDrawingPlanar.showCertificate = (board: ClientBoard, crossings: Array<[number, number]>) => {
    for (const [lId1, lId2] of crossings){
        board.highlightLink(lId1, 0);
        board.highlightLink(lId2, 0);
    }
}




export const paramDegreeWidth = new Parametor("Degreewidth of tournaments", "paramDW", "dw", "Degreewidth", false, false, [SENSIBILITY.ELEMENT], false);

paramDegreeWidth.compute= ((g: Graph2) => {

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




export const paramGeomChromaticIndex = new Parametor("Geometric chromatic index", "paramGCI", "gci", "Geometric chromatic index", false, false, [SENSIBILITY.ELEMENT, SENSIBILITY.GEOMETRIC], false);

paramGeomChromaticIndex.compute= ((g: Graph2) => {

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

paramGeomChromaticIndex.showCertificate = (board: ClientBoard, coloring: Map<number, number>) => {
    for (const [vId, colorId] of coloring){
        board.highlightLink(vId, colorId);
    }
}

