import { CanvasCoord } from "../board/canvas_coord";
import { DOWN_TYPE } from "../interactors/interactor";
import { selectInteractor } from "../interactors/interactor_manager";
import { ORIENTATION_INFO } from "./element_side_bar";
import { ItemSideBar } from "./item_side_bar";
import { SideBar } from "./side_bar";
import { ClientBoard } from "../board/board";
import { Option } from "gramoloss";
import { PointedElementData } from "../interactors/pointed_element_data";

export class InteractorV2 extends ItemSideBar {
    interactable_element_type: Set<DOWN_TYPE>;
    
    mousedown: (board: ClientBoard, data: PointedElementData) => void;
    mousemove: (board: ClientBoard, data: Option<PointedElementData>, e: CanvasCoord) => boolean;
    mouseup: (board: ClientBoard, data: Option<PointedElementData>, e: CanvasCoord) => void;
    onleave: () => void;
    draw: (board: ClientBoard, mousePos: Option<CanvasCoord>) => void;

    constructor(board: ClientBoard, id:string, info: string, shortcut: string, orientation_info: ORIENTATION_INFO, img_src: string, cursor_style: string,interactable_element_type: Set<DOWN_TYPE>, my_sidebar?: SideBar, rootSidebar?: SideBar)
    {
        super(board, id, info, shortcut, orientation_info, img_src, cursor_style, my_sidebar, rootSidebar);
        this.interactable_element_type = interactable_element_type;
        this.cursor_style = cursor_style;
        this.onleave = () => {};
        this.draw = () => {};
        this.mousedown = () => {};
        this.mousemove = () => {return false;};
        this.mouseup= () => {};

        if (shortcut != ""){
            // console.log(`add shortcut ${shortcut}`);
            const interactor = this;
            window.addEventListener('keydown', function (e) {
                if ( document.activeElement != null && document.activeElement.classList.contains("content_editable") ){
                    return;
                }
                if (shortcut.toLowerCase() == e.key.toLowerCase()){
                    interactor.common_trigger(board, undefined);
                }
            });
        }
    }

    render(board: ClientBoard, my_sidebar: SideBar): void {
        super.render(board, my_sidebar);
        this.dom.classList.add("interactor");
    }

    common_trigger(board: ClientBoard, pos: Option<CanvasCoord>){
        if ( typeof this.rootSidebar !== "undefined"){
            this.rootSidebar.unselect_all_elements();
        }
        document.querySelectorAll(".interactor").forEach(interactor => {
            interactor.classList.remove("selected");
        });
        this.dom.classList.add("selected");
        selectInteractor(this, board, pos);
    }

    setRootSideBar(rootSideBar: SideBar) {
        this.rootSidebar = rootSideBar;
    }

}