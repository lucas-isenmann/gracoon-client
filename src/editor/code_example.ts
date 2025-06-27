
export const codeExample =
`
const v = g.vertices.values().next().value;
console.log(v)
v.data.pos.x = 100;
console.log(v);

return g
`
const lol =
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