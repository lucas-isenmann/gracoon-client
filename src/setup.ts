import { params_available_turn_off_div, params_available_turn_on_div, update_params_available_div } from "./parametors/div_parametor";
import { setup_parametors_available } from "./parametors/parametor_manager";
import { setupHandlers, socket } from "./socket";
import { setup_generators_div, turn_on_generators_div } from "./generators/dom";
import { ClientBoard, INDEX_TYPE, SocketMsgType } from "./board/board";
import { setup_modifyers_div, turn_on_modifyers_div } from "./modifyers/dom";
import { ORIENTATION_SIDE_BAR, PreFolder, PreLauncher, PreSwitch, SideBar } from "./side_bar/side_bar";
import { createStrokeInteractor } from "./side_bar/interactors/stroke";
import { createAreaInteractor } from "./side_bar/interactors/area";
import ENV from './.env.json';
import { TikZ_create_file_data } from "./tikz";
import { createPopup } from "./popup";
import PACKAGE from "../package.json";
import { createLinkInteractor } from "./side_bar/interactors/link";
import { ORIENTATION } from "gramoloss";
import { colorsData, getCanvasColor } from "./board/display/colors_v2";
import { EraserInteractor } from "./side_bar/interactors/eraser";
import { createTextInteractor } from "./side_bar/interactors/text";
import { createSelectionInteractor } from "./side_bar/interactors/selection";
import { createControlPointInteractor } from "./side_bar/interactors/control_points";
import { createColorInteractor } from "./side_bar/interactors/color";
import { createRectangleInteractor } from "./side_bar/interactors/rectangle";
import { createDetectorInteractor } from "./side_bar/interactors/detector";
import { setupInteractions } from "./interactors/interactor_manager";
import { GridType } from "./board/display/grid";
import { INTERACTOR_TYPE } from "./interactors/interactor";



    function loadFile() {
        const popUpDiv = createPopup("loadFilePopUp", "Load file");
        popUpDiv.style.display = "block";

        const fileInput: HTMLInputElement = document.createElement("input");
        fileInput.type = "file";
        fileInput.style.display = "none";
        fileInput.onchange = function () {
            if (fileInput.files != null && fileInput.files.length >= 1){
                const input = fileInput.files[0];
                popUpDiv.style.display = "none";
                const reader = new FileReader();
                reader.readAsText(input);
                reader.onload = function () {
                    socket.emit(SocketMsgType.LOAD_JSON, reader.result);
                };
            }
        }
        popUpDiv.appendChild(fileInput);
        fileInput.style.display = "inline-block";
    }



function setupClientVersionDiv(){
    const clientVersionDiv = document.createElement("div");
    clientVersionDiv.id = "clientVersion";
    clientVersionDiv.innerHTML = "client-version: " + PACKAGE.version;
    document.body.appendChild(clientVersionDiv);
}

function setup() {
    const local_board = new ClientBoard();

    setupClientVersionDiv();
    

   

    setupHandlers(local_board);

    local_board.ctx.canvas.width = window.innerWidth;
    local_board.ctx.canvas.height = window.innerHeight;
    window.addEventListener('resize', function () { 
        local_board.resizeCanvas(); 
    }, false);
    document.addEventListener('contextmenu', event => event.preventDefault());
    setupInteractions(local_board);

    setup_generators_div(local_board.canvas, local_board);
    setup_modifyers_div(local_board);

    setup_parametors_available();
    update_params_available_div(local_board);

    let params_loaded_button = document.getElementById("params_loaded_button");
    params_loaded_button?.addEventListener('click', () => {
        params_available_turn_on_div();
    });

    let params_available_button = document.getElementById("params_available_button");
    params_available_button?.addEventListener('click', () => {
        params_available_turn_off_div();
    });



    // Top SideBar
    const sb = new SideBar(local_board, ORIENTATION_SIDE_BAR.HORIZONTAL, 150, 10, undefined, 
        [   
            new PreLauncher("generator", "Show graph generators", "", turn_on_generators_div),
            new PreLauncher("modifyer", "Show graph modifyers", "", turn_on_modifyers_div),
            new PreFolder( "triangular_grid", [
                new PreSwitch(false, "triangular_grid", "Vertical triangular grid", () => {
                    local_board.setGridType(GridType.GridVerticalTriangular);
                    local_board.draw();
                }, () => {
                    local_board.setGridType(undefined);
                    local_board.draw();
                }),
                new PreSwitch(false, "grid", "Rectangular grid", () => {
                    local_board.setGridType(GridType.GridRect);
                    local_board.draw();
                }, () => {
                    local_board.setGridType(undefined);
                    local_board.draw();
                }),
            ]),
            new PreSwitch(true, "align", "Align vertices to other vertices", () => {
                local_board.is_aligning = true;
            }, () => {
                local_board.is_aligning = false;
            }),
            new PreLauncher("dark_mode", "Switch to dark/light mode", "", () => {
                local_board.toggle_dark_mode();
                for( const color of colorsData.keys()){
                    const colorChoiceDiv = document.getElementById("color_choice_" + color);
                    if (colorChoiceDiv != null){
                        colorChoiceDiv.style.backgroundColor = getCanvasColor(color, local_board.isDarkMode());
                    }
                } 
            }),
            new PreFolder("export", [
                new PreLauncher("export_tex", "Export graph in Tikz", "", () => {
                        const tikz_data = TikZ_create_file_data(local_board.graph);
                        const a = document.createElement("a");
                        a.href = window.URL.createObjectURL(new Blob([tikz_data], { type: "text/plain" }));
                        a.download = "file.tex";
                        a.click();
                    }),
                new PreLauncher("export_gco", "Export board in .gco", "",  () => {
                        socket.emit(SocketMsgType.GET_JSON, (response: string) => {
                            const a = document.createElement("a");
                            a.href = window.URL.createObjectURL(new Blob([response], { type: "text/plain" }));
                            a.download = "file.gco";
                            a.click();
                        })
                    })
            ]),
            new PreFolder("index_none", [
                new PreSwitch(false, "index_number_stable", "[Stable numerical] Set automatically labels to numeric and maintain labels after vertices deletions.", () => {local_board.setIndexType(INDEX_TYPE.NUMBER_STABLE)}, () => {local_board.setIndexType(INDEX_TYPE.NONE)}),
                new PreSwitch(false, "index_number_unstable", "[Unstable numerical] Set automatically labels to numeric. Labels will be recomputed after vertices deletions so that there are between 0 and n-1.", () => {local_board.setIndexType(INDEX_TYPE.NUMBER_UNSTABLE)}, () => {local_board.setIndexType(INDEX_TYPE.NONE)}),
                new PreSwitch(false, "index_alpha_stable", "[Stable alphabetical] Set automatically labels to alphabetic and maintain labels after vertices deletions.", () => {local_board.setIndexType(INDEX_TYPE.ALPHA_STABLE)}, () => {local_board.setIndexType(INDEX_TYPE.NONE)}),
                new PreSwitch(false, "index_alpha_unstable", "[Unstable alphabetic] Set automatically labels to alphabetic. Labels will be recomputed after vertices deletions so that there are between a and z.", () => {local_board.setIndexType(INDEX_TYPE.ALPHA_UNSTABLE)}, () => {local_board.setIndexType(INDEX_TYPE.NONE)})
            ]),
            new PreLauncher("share", "Copy invitation url to clipboard", "", () => {
                socket.emit("get_room_id", (room_id: string) => {
                    navigator.clipboard.writeText(location.origin + "/?room_id=" + room_id);
                        /*
                        .then(() => {
                            const subactions_div = document.getElementById(load_file_action.name + "_subactions");
                            subactions_div.classList.add("subaction_info");
                            subactions_div.innerHTML = "Copied!</br>" + location.origin + "/?room_id=" + room_id;
                            subactions_div.style.display = "block"
                        });
                        */
                });
            }),
            new PreLauncher("import", "Load .gco file",  "", loadFile)

    ]);



    sb.collapse();


    // Left SideBar

    const leftBar = new SideBar(local_board, ORIENTATION_SIDE_BAR.VERTICAL, 10, 100, undefined, [
        createSelectionInteractor(local_board),
        new PreFolder( "arc", [
            createLinkInteractor(local_board, ORIENTATION.UNDIRECTED),
            createLinkInteractor(local_board, ORIENTATION.DIRECTED),
            createControlPointInteractor(local_board)
        ]),
        createStrokeInteractor(local_board), 
        createColorInteractor(local_board),
        createAreaInteractor(local_board),
        createRectangleInteractor(local_board),
        createTextInteractor(local_board),
        new EraserInteractor(local_board) 
    ]);

    leftBar.collapse();


    leftBar.selectInteractor(INTERACTOR_TYPE.EDGE);


    // if (ENV.mode == "dev"){
    //     left_side_bar.add_elements(local_board, createDetectorInteractor(local_board));
    // }




    local_board.draw();
}

setup()


