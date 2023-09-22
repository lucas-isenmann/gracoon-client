import { Option } from "gramoloss";
import { ClientBoard } from "../board/board";
import { CanvasCoord } from "../board/display/canvas_coord";
import { ORIENTATION_INFO } from "./element_side_bar";
import { ItemSideBar } from "./item_side_bar";
import { SideBar } from "./side_bar";

/**
 * A SideBarLauncher is an ItemSideBar which can be triggered.
 */
export class SideBarLauncher extends ItemSideBar {

    constructor(board: ClientBoard, id:string, info: string, shortcut: string, orientation_info: ORIENTATION_INFO, img_src: string, cursor_style: string, f: (board: ClientBoard, mouse_pos: Option<CanvasCoord>) => void, my_sidebar?: SideBar, rootSidebar?: SideBar)
    {
        super(board, id, info, shortcut, orientation_info, img_src, cursor_style, my_sidebar, rootSidebar);
        this.trigger = f;
    }

    common_trigger(){ 
        if ( typeof this.rootSidebar !== "undefined"){
            this.rootSidebar.unselect_all_elements();
        }
    }

    setRootSideBar(rootSideBar: SideBar) {
        this.rootSidebar = rootSideBar;
    }

}