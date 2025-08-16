import { ORIENTATION } from "gramoloss";
import { Color } from "./display/colors_v2";
import { Graph2 } from "./graph2";
import { ClientBoard } from "./board";
import { ShapeElement } from "./elements/shape";




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


function genHeader(g: Graph2) {

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
% Add the following packages in the preamble of your document:
% \\usepackage{tikz}
% \\usetikzlibrary{calc, arrows.meta}
\\begin{tikzpicture}
    [ node_style/.style={circle, draw, inner sep=0.05cm} ${arcStyle} ]
    \\def\\fscale{2} % Change this to scale the coordinates without scaling the text
`
}


function coordinates(posX: number, posY: number, minX: number, minY: number, w: number, h: number, figSize: number): [number, number] {
    let x = (posX - minX)/w - 0.5
    let y = (posY - minY)/h - 0.5

    if (w >= h){
        x *= figSize
        y *= figSize*h/w
    } else {
        x *= figSize *w/h
        y *= figSize
    }
    x = Number(x.toFixed(3));
    y = Number(-y.toFixed(3));
    return [x,y]
}


/**
 * 
 * @param g 
 * @returns 
 * @example
    \node[node_style] (v) at (4.2, 2.8) {$v$};
    \node[node_style] (a) at (4.2, 3.2) {$a$};
 */
function defineNodes(g: Graph2, figSize: number): [string, number, number, number, number] {

    figSize /= 1;

    if (g.vertices.size == 0){ return ["", 0,0,1,1]};

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


    let str = `\t% Draw nodes\n`
    for (const [id, v] of g.vertices) {
        let label = "{}";
        if (v.data.innerLabel != ""){
            label = `{$${v.data.innerLabel}$}`
        }
        let [x,y] = coordinates(v.data.pos.x, v.data.pos.y, minX, minY, w, h, figSize);

        let color = "";
        if (v.data.color != Color.Neutral){
            color = `, fill=${colorToLatexColor(v.data.color)}`;
        }

        let outLabel = "";
        if (v.data.outerLabel != ""){
            outLabel = `, label={above:$${v.data.outerLabel}$}`
        }

        str += `\t \\node[node_style${color}${outLabel}] (${id}) at ($\\fscale*(${x}, ${y})$) ${label};\n`;
        // str += `\t \\node[node_style${color}${outLabel}] (${id}) at (${x}, ${y}) ${label};\n`;
    }
    return [str, minX, minY, w,h];
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
function createLinks(g: Graph2): string {
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
        // if ( link.data.cp instanceof Coord){
        //     // Left or right ?
        //     let orientation = "left"
        //     const a = link.startVertex.data.pos.vectorTo(link.endVertex.data.pos)
        //     a.rotate(Math.PI/2)
        //     if (a.dot(link.startVertex.data.pos.vectorTo(link.data.cp)) < 0){
        //         orientation = "right"
        //     }
        //     bend = `[bend ${orientation}=50]`;
        // }

        let label = "";
        if (link.data.label != ""){
            label = `node[midway, right] {$${link.data.label}$}`
        }
        

        str += `\t \\draw${style} (${link.startVertex.index}) to${bend} ${label} (${link.endVertex.index});\n`;
    }
    return str;
}


function createRectangles(board: ClientBoard, minX: number, minY: number, w: number, h: number, figSize: number): string{
    let str = "";

    // \draw[rounded corners=5pt, color=gray]
    //      ($\fscale*(0.17-0.2, -0.33-0.2)$) --
    //     ($\fscale*(0.5+0.2, -0.33-0.2)$) -- 
    //     ($\fscale*(0.5+0.2, 0.33+0.2)$) -- 
    //     ($\fscale*(0.17-0.2, 0.33+0.2)$) -- cycle;

    for (const element of board.elements.values()){
        if (element instanceof ShapeElement){
            let [x1,y1] = coordinates(element.canvasC1.serverPos.x , element.canvasC1.serverPos.y, minX, minY, w, h, figSize);
            let [x2,y2] = coordinates(element.canvasC2.serverPos.x , element.canvasC2.serverPos.y, minX, minY, w, h, figSize);

            str += 
            `
    \\draw[rounded corners=5pt, color=gray]
        ($\\fscale*(${x1}, ${y1})$) --
        ($\\fscale*(${x1}, ${y2})$) -- 
        ($\\fscale*(${x2}, ${y2})$) -- 
        ($\\fscale*(${x2}, ${y1})$) -- cycle;
`
        }
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
export function generateTikz2(board: ClientBoard, figSize: number) {
    let latex = "";
    latex += genHeader(board.g);
    const [str, minX, minY, w,h] = defineNodes(board.g, figSize);
    latex += str + "\n";
    latex += createLinks(board.g);
    latex += createRectangles(board, minX, minY, w,h, figSize);
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



/*
function defineColors(): string{
    let result = "% Define colors used in Gracoon\n";
    for (const [name, colorData] of colorsData){
        const hexaColor = colorData.light;
        result += rgbTikzFromHexaColor(name, hexaColor) + "\n";
    }
    return result + "\n";
}



export function rgbTikzFromHexaColor(colorName: string, hex: string): string {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    const r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    return `\\definecolor{${colorName}}{RGB}{${r},${g},${b}}`;
}
    */