import { Coord, EmbeddedGraph, EmbeddedVertexData, ORIENTATION } from "gramoloss";



export function genDClubs(n: number, d: number): EmbeddedGraph {

    
    let adj = createCliqueAdjacencyMatrix(n);


    for( let k = 0; k < n*n ; k++){
        // Generate a random pair of indices
        let i = Math.floor(Math.random()*n)
        let j = Math.floor(Math.random()*(n-1))
        if (j >= i){
            j ++;
        }

        if ( adj[i][j] ){
            adj[i][j] = 0;
            if (diameter(adj) > d){
                adj[i][j] = 1;
            }            
        }
        else {
            adj[i][j] = 1;
        }
    }
    


    let g = new EmbeddedGraph();
    for (let i = 0; i < n ; i ++){
        g.addVertex(new EmbeddedVertexData(new Coord(Math.random()*100,Math.random()*100)))
    }

    for (let i = 0; i <n ; i ++){
        for (let j = 0; j < i ; j ++){
            if ( adj[i][j] ){
                g.addLink(i,j, ORIENTATION.UNDIRECTED);
            }
        }
    }


    return g;
}





function createCliqueAdjacencyMatrix(size: number): number[][] {
  const matrix: number[][] = [];

  for (let i = 0; i < size; i++) {
    matrix.push([]);
    for (let j = 0; j < size; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = 1;
      }
    }
  }

  return matrix;
}



function floydWarshall(adj: Array<Array<number>>){
    const n = adj.length;
    const dist: Array<Array<number>> = Array.from({ length: n }, () => Array.from({ length: n }, () => Infinity));

    // Initialize distances
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) dist[i][j] = 0;
            else if (adj[i][j] !== 0) dist[i][j] = adj[i][j];
            else dist[i][j] = Infinity;
        }
    }

    // Apply Floyd Warshall algorithm
    for (let k = 0; k < n; k++) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // Update distances if there is a shortcut
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    return dist;
}


function diameter(adj: Array<Array<number>>): number {
    const n = adj.length;
    let diameter = 0;
    let distances = floydWarshall(adj);
    for (let i = 0; i < n ; i ++){
        for (let j = 0; j < n; j ++){
            if (distances[i][j] > diameter){
                diameter = distances[i][j];
            }
        }
    }
    return diameter;
}