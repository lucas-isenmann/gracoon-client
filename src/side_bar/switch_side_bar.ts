import { ClientBoard } from "../board/board";
import { ORIENTATION_INFO } from "./element_side_bar";
import { ItemSideBar } from "./item_side_bar";
import { SideBar } from "./side_bar";


export class SwitchSideBar extends ItemSideBar {
    selected: boolean;

    constructor(board: ClientBoard, id:string, info: string, shortcut: string, orientation_info: ORIENTATION_INFO, img_src: string, cursor_style: string, my_sidebar?: SideBar, rootSidebar?: SideBar)
    {
        super(board, id, info, shortcut, orientation_info, img_src, cursor_style, my_sidebar, rootSidebar);
    }


    common_trigger(){
        console.log("lol");
        console.log(this.rootSidebar);
        if ( typeof this.rootSidebar !== "undefined"){
            console.log("go unselect all")
            this.rootSidebar.unselect_all_elements();
        }

        if (this.selected){
            this.dom.classList.remove("selected");
        } else {
            this.dom.classList.add("selected");
        }
        this.selected = !this.selected;
    }

    setRootSideBar(rootSideBar: SideBar) {
        // console.log("setsRootSideBar", this.id, rootSideBar.id);

        this.rootSidebar = rootSideBar;
    }

}