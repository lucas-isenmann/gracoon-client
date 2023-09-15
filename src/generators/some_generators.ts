import { ORIENTATION } from "gramoloss";
import { View } from "../board/camera";
import { CanvasCoord } from "../board/canvas_coord";
import { ClientGraph } from "../board/graph";
import { ClientLinkData } from "../board/link";
import { Color } from "../colors_v2";

import { Integer, Percentage } from "./attribute";
import { GraphGenerator } from "./generator";

// ----------------------------

 let independentGenerator = new GraphGenerator("independent", [new Integer("n", 3)])

 independentGenerator.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = independentGenerator.attributes[0].value;
    if (typeof n == "string"){
        return graph;
    }
    const r = 50;
    const center = pos;
    for ( let i = 0 ; i < n ; i ++){
        graph.addDefaultVertex(new CanvasCoord(center.x + r*Math.cos( (2*Math.PI*i) /n), center.y + r*Math.sin( (2*Math.PI*i) /n)), view)
    }
    return graph;
}

// ----------------------------

 let randomCliqueGenerator = new GraphGenerator("clique", [new Integer("n", 3)])

 randomCliqueGenerator.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = randomCliqueGenerator.attributes[0].value;
    if (typeof n == "string"){
        return graph;
    }
    const r = 50;
    const center = pos;
    for ( let i = 0 ; i < n ; i ++){
        graph.addDefaultVertex(new CanvasCoord( center.x + r*Math.cos( (2*Math.PI*i) /n), center.y + r*Math.sin( (2*Math.PI*i) /n) ), view)
        for ( let j = 0 ; j < i ; j ++ ){
            graph.addDefaultEdge(j,i,view);
        }
    }
    return graph;
 }


 // ----------------------------

 let randomTournament = new GraphGenerator("random_tournament", [new Integer("n", 3)])

 randomTournament.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = randomTournament.attributes[0].value;
    if (typeof n == "string"){
        return graph;
    }
    const r = 50;
    const center = pos;
    for ( let i = 0 ; i < n ; i ++){
        graph.addDefaultVertex(new CanvasCoord( center.x + r*Math.cos( (2*Math.PI*i) /n), center.y + r*Math.sin( (2*Math.PI*i) /n) ), view)
        for ( let j = 0 ; j < i ; j ++ ){
            if ( Math.random() < 0.5 ){
                graph.addDefaultArc(j,i,view);
            }else {
                graph.addDefaultArc(i,j,view);
            }
        }
    }
    return graph;
 }

 // ----------------------------

 let randomGNP = new GraphGenerator("gnp", [new Integer("n", 3), new Percentage("p")]);

 randomGNP.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = randomGNP.attributes[0].value;
    const p = randomGNP.attributes[1].value;
    if (typeof n == "string" || typeof p == "string"){
        return graph;
    }
    const center = pos;
    const r = 50;
    for ( let i = 0 ; i < n ; i ++){
        graph.addDefaultVertex(new CanvasCoord( center.x + r*Math.cos( (2*Math.PI*i) /n), center.y + r*Math.sin( (2*Math.PI*i) /n) ), view)
        for ( let j = 0 ; j < i ; j ++ ){
            if ( Math.random() < p){
                const linkData =  new ClientLinkData(undefined, Color.Neutral, "", view);
                graph.addLink(j,i,ORIENTATION.UNDIRECTED, linkData);
            }
            
        }
    }

    return graph;
 }

// ----------------------------


let randomStar = new GraphGenerator("star", [new Integer("n", 3)])

randomStar.generate = (pos: CanvasCoord, view : View) => {
   const graph = new ClientGraph();
   const n = randomStar.attributes[0].value;
   if (typeof n == "string"){
        return graph;
    }
    const r = 50;
    const center = pos;
    if(n>0){
        graph.addDefaultVertex(new CanvasCoord( center.x, center.y), view)
        for ( let i = 1 ; i <= n ; i ++){
            graph.addDefaultVertex(new CanvasCoord( center.x + r*Math.cos( (2*Math.PI*i) /n), center.y + r*Math.sin( (2*Math.PI*i) /n) ), view)
            graph.addDefaultEdge(0,i, view);
        }
    }

   return graph;
}

// ----------------------------

let completeBipartite = new GraphGenerator("complete_bipartite", [new Integer("n",1),new Integer("m",1)]);

completeBipartite.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = completeBipartite.attributes[0].value;
    const m = completeBipartite.attributes[1].value;
    if (typeof n == "string"){
        return graph;
    }
    const center = pos;

    for ( let i = 0 ; i < n ; i ++){
        graph.addDefaultVertex(new CanvasCoord( center.x + i*30 , center.y), view)
    }
    for ( let j = 0 ; j < m ; j ++){
        graph.addDefaultVertex(new CanvasCoord( center.x + j*30 , center.y+100), view)
    }

    for ( let i = 0 ; i < n ; i ++){
        for ( let j = 0 ; j < m ; j ++){
            graph.addDefaultEdge(i,n+j,view);
        }
    }
    return graph;
}


// ----------------------------


// ----------------------------

let gridGenerator = new GraphGenerator("grid", [new Integer("n (column)",1),new Integer("m (row)",1), new Percentage("proba")]);

gridGenerator.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = gridGenerator.attributes[0].value;
    const m = gridGenerator.attributes[1].value;
    const p = gridGenerator.attributes[2].value;
    if (typeof n == "string" || typeof m == "string" || typeof p == "string"){
        return graph;
    }
    const center = pos;
    
    for ( let i = 0 ; i < n ; i++){
        for ( let j = 0 ; j < m ; j ++){
            graph.addDefaultVertex(new CanvasCoord(center.x + i*30 , center.y+j*30), view);
        }
    }

    for ( let i = 0 ; i < n ; i ++){
        for ( let j = 0 ; j < m ; j ++){
            let current_index = i*m + j;
            if( j < m - 1){
                if (Math.random() < p) 
                graph.addDefaultEdge(current_index, current_index + 1, view);
            }
            if( i < n-1 ){
                if (Math.random() < p )
                graph.addDefaultEdge(current_index, current_index+m, view);
            }
        }
    }
    return graph;
}


// ---------


let aztecDiamondGenerator = new GraphGenerator("aztecDiamond", [new Integer("n",1), new Percentage("proba", 1)]);

aztecDiamondGenerator.generate = (pos: CanvasCoord, view: View) => {
    const graph = new ClientGraph();
    const n = aztecDiamondGenerator.attributes[0].value;
    const p = aztecDiamondGenerator.attributes[1].value;
    if (typeof n == "string" || typeof p == "string"){
        return graph;
    }
    const center = pos;
    
    function check(i,j,n): boolean {
        return (i+j >= n-1 && i+j <= 3*n+1 && j-i <= n+1 && i-j <= n+1);
    }

    const indices = new Array();

    for ( let i = 0 ; i < 2*n+1 ; i++){
        indices.push(new Array());
        for ( let j = 0 ; j < 2*n+1 ; j ++){
            indices[i].push(-1);
            if ( check(i,j,n) ){
                const v = graph.addDefaultVertex(new CanvasCoord(center.x + i*30 - n*30 , center.y+j*30 - n*30), view);
                indices[i][j] = v.index;
            }
        }
    }

    for ( let i = 0 ; i < 2*n+1 ; i++){
        for (let j = 0 ; j < 2*n+1 ; j ++){
            if (indices[i][j] != -1){
                if (check(i+1, j, n) && i+1 < 2*n+1){
                    graph.addDefaultEdge(indices[i][j], indices[i+1][j], view);
                }
                if (check(i,j+1,n) && j+1 < 2*n+1){
                    graph.addDefaultEdge(indices[i][j], indices[i][j+1], view);

                }
            }
        }
    }

   
    return graph;
}

// ----------------------------



export let generators_available = new Array<GraphGenerator>();
generators_available.push(independentGenerator);
generators_available.push(randomCliqueGenerator);
generators_available.push(randomGNP);
generators_available.push(randomStar);
generators_available.push(completeBipartite);
generators_available.push(gridGenerator);
generators_available.push(randomTournament);
generators_available.push(aztecDiamondGenerator);

