
export const codeExample =
`// You have g

function nbEdges() {
  let m = 0;
  for (const v of g.vertices.values()){
  
    for (const u of g.vertices.values()){
      if (g.hasLink(u.index,v.index, "UNDIRECTED")){
        m += 1;
      }
    }
  }
  return m;
}

return nbEdges();
`