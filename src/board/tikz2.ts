import { Coord, ORIENTATION } from "gramoloss";
import { ClientGraph } from "./graph";
import { Color } from "./display/colors_v2";




// Example of a tikz generated
/*

\begin{tikzpicture}
    [
        yscale=-1,
        node_style/.style={
                circle,
                draw,
                minimum size=0.2cm, 
            },
        arc_style/.style={
            -{Latex[length=2mm,width=2mm]}
        }
    ]
    
    % Coordinates for the vertices
    \node[node_style] (0) at (4.2, 2.8) {};
    \node[node_style] (1) at (4.2, 4.2) {$1$};
    \node[node_style] (2) at (4.2, 5.6) {$2$};

    % Draw edges and arcs
    \draw (0) to[bend left=50] (1);
    \draw (0) to[bend right=50] node[midway, right] {a} (1);
    \draw[color=blue] (0) to (1);
   
    \draw[arc_style, color=blue] (1) to[bend left=30] node[midway, left] {1/2} (2);
    \draw[arc_style] (2) to[bend left=30] node[midway, right] {1/3} (1);
    \draw[arc_style] (2) to[bend right=80] node[midway, left] {2/3} (0);
    

\end{tikzpicture}
*/


function genHeader(g: ClientGraph) {

    let hasArc = false;
    for (const link of g.links.values()){
        if (link.orientation == ORIENTATION.DIRECTED){
            hasArc = true;
            break;
        }
    }

    let arcStyle = "";
    if (hasArc){
        arcStyle = "\n        ,arc/.style={-{Latex[length=2mm,width=2mm]}}";
    }

    return `% LaTeX code generated using http://graccoon.com
\\begin{tikzpicture}
    [
        yscale=-1,
        node_style/.style={circle, draw, inner sep=0.05cm} ${arcStyle}
    ]
    \\def\\fscale{5} % Change this to scale the coordinates without scaling the text
`
}




/**
 * 
 * @param g 
 * @returns 
 * @example
    \node[node_style] (v) at (4.2, 2.8) {$v$};
    \node[node_style] (a) at (4.2, 3.2) {$a$};
 */
function defineNodes(g: ClientGraph, figSize: number) {

    figSize /= 2;

    if (g.vertices.size == 0){ return ""};

    let minX = Infinity
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (const v of g.vertices.values()){
        minX = Math.min(v.data.pos.x, minX);
        minY = Math.min(v.data.pos.y, minY);
        maxX = Math.max(v.data.pos.x, maxX);
        maxY = Math.max(v.data.pos.y, maxY);
    }

    const w = maxX - minX;
    const h = maxY - minY;

    console.log(w, h)


    let str = `\t% Draw nodes\n`
    for (const [id, v] of g.vertices) {
        let label = "{}";
        if (v.data.indexString != ""){
            label = `{$${v.data.indexString}$}`
        }
        let x = (v.data.pos.x - minX)/w - 0.5
        let y = (v.data.pos.y - minY)/h - 0.5

        if (w >= h){
            x *= figSize
            y *= figSize*h/w
        } else {
            x *= figSize *w/h
            y *= figSize
        }
        x = Number(x.toFixed(2));
        y = Number(y.toFixed(2));

        let color = "";
        if (v.data.color != Color.Neutral){
            color = `, fill=${colorToLatexColor(v.data.color)}`;
        }

        let outLabel = "";
        if (v.data.weight != ""){
            outLabel = `, label={above:${v.data.weight}}`
        }

        str += `\t \\node[node_style${color}${outLabel}] (${id}) at ($\\fscale*(${x}, ${y})$) ${label};\n`;
        // str += `\t \\node[node_style${color}${outLabel}] (${id}) at (${x}, ${y}) ${label};\n`;
    }
    return str;
}

/**
 * 
 * @param g 
 * @returns 
 * @example
    % Draw edges and arcs
    \draw (0) \to (1);
    \draw[arc_style] (v) to[bend left=30] node[midway, left] {1} (a);
    \draw[arc_style] (a) to[bend left=30] node[midway, right] {1/2} (v);
 */
function createLinks(g: ClientGraph) {
    let str = "\t% Draw edges and arcs\n";
    for (const link of g.links.values()) {

        let style = "";
        if (link.orientation == ORIENTATION.DIRECTED){
            style += ", arc"
        }
        if (link.data.color != Color.Neutral){
            style += `, color=${colorToLatexColor(link.data.color)}`
        }

        if (style.length > 0){
            style = `[${style.slice(2)}]`
        }

        let bend = "";
        if ( link.data.cp instanceof Coord){
            // Left or right ?
            let orientation = "left"
            const a = link.startVertex.data.pos.vectorTo(link.endVertex.data.pos)
            a.rotate(Math.PI/2)
            if (a.dot(link.startVertex.data.pos.vectorTo(link.data.cp)) < 0){
                orientation = "right"
            }
            bend = `[bend ${orientation}=50]`;
        }

        let weight = "";
        if (link.data.weight != ""){
            weight = `node[midway, right] {${link.data.weight}}`
        }
        

        str += `\t \\draw${style} (${link.startVertex.index}) to${bend} ${weight} (${link.endVertex.index});\n`;

        
        
    }
    return str;
}


/**
 * 
 * // usepackage tikze
* // usetikzlibrary arrows.meta and calc

 * @param g 
 * @param figSize 
 * @returns 
 */
export function generateTikz2(g: ClientGraph, figSize: number) {
    let latex = "";
    latex += genHeader(g);
    latex += defineNodes(g, figSize) + "\n";
    latex += createLinks(g);
    latex += "\\end{tikzpicture}\n";
    return latex;
}




function colorToLatexColor(color: Color): string{
    if( color == Color.Neutral){
        return "black"
    } else if (color == Color.Blue){
        return "blue"
    } else if (color == Color.Red){
        return "red"
    } else if (color == Color.Green){
        return "green"
    } else if (color == Color.Gray){
        return "gray"
    } else if (color == Color.Brown){
        return "brown"
    } else if (color == Color.Orange){
        return "orange"
    } else if (color == Color.Purple){
        return "purple"
    } else if (color == Color.Yellow){
        return "yellow" 
    } else if (color == Color.Pink){
        return "pink";
    }
    return "black"
}


