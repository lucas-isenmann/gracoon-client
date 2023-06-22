import { ClientGraph } from "../board/graph";
import { CanvasCoord } from "../board/canvas_coord";
import { DOWN_TYPE } from "../interactors/interactor";
import { select_interactorV2 } from "../interactors/interactor_manager";
import { local_board } from "../setup";
import { ORIENTATION_INFO } from "./element_side_bar";
import { ItemSideBar } from "./item_side_bar";
import { SideBar } from "./side_bar";

export class InteractorV2 extends ItemSideBar {
    interactable_element_type: Set<DOWN_TYPE>;
    
    mousedown: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, g: ClientGraph, e: CanvasCoord) => void;
    mousemove: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, g: ClientGraph, e: CanvasCoord) => boolean;
    mouseup: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, g: ClientGraph, e: CanvasCoord) => void;
    onleave: () => void;
    draw: (ctx: CanvasRenderingContext2D) => void;

    constructor(id:string, info: string, shortcut: string, orientation_info: ORIENTATION_INFO, img_src: string, cursor_style: string,interactable_element_type: Set<DOWN_TYPE>, my_sidebar?: SideBar, rootSidebar?: SideBar)
    {
        super(id, info, shortcut, orientation_info, img_src, cursor_style, my_sidebar, rootSidebar);
        this.interactable_element_type = interactable_element_type;
        this.cursor_style = cursor_style;
        this.onleave = () => {};
        this.draw = () => {};
        this.mousedown = () => {};
        this.mousemove = () => {return false;};
        this.mouseup= () => {};

        if (shortcut != ""){
            console.log(`add shortcut ${shortcut}`);
            const interactor = this;
            window.addEventListener('keydown', function (e) {
                if (shortcut.toLowerCase() == e.key.toLowerCase()){
                    interactor.common_trigger(undefined);
                }
            });
        }
    }

    render(my_sidebar: SideBar): void {
        super.render(my_sidebar);
        this.dom.classList.add("interactor");
    }

    common_trigger(pos: CanvasCoord){
        if ( typeof this.rootSidebar !== "undefined"){
            this.rootSidebar.unselect_all_elements();
        }
        document.querySelectorAll(".interactor").forEach(interactor => {
            interactor.classList.remove("selected");
        });
        this.dom.classList.add("selected");
        const canvas = document.getElementById('main') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        select_interactorV2(this, canvas, ctx, local_board.graph, pos);
    }

    setRootSideBar(rootSideBar: SideBar) {
        this.rootSidebar = rootSideBar;
    }

}