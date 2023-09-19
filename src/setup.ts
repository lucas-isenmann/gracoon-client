import { toggle_dark_mode } from "./draw";
import { params_available_turn_off_div, params_available_turn_on_div, update_params_available_div } from "./parametors/div_parametor";
import { setup_parametors_available } from "./parametors/parametor_manager";
import { setup_socket, socket } from "./socket";
import { setup_generators_div, turn_on_generators_div } from "./generators/dom";
import { ClientBoard, SocketMsgType } from "./board/board";
import { setup_modifyers_div, turn_on_modifyers_div } from "./modifyers/dom";
import { SideBar } from "./side_bar/side_bar";
import { ORIENTATION_INFO, ORIENTATION_SIDE_BAR } from "./side_bar/element_side_bar";
import { FolderSideBar, FOLDER_EXPAND_DIRECTION } from "./side_bar/folder_side_bar";
import { SwitchSideBar } from "./side_bar/switch_side_bar";
import { createStrokeInteractor } from "./side_bar/interactors/stroke";
import { createAreaInteractor } from "./side_bar/interactors/area";
import ENV from './.env.json';
import { SideBarLauncher } from "./side_bar/side_bar_launcher";
import { TikZ_create_file_data } from "./tikz";
import { INDEX_TYPE } from "./board/camera";
import { createPopup } from "./popup";
import PACKAGE from "../package.json";
import { createLinkInteractor } from "./side_bar/interactors/link";
import { ORIENTATION } from "gramoloss";
import { colorsData, getCanvasColor } from "./colors_v2";
import { EraserInteractor } from "./side_bar/interactors/eraser";
import { createTextInteractor } from "./side_bar/interactors/text";
import { createSelectionInteractor } from "./side_bar/interactors/selection";
import { createControlPointInteractor } from "./side_bar/interactors/control_points";
import { createColorInteractor } from "./side_bar/interactors/color";
import { createRectangleInteractor } from "./side_bar/interactors/rectangle";
import { createDetectorInteractor } from "./side_bar/interactors/detector";
import { selectInteractor, setupInteractions } from "./interactors/interactor_manager";




function setupClientVersionDiv(){
    const clientVersionDiv = document.createElement("div");
    clientVersionDiv.id = "clientVersion";
    clientVersionDiv.innerHTML = "client-version: " + PACKAGE.version;
    document.body.appendChild(clientVersionDiv);
}

function setup() {
    const local_board = new ClientBoard();

    setupClientVersionDiv();
    

    local_board.canvas.onmouseleave = ((e) => {
        local_board.view.is_drawing_interactor = false;
        local_board.draw();
    });

    local_board.canvas.onmouseenter = ((e) => {
        local_board.view.is_drawing_interactor = true;
        local_board.draw();
    })

    setup_socket(local_board);

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



    // BOTTOM SIDE BAR TEST

    const bottom_side_bar = new SideBar("side_bar_bottom_test", ORIENTATION_SIDE_BAR.HORIZONTAL, true);  

    const show_generators = new SideBarLauncher(local_board, "show_generators", "Show graph generators", "", ORIENTATION_INFO.BOTTOM, "generator", "pointer", turn_on_generators_div, bottom_side_bar);


    const show_modifyers = new SideBarLauncher(local_board, "show_modifyers", "Show graph modifyers", "",  ORIENTATION_INFO.BOTTOM, "modifyer", "pointer", turn_on_modifyers_div, bottom_side_bar);


    const switch_button_triangular_grid = new SwitchSideBar(local_board, "switch_button_triangular_grid", "Switch triangular grid", "", ORIENTATION_INFO.BOTTOM, "triangular_grid", "pointer", bottom_side_bar);
    const switch_button_rect_grid = new SwitchSideBar(local_board, "switch_button_rect_grid", "Switch rectangular grid", "", ORIENTATION_INFO.BOTTOM, "grid", "pointer", bottom_side_bar);
    
    switch_button_triangular_grid.trigger = () => { 
        local_board.view.display_triangular_grid = switch_button_triangular_grid.selected;
        if (switch_button_triangular_grid.selected){
            local_board.view.grid_show = false;
            switch_button_rect_grid.selected = false;
            switch_button_rect_grid.unselect();
        }
    };
    
    switch_button_rect_grid.trigger = () => { 
        local_board.view.grid_show = switch_button_rect_grid.selected;
        if (switch_button_rect_grid.selected){
            local_board.view.display_triangular_grid = false;
            switch_button_triangular_grid.selected = false;
            switch_button_triangular_grid.unselect();
        }
    };

    const align_action = new SwitchSideBar(local_board,"align_mode", "Automatic alignement", "", ORIENTATION_INFO.BOTTOM, "align", "pointer", bottom_side_bar);
    align_action.trigger = () => {
        local_board.view.is_aligning = align_action.selected;

    }


    const dark_mode_launcher = new SideBarLauncher(local_board, "dark_mode", "Toggle dark mode", "", ORIENTATION_INFO.BOTTOM, "dark_mode", "pointer", 
    () => {
        if(local_board.view.dark_mode){
            toggle_dark_mode(false);
            local_board.view.dark_mode = false;
        }
        else{
            toggle_dark_mode(true);
            local_board.view.dark_mode = true;
        }
        for( const color of colorsData.keys()){
            const colorChoiceDiv = document.getElementById("color_choice_" + color);
            if (colorChoiceDiv != null){
                colorChoiceDiv.style.backgroundColor = getCanvasColor(color, local_board.view.dark_mode);
            }
        } 
    }
    ,bottom_side_bar);


    const export_dir = new SideBar("export_dir", ORIENTATION_SIDE_BAR.HORIZONTAL);
    const export_dir2 = new FolderSideBar(local_board, "export_dir", "Export graph", "", ORIENTATION_INFO.BOTTOM, "export", "default", export_dir, FOLDER_EXPAND_DIRECTION.BOTTOM);

    const export_tikz = new SideBarLauncher(local_board, "export_tikz", "Export to .tex (tikz)", "", ORIENTATION_INFO.BOTTOM, "export_tex", "pointer", 
    () => {
        const tikz_data = TikZ_create_file_data(local_board.graph);
        const a = document.createElement("a");
        a.href = window.URL.createObjectURL(new Blob([tikz_data], { type: "text/plain" }));
        a.download = "file.tex";
        a.click();
    }
    ,export_dir);

    const export_gco = new SideBarLauncher(local_board, "export_gco", "Export to .gco (our special format)", "", ORIENTATION_INFO.BOTTOM, "export_gco", "pointer", 
    () => {
        socket.emit(SocketMsgType.GET_JSON, (response: string) => {
            const a = document.createElement("a");
            a.href = window.URL.createObjectURL(new Blob([response], { type: "text/plain" }));
            a.download = "file.gco";
            a.click();
        })
    }
    ,export_dir);

    bottom_side_bar.add_elements( local_board, export_dir2);
    

    // ------------ 
    // share link

    function shareLink(){
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
    }

    new SideBarLauncher(local_board, "shareAction", "Share URL", "", ORIENTATION_INFO.BOTTOM, "share", "pointer", shareLink, bottom_side_bar);


    // --------------
    // Load file

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


    new SideBarLauncher(local_board, "loadFile", "Load File", "", ORIENTATION_INFO.BOTTOM, "import", "pointer", loadFile, bottom_side_bar);


    // ---------------------
    // Automatic indexes

    const autom_indices_bar = new SideBar("autom_indices_dir_bar", ORIENTATION_SIDE_BAR.HORIZONTAL);
    const autom_indices_dir = new FolderSideBar(local_board, "autom_indices_dir", "Automatic indices", "", ORIENTATION_INFO.BOTTOM, "index", "default", autom_indices_bar, FOLDER_EXPAND_DIRECTION.BOTTOM);

    const change_to_none_index = new SideBarLauncher(local_board, "index_type_none", "Remove all labels", "", ORIENTATION_INFO.BOTTOM, "index_none", "pointer", 
    () => {
        local_board.view.index_type = INDEX_TYPE.NONE;
        local_board.graph.compute_vertices_index_string(local_board.view);
    }
    ,autom_indices_bar);

    const change_to_number_stable_index = new SideBarLauncher(local_board, "index_type_number_stable", "[Stable numerical] Set automatically labels to numeric and maintain labels after vertices deletions.", "", ORIENTATION_INFO.BOTTOM, "index_number_stable", "pointer", 
    () => {
        local_board.view.index_type = INDEX_TYPE.NUMBER_STABLE;
        local_board.graph.compute_vertices_index_string(local_board.view);
    }
    ,autom_indices_bar);

    const change_to_number_unstable_index = new SideBarLauncher(local_board, "index_type_number_unstable", "[Unstable numerical] Set automatically labels to numeric. Labels will be recomputed after vertices deletions so that there are between 0 and n-1.", "", ORIENTATION_INFO.BOTTOM, "index_number_unstable", "pointer", 
    () => {
        local_board.view.index_type = INDEX_TYPE.NUMBER_UNSTABLE;
        local_board.graph.compute_vertices_index_string(local_board.view);
    }
    ,autom_indices_bar);

    const change_to_alpha_stable_index = new SideBarLauncher(local_board, "index_type_alpha_stable", "[Stable alphabetical] Set automatically labels to alphabetic and maintain labels after vertices deletions.", "", ORIENTATION_INFO.BOTTOM, "index_alpha_stable", "pointer", 
    () => {
        local_board.view.index_type = INDEX_TYPE.ALPHA_STABLE;
        local_board.graph.compute_vertices_index_string(local_board.view);
    }
    ,autom_indices_bar);


    const change_to_alpha_unstable_index = new SideBarLauncher(local_board, "index_type_number_stable", "[Unstable alphabetic] Set automatically labels to alphabetic. Labels will be recomputed after vertices deletions so that there are between a and z.", "", ORIENTATION_INFO.BOTTOM, "index_alpha_unstable", "pointer", 
    () => {
        local_board.view.index_type = INDEX_TYPE.ALPHA_UNSTABLE;
        local_board.graph.compute_vertices_index_string(local_board.view);
    }
    ,autom_indices_bar);

    bottom_side_bar.add_elements(local_board, autom_indices_dir);


    // -------

    bottom_side_bar.setRootSideBar(bottom_side_bar);


    bottom_side_bar.dom.style.top = "10px";
    bottom_side_bar.dom.style.left = "200px";




    document.body.appendChild(bottom_side_bar.dom);




    // LEFT SIDE BAR TEST

    const left_side_bar = new SideBar("left_sidebar_test", ORIENTATION_SIDE_BAR.VERTICAL, true);  

    const edge_side_bar = new SideBar("b5", ORIENTATION_SIDE_BAR.VERTICAL);

    const edge_folder = new FolderSideBar(local_board, "edge_folder", "Link interactors", "", ORIENTATION_INFO.RIGHT, "edition", "default", edge_side_bar, FOLDER_EXPAND_DIRECTION.RIGHT);

    const edgeInteractorV3 = createLinkInteractor(local_board, ORIENTATION.UNDIRECTED);
    const arcInteractorV3 = createLinkInteractor(local_board, ORIENTATION.DIRECTED);
    edge_side_bar.add_elements(local_board, edgeInteractorV3, arcInteractorV3, createControlPointInteractor(local_board));

    selectInteractor(edgeInteractorV3, local_board, undefined);


    if (ENV.mode == "dev"){
        left_side_bar.add_elements(local_board, createDetectorInteractor(local_board));
    }

    const eraser_interactorV2 = new EraserInteractor(local_board);

    left_side_bar.add_elements(local_board,
        createSelectionInteractor(local_board),
        edge_folder, 
        createStrokeInteractor(local_board), 
        createColorInteractor(local_board),
        createAreaInteractor(local_board),
        createRectangleInteractor(local_board),
        createTextInteractor(local_board),
        new EraserInteractor(local_board) );


    left_side_bar.setRootSideBar(left_side_bar);

    left_side_bar.dom.style.left = "0px";
    left_side_bar.dom.style.top = "150px";

    document.body.appendChild(left_side_bar.dom);




    local_board.draw();
}

setup()


