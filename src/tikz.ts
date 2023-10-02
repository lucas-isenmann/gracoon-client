import { colorsData } from "./board/display/colors_v2";
import { ClientGraph } from "./board/graph";

function TikZ_header() {
    return `\\documentclass[border=1mm, tikz,dvipsnames]{standalone} 
\\usepackage{tikz} 
\\usetikzlibrary{decorations.pathreplacing, decorations.markings} 
\\usetikzlibrary{calc} 
\\usepackage{xcolor}
    
\\def\\empty{} 
\\pgfkeys{utils/.cd,
    set if not empty/.code n args={3}{%
        \\def\\arg{#2}%
        \\ifx\\arg\\empty%
        \\pgfkeys{#1={#3}}%
        \\else%
        \\pgfkeys{#1={#2}}%
        \\fi%
    },
    set if labelpos not empty/.code n args={2}{%
        \\def\\arg{#1}%
        \\ifx\\arg\\empty%
    \\else%
        \\def\\argo{#2}%
        \\ifx\\argo\\empty%
        \\pgfkeys{/tikz/label={#1}}%
        \\else%
        \\pgfkeys{/tikz/label={#2}:{#1}}%
        \\fi%
        \\fi%
    },
    set if arrowpos not empty/.code n args={3}{%
        \\def\\arg{#1}%
        \\def\\arstyle{#3}%
        \\ifx\\arstyle\\empty%
        \\def\\arr{\\arrow[>=stealth]{>}}
        \\else%
        \\def\\arr{#3}
        \\fi%
        \\ifx\\arg\\empty%
        \\pgfkeys{/pgf/decoration/mark={at position #2 with {\\arr}}}%
        \\else%
        \\pgfkeys{/pgf/decoration/mark={at position #1 with {\\arr}}}%
        \\fi%
    },
}
\\tikzset{
    nodes/.style n args={4}{
        draw ,circle,outer sep=0.5mm,
        /utils/set if not empty={/tikz/fill}{#1}{black},
        /utils/set if not empty={/tikz/minimum size}{#4}{5},
        /utils/set if labelpos not empty={#2}{#3},
        line width = 0.5pt,
},
    arc/.style n args={3}{
        postaction={
            decorate,
            decoration={markings,
                /utils/set if arrowpos not empty={#1}{1}{}%
            }
        },
        /utils/set if not empty={/tikz/line width}{#2}{0.7pt},
        {#3}
    }
}
\\tikzset{shorten >= 2pt}
`
}

function Tikz_create_defines() {
    return  `
        %Defining some constants
        \\def\\scaleL{0.3}; %Scale of the indices of vertices
        \\def\\scaleE{0.8}; %Scale of the edges
        \\def\\scaleV{0.45}; %Scale of the vertices
    `;
}


function TikZ_credits() {
    return "%LaTeX code generated using http://graccoon.com/ \n\n";
}

function TikZ_create_coordinates(g: ClientGraph) {
    let coordinates = "\t\t%Defining the coordinates for the vertices\n";
    for (const v of g.vertices.values()) {
        coordinates += ("\t\t" + v.tikzify_coordinate() + "\n");
    }
    return coordinates;
}

function TikZ_create_nodes(g: ClientGraph) {
    let coordinates = `\t\t%Drawing the vertices
    \t\t % HOW TO USE IT: \\node[scale = SCALE_VALUE, nodes={COLOR_OF_THE_NODE}{TEXT_LABEL}{POSITION_LABEL}{SIZE_NODE}] at  (COORDINATE)  {};
    \t\t%e.g. : \\node[scale = 0.5, nodes={red}{$v$}{above left}{}] at  (0,0)  {};\n`;
    for (const v of g.vertices.values()) {
        coordinates += ("\t\t" + v.tikzify_node() + "\n");
        // coordinates += ("\t\t" + v.tikzify_label() + "\n");
    }
    return coordinates;
}

function TikZ_create_links(g: ClientGraph) {
    let edgesString = "\t\t%Drawing the edges/arcs\n";
    for (const link of g.links.values()) {
        edgesString += ("\t\t" + link.getTikz() + "\n");
    }
    return edgesString;
}


function defineColors(): string{
    let result = "% Define colors used in Gracoon\n";
    for (const [name, colorData] of colorsData){
        const hexaColor = colorData.light;
        result += rgbTikzFromHexaColor(name, hexaColor) + "\n";
    }
    return result + "\n";
}

export function TikZ_create_file_data(g: ClientGraph) {
    let latex = TikZ_credits();
    latex += TikZ_header();
    latex += defineColors();
    latex += "\\begin{document}\n	\\begin{tikzpicture}[yscale=-1]\n";
    latex += Tikz_create_defines() + "\n";
    latex += TikZ_create_coordinates(g) + "\n";
    latex += TikZ_create_links(g) + "\n";
    latex += TikZ_create_nodes(g) + "\n";
    latex += "\n\t\\end{tikzpicture}\n\\end{document}\n";
    return latex;
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