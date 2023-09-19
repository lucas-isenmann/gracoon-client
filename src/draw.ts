export const SELECTION_COLOR = 'green' // avant c'était '#00ffff'
export let COLOR_BACKGROUND = "#1e1e1e";
export const GRID_COLOR = '#777777';
export const VERTEX_RADIUS = 8;
export const COLOR_ALIGNEMENT_LINE = "#444444";
export let COLOR_BORDER_VERTEX = "#ffffff";
export let COLOR_INNER_VERTEX_DEFAULT = "#000000";



export function toggle_dark_mode(enable:boolean){
    const action_DOM = document.getElementById("actions");
    if(action_DOM == null) return;
    const interactor_DOM = document.getElementById("interaction_mode_selector");
    if (interactor_DOM == null) return;
    const border_DOM = document.getElementById("border"); // TODO: Change border color and check if someone is followed first
    if(enable){
        COLOR_BACKGROUND = "#1e1e1e";
        // COLOR_INDEX = "#ffffff";
        COLOR_BORDER_VERTEX = "#ffffff";
        document.documentElement.style.setProperty(`--background_color_div`, "#ffffff"); 
        document.documentElement.style.setProperty(`--color_div`, "#000000"); 
        document.documentElement.style.setProperty(`--background_color_page`, COLOR_BACKGROUND); 
        
        const action_svgs = action_DOM.getElementsByTagName('img');
        for(const svg of action_svgs){
            svg.style.filter = "";
        }

        const interactor_svgs = interactor_DOM.getElementsByTagName('img');
        for(const svg of interactor_svgs){
            svg.style.filter = "";
        }
        // action_DOM.style.backgroundColor = "#fff";
    }
    else{
        COLOR_BACKGROUND = "#fafafa";
        // COLOR_INDEX = "#ffffff";
        COLOR_BORDER_VERTEX = "#000000";
        
        document.documentElement.style.setProperty(`--background_color_div`, "#202124"); 
        document.documentElement.style.setProperty(`--color_div`, "#ffffff"); 
        document.documentElement.style.setProperty(`--background_color_page`, COLOR_BACKGROUND); 
 
        const action_svgs = action_DOM.getElementsByTagName('img');
        for(const svg of action_svgs){
            svg.style.filter = "invert(100%) sepia(0%) saturate(2%) hue-rotate(115deg) brightness(102%) contrast(100%)";
            console.log(svg.style);
        }

        const interactor_svgs = interactor_DOM.getElementsByTagName('img');
        for(const svg of interactor_svgs){
            svg.style.filter = "invert(100%) sepia(0%) saturate(2%) hue-rotate(115deg) brightness(102%) contrast(100%)";
        }
    }
}








