import { params_available_turn_off_div, params_available_turn_on_div, update_params_available_div } from "./parametors/div_parametor";
import { setup_parametors_available } from "./parametors/parametor_manager";
import { setupHandlers, socket } from "./socket";
import { setup_generators_div, turn_on_generators_div } from "./generators/dom";
import { ClientBoard, INDEX_TYPE, SocketMsgType } from "./board/board";
import { setup_modifyers_div, turn_on_modifyers_div } from "./modifyers/dom";
import { ORIENTATION_SIDE_BAR, PreFolder, PreLauncher, PreSwitch, SideBar } from "./side_bar/side_bar";
import { createStrokeInteractor } from "./side_bar/interactors/stroke";
import { createAreaInteractor } from "./side_bar/interactors/area";
import { createPopup, initEscapeEvent } from "./popup";
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
import { launchHelpPopUp } from "./actions/help";
import { CrossMode, TwistMode } from "./board/stanchion";
import { parseDot } from "./actions/importFile";
import { generateTikz2 } from "./board/tikz2";



    function loadFile() {
        const [popUpDiv, content] = createPopup("loadFilePopUp", "Load file");
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
    const clientVersionDiv = document.getElementById("client-version");
    if (clientVersionDiv){
        clientVersionDiv.innerHTML = PACKAGE.version;
    }
}

function setup() {
    const localBoard = new ClientBoard();


    // setupStanchionDrawer(localBoard);

    setupClientVersionDiv();
    
   

    setupHandlers(localBoard);

    localBoard.canvas.width = window.innerWidth;
    localBoard.canvas.height = window.innerHeight;
    window.addEventListener('resize', function () { 
        localBoard.resizeCanvas(); 
    }, false);
    document.addEventListener('contextmenu', event => event.preventDefault());
    setupInteractions(localBoard);

    setup_generators_div(localBoard.canvas, localBoard);
    setup_modifyers_div(localBoard);

    setup_parametors_available();
    update_params_available_div(localBoard);

    let params_loaded_button = document.getElementById("params_loaded_button");
    params_loaded_button?.addEventListener('click', () => {
        params_available_turn_on_div();
    });

    let params_available_button = document.getElementById("params_available_button");
    params_available_button?.addEventListener('click', () => {
        params_available_turn_off_div();
    });



    // Top SideBar
    const sb = new SideBar(localBoard, ORIENTATION_SIDE_BAR.HORIZONTAL, 150, 10, undefined, 
        [   
            new PreLauncher("undo", "Undo", "", localBoard.emitUndo),
            new PreLauncher("redo", "Redo", "", localBoard.emitRedo),
            new PreLauncher("generator", "Show graph generators", "", turn_on_generators_div),
            new PreLauncher("modifyer", "Show graph modifyers", "", turn_on_modifyers_div),
            new PreFolder( "grid", [
                new PreSwitch(false, "triangular_grid", "Vertical triangular grid", () => {
                    localBoard.setGridType(GridType.GridVerticalTriangular);
                    localBoard.draw();
                }, () => {
                    localBoard.setGridType(undefined);
                    localBoard.draw();
                }),
                new PreSwitch(false, "grid", "Rectangular grid", () => {
                    localBoard.setGridType(GridType.GridRect);
                    localBoard.draw();
                }, () => {
                    localBoard.setGridType(undefined);
                    localBoard.draw();
                }),
                new PreSwitch(false, "grid_polar", "Polar grid", () => {
                    localBoard.setGridType(GridType.GridPolar);
                    localBoard.draw();
                }, () => {
                    localBoard.setGridType(undefined);
                    localBoard.draw();
                }),
            ]),
            new PreSwitch(true, "align", "Align vertices to other vertices", () => {
                localBoard.is_aligning = true;
            }, () => {
                localBoard.is_aligning = false;
            }),
            new PreLauncher("dark_mode", "Switch to dark/light mode", "", () => {
                localBoard.toggle_dark_mode();
                for( const color of colorsData.keys()){
                    const colorChoiceDiv = document.getElementById("color_choice_" + color);
                    if (colorChoiceDiv != null){
                        colorChoiceDiv.style.backgroundColor = getCanvasColor(color, localBoard.isDarkMode());
                    }
                } 
            }),
            new PreFolder("export", [
                new PreLauncher("export_tex", "Export graph in Tikz", "", () => {
                        // const tikzStr = TikZ_create_file_data(localBoard.graph);
                        const tikzStr = generateTikz2(localBoard.g, 2);
                        // console.log(btoa(localBoard.graph.compressToString()))
                        const a = document.createElement("a");
                        a.href = window.URL.createObjectURL(new Blob([tikzStr], { type: "text/plain" }));
                        a.download = "file.tex";
                        a.click();
                    }),
                // new PreLauncher("export_gco", "Export board in .gco", "",  () => {
                //         socket.emit(SocketMsgType.GET_JSON, (response: string) => {
                //             const a = document.createElement("a");
                //             a.href = window.URL.createObjectURL(new Blob([response], { type: "text/plain" }));
                //             a.download = "file.gco";
                //             a.click();
                //         })
                //     }),
                // new PreLauncher("import", "Load .gco file",  "", loadFile),
                new PreLauncher("import", "Parse and import .dot file",  "", () => parseDot(localBoard, socket)),
            ]),
            // new PreFolder("index_none", [
            //     new PreSwitch(false, "index_number_stable", "[Stable numerical] Set automatically labels to numeric and maintain labels after vertices deletions.", () => {localBoard.setIndexType(INDEX_TYPE.NUMBER_STABLE)}, () => {localBoard.setIndexType(INDEX_TYPE.NONE)}),
            //     new PreSwitch(false, "index_number_unstable", "[Unstable numerical] Set automatically labels to numeric. Labels will be recomputed after vertices deletions so that there are between 0 and n-1.", () => {localBoard.setIndexType(INDEX_TYPE.NUMBER_UNSTABLE)}, () => {localBoard.setIndexType(INDEX_TYPE.NONE)}),
            //     new PreSwitch(false, "index_alpha_stable", "[Stable alphabetical] Set automatically labels to alphabetic and maintain labels after vertices deletions.", () => {localBoard.setIndexType(INDEX_TYPE.ALPHA_STABLE)}, () => {localBoard.setIndexType(INDEX_TYPE.NONE)}),
            //     new PreSwitch(false, "index_alpha_unstable", "[Unstable alphabetic] Set automatically labels to alphabetic. Labels will be recomputed after vertices deletions so that there are between a and z.", () => {localBoard.setIndexType(INDEX_TYPE.ALPHA_UNSTABLE)}, () => {localBoard.setIndexType(INDEX_TYPE.NONE)})
            // ]),
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
            new PreLauncher("help", "Help", "", launchHelpPopUp)

    ]);


    sb.collapse();


    // Left SideBar

    const leftBar = new SideBar(localBoard, ORIENTATION_SIDE_BAR.VERTICAL, 10, 100, undefined, [
        createSelectionInteractor(localBoard),
        new PreFolder( "arc", [
            createLinkInteractor(localBoard, ORIENTATION.UNDIRECTED),
            createLinkInteractor(localBoard, ORIENTATION.DIRECTED),
            createControlPointInteractor(localBoard)
        ]),
        createStrokeInteractor(localBoard), 
        createColorInteractor(localBoard),
        // createAreaInteractor(localBoard),
        createRectangleInteractor(localBoard),
        createTextInteractor(localBoard),
        new EraserInteractor(localBoard) 
    ]);

    leftBar.collapse();


    leftBar.selectInteractor(INTERACTOR_TYPE.EDGE);


    // if (ENV.mode == "dev"){
    //     left_side_bar.add_elements(localBoard, createDetectorInteractor(localBoard));
    // }


    initEscapeEvent(); // Close all popups with Escape key

    // load_param(params_available[14], localBoard, localBoard.entireZone);

    localBoard.draw();
}






function setupStanchionDrawer(board: ClientBoard){


    // board.afterVariableChange = () => {
    //     const h = board.getVariableValue("h");
    //     const adaptToEdgeLength = board.getVariableValue("adaptToEdgeLength");
    //     const twistValue = board.getVariableValue("twistValue");
    //     const durete = board.getVariableValue("durete");
    //     const crossRatio = board.getVariableValue("crossRatio");
    //     const width = board.getVariableValue("width");
    //     const twistMode = board.getVariableValue("twistRelative") ? TwistMode.Relative : TwistMode.Absolute;
    //     const crossMode = board.getVariableValue("crossModeCut") ? CrossMode.Cut : CrossMode.DoublePath;

    //     board.draw();
    //     if ( typeof width == "number" && typeof crossRatio == "number" && typeof durete == "number" && typeof h == "number" && typeof adaptToEdgeLength == "boolean" && typeof twistValue == "number"){
    //         board.graph.drawCombinatorialMap(undefined, board.ctx, h, crossRatio, adaptToEdgeLength, twistValue, durete, width, twistMode, crossMode);
    //     }
    // }

    board.addVariable("h", 0, 20, 50, 0.1, () => {
        board.afterVariableChange()
    });
    board.addVariableBoolean("adaptToEdgeLength", false, () => {
        board.afterVariableChange()
    });
    board.addVariableBoolean("middleOfEdge", false, () => {
        board.afterVariableChange()
    });
    board.addVariable("twistValue", 0, 50, 100, 0.1, () => {
        board.afterVariableChange()
    });
    board.addVariableBoolean("twistRelative", true, () => {
        board.afterVariableChange()
    });
    board.addVariable("durete", 0, 10, 100, 0.1, () => {
        board.afterVariableChange()
    });
    board.addVariable("crossRatio", 0, 0.4, 0.5, 0.01, () => {
        board.afterVariableChange()
    });
    board.addVariable("width", 0, 3, 50, 0.1, () => {
        board.afterVariableChange();
    });
    board.addVariableBoolean("crossModeCut", true, () => {
        board.afterVariableChange()
    });

    // window.addEventListener('keydown', function (e) {
    //     if (e.key == "u"){
    //         console.log("generate moebius stanchions SVG");
    //         const h = board.getVariableValue("h");
    //         const adaptToEdgeLength = board.getVariableValue("adaptToEdgeLength");
    //         const twistValue = board.getVariableValue("twistValue");
    //         const durete = board.getVariableValue("durete");
    //         const crossRatio = board.getVariableValue("crossRatio");
    //         const width = board.getVariableValue("width");
    //         const twistMode = board.getVariableValue("twistRelative") ? TwistMode.Relative : TwistMode.Absolute;
    //         const crossMode = board.getVariableValue("crossModeCut") ? CrossMode.Cut : CrossMode.DoublePath;

    //         if (typeof twistValue == "number" && typeof width == "number" && typeof crossRatio == "number" && typeof durete == "number" && typeof h == "number" && typeof adaptToEdgeLength == "boolean"){
    //             board.graph.drawCombinatorialMap("", board.ctx, h,  crossRatio, adaptToEdgeLength, twistValue, durete, width, twistMode, crossMode);
    //         }
    //     }
    //     if (e.key == "v"){
    //         console.log("generate moebius stanchions SVG");
    //         const h = board.getVariableValue("h");
    //         const adaptToEdgeLength = board.getVariableValue("adaptToEdgeLength");
    //         const twistValue = board.getVariableValue("twistValue");
    //         const durete = board.getVariableValue("durete");
    //         const crossRatio = board.getVariableValue("crossRatio");
    //         const width = board.getVariableValue("width");
    //         const twistMode = board.getVariableValue("twistRelative") ? TwistMode.Relative : TwistMode.Absolute;
    //         const crossMode = board.getVariableValue("crossModeCut") ? CrossMode.Cut : CrossMode.DoublePath;

    //         if (typeof width == "number" && typeof crossRatio == "number" && typeof durete == "number" && typeof h == "number" && typeof adaptToEdgeLength == "boolean" && typeof twistValue == "number"){
    //             // board.graph.getCombinatorialMap(ctx, h, h2, crossRatio, adaptToEdgeLength, ratio, durete);
    //             board.graph.drawCombinatorialMap(undefined, board.ctx, h, crossRatio, adaptToEdgeLength, twistValue, durete, width, twistMode, crossMode)
    //         }
    //     }

    // })
}




setup()


