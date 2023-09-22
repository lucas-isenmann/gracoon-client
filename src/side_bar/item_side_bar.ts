import { Option } from "gramoloss";
import { ClientBoard } from "../board/board";
import { CanvasCoord } from "../board/display/canvas_coord";
import { ElementSideBar, ORIENTATION_INFO } from "./element_side_bar";
import { SideBar } from "./side_bar";


export abstract class ItemSideBar extends ElementSideBar {
    trigger: (board: ClientBoard, mousePos: Option<CanvasCoord>) => void; 
    
    constructor(board: ClientBoard, id:string, info: string,  shortcut: string, orientation_info: ORIENTATION_INFO, img_src: string, cursor_style: string, my_sidebar?: SideBar, rootSideBar?: SideBar) {
        super(board, id, info, shortcut, orientation_info, img_src, cursor_style, my_sidebar, rootSideBar); 
        this.trigger = () => { };
    }
    

    unselect(reset?:boolean) {
        this.dom.classList.remove("bar_side_active_item");
        this.dom.classList.remove("selected");
        
        if(reset){
            // We reset the image to its default value
            this.reset_img();
        }
    }

    /**
     * Create and insert the HTMLElement into the sidebar the item belongs.
     * Note: calls super.render() 
     * @param my_sidebar The sidebar the item belongs
     */
    render(board: ClientBoard, my_sidebar: SideBar): void {
        super.render(board, my_sidebar);
        this.dom.classList.add("side_bar_item");
        this.img_dom.classList.add("side_bar_item_img");
        this.dom.addEventListener("mousedown", (e) => {
            const pos = new CanvasCoord(e.pageX, e.pageY);
            this.common_trigger(board, pos);
            this.trigger(board, pos);
            const canvas = document.getElementById('main') as HTMLCanvasElement;
            const ctx = canvas.getContext('2d');
            requestAnimationFrame(function () { board.draw() });
            }
        )
    }
    abstract common_trigger(board: ClientBoard, mouse_pos: Option<CanvasCoord>): void;


}
