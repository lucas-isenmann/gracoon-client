import { ClientBoard } from "../board/board";
import { Option } from "gramoloss";
import { PreInteractor } from "./pre_interactor";
import { INTERACTOR_TYPE } from "../interactors/interactor";

export enum ORIENTATION_SIDE_BAR{
    VERTICAL = 1,
    HORIZONTAL = 2
}

export enum ORIENTATION_INFO{
    TOP = "TOP",
    BOTTOM = "BOTTOM",
    LEFT = "LEFT",
    RIGHT = "RIGHT"
}


/**
 * Generic class for elements contained in a SideBar : there are 4 kinds: Folder, Launcher, Switch and Interactor.
 * These 4 classes are built from PreClasses which constructs the element without knowing the sidebar in which there are in
 */
export class Element {
    img: HTMLImageElement;
    parentSideBar: SideBar;
    rootSideBar: SideBar;
    div: HTMLDivElement;
    divRecap: HTMLDivElement;

    constructor(imgSrc: string, parentSideBar: SideBar, rootSideBar: SideBar, info: string, shortcut: string){
        this.div = document.createElement("div");
        this.div.classList.add("side_bar_element");

        this.img = document.createElement("img");
        this.img.src = "public/img/icons/" + imgSrc + ".svg";
        this.img.classList.add("side_bar_element_img");
        this.div.appendChild(this.img);

        this.parentSideBar = parentSideBar;
        this.parentSideBar.div.appendChild(this.div);

        this.rootSideBar = rootSideBar; 


        this.divRecap = document.createElement("div");
        
        if (info != ""){
            this.div.appendChild(this.divRecap);

            this.divRecap.classList.add("interactor_recap");
            if ( shortcut != ""){
                this.divRecap.innerHTML = info + " <span class='shortcut'>" + shortcut + "</span>";
            }else {
                this.divRecap.innerHTML = info;
            }

            const offsets = this.div.getBoundingClientRect();
            if (parentSideBar.orientation == ORIENTATION_SIDE_BAR.HORIZONTAL){
                this.divRecap.style.left = 0 + "px";
                this.divRecap.style.top = 60 + "px";
            } else {
                this.divRecap.style.left = 60 + "px";
                this.divRecap.style.top = 0 + "px";
            }
            this.divRecap.style.width = "300px";
            this.divRecap.style.backfaceVisibility = "hidden";
            this.divRecap.style.zIndex = "10";
            this.divRecap.style.display = "none";
    
            this.div.onmouseover = () => {
                this.divRecap.style.display = "block";
            }
            this.div.onmouseout = () => {
                this.divRecap.style.display = "none";
            }
        }
    }
}



// ----------------------

export class PreFolder {
    imgSrc: string;
    preElements: Array<PreFolder | PreInteractor | PreLauncher | PreSwitch>

    constructor(imgSrc: string, preElements: Array<PreFolder | PreInteractor | PreLauncher | PreSwitch> ){
        this.imgSrc = imgSrc;
        this.preElements = preElements;
    }
}

export class Folder extends Element {
    sideBar: SideBar;

    constructor(board: ClientBoard, preFolder: PreFolder, top: number, left: number, parentSideBar: SideBar, rootSideBar: SideBar, preElements: Array<PreFolder | PreInteractor | PreLauncher | PreSwitch>){
        super(preFolder.imgSrc, parentSideBar, rootSideBar, "", "");
        
        this.sideBar = new SideBar(board, rootSideBar.orientation, top, left, rootSideBar,  preElements);
        this.sideBar.parentFolder = this;

        switch(this.parentSideBar.orientation){
            case(ORIENTATION_SIDE_BAR.HORIZONTAL):
                this.div.classList.add("side_bar_folder_expand_bottom");
                break;
            case(ORIENTATION_SIDE_BAR.VERTICAL):
                this.div.classList.add("side_bar_folder_expand_right");
                break;
            // case(FOLDER_EXPAND_DIRECTION.BOTTOM):
            //     this.dom.classList.add("side_bar_folder_expand_bottom");
            //     const top = this.my_sidebar.dom.style.top===""?0:parseInt(this.my_sidebar.dom.style.top);
            //     this.next_sidebar.dom.style.top = String(top+ 60) + "px";
            //     break;
            // case(FOLDER_EXPAND_DIRECTION.RIGHT):
            //     this.dom.classList.add("side_bar_folder_expand_right");
            //     const left = this.my_sidebar.dom.style.left===""?0:parseInt(this.my_sidebar.dom.style.left);
            //     this.next_sidebar.dom.style.left = String(left+ 60) + "px";
            //     break;
        }

        this.div.onclick = (e) => {
            this.div.classList.toggle("side_bar_expanded_folder");
            if (this.sideBar.div.style.display == "none"){
                this.sideBar.show();
            } else {
                this.sideBar.hide();
            }
        }
    }
}

// ---------------------------------



export class PreLauncher {
    imgSrc: string;
    trigger: () => void;
    shortcut: string;
    info: string;

    constructor(imgSrc: string, info: string, shortcut: string, trigger: () => void){
        this.imgSrc = imgSrc;
        this.trigger = trigger;
        this.shortcut = shortcut;
        this.info = info;
    }
}

export class Launcher extends Element {
    constructor(preLauncher: PreLauncher, parentSideBar: SideBar, rootSideBar: SideBar){
        super(preLauncher.imgSrc, parentSideBar, rootSideBar, preLauncher.info, "");

        
        this.div.onclick = (e) => {
            preLauncher.trigger();
            this.rootSideBar.collapse();
        }
    }
}

// --------------------------------------

export class Interactor extends Element {
    preInteractor: PreInteractor;
    board: ClientBoard;

    constructor(preInteractor: PreInteractor, parentSideBar: SideBar, rootSideBar: SideBar, board: ClientBoard){
        super(preInteractor.imgSrc, parentSideBar, rootSideBar, preInteractor.info, preInteractor.shortcut);
        this.preInteractor = preInteractor;
        this.board = board;
        const interactor = this;
        
        if (preInteractor.shortcut != ""){
            // console.log(`add shortcut ${shortcut}`);
            
            window.addEventListener('keydown', function (e) {
                if ( document.activeElement != null && document.activeElement.classList.contains("content_editable") ){
                    return;
                }
                if (preInteractor.shortcut.toLowerCase() == e.key.toLowerCase() && board.keyPressed.has("Control") == false ){
                    interactor.select();
                }
            });
        }


        this.div.onclick = (e: MouseEvent) => {
            interactor.select();
        };
    }

    select(){
        this.rootSideBar.collapse();
        this.rootSideBar.unselectAll();
        if (typeof this.parentSideBar.parentFolder != "undefined"){
            this.parentSideBar.parentFolder.img.src = this.img.src;
            this.parentSideBar.parentFolder.div.classList.add("selected");
        } else {
            this.div.classList.add("selected");
        }


        // select the interactor in board
        const board = this.board;
        const interactor = this.preInteractor;
        if ( typeof board.interactorLoaded != "undefined" && interactor.id != board.interactorLoadedId ){
            board.interactorLoaded.onleave();
        }
    
        board.interactorLoaded = interactor;
        board.interactorLoadedId = interactor.id;
    
        board.canvas.style.cursor = interactor.cursorStyle;
        interactor.trigger(board, undefined);
        board.requestDraw();
    }
}


// -----------------------------------------

export class PreSwitch {
    independant: boolean;
    imgSrc: string;
    trigger: () => void;
    unselect: () => void;
    info: string;
    constructor(independant: boolean, imgSrc: string, info: string, trigger: () => void, unselect: () => void){
        this.independant = independant;
        this.imgSrc = imgSrc;
        this.trigger = trigger;
        this.unselect = unselect;
        this.info = info;
    }
}

export class Switch extends Element {
    constructor(preSwitch: PreSwitch, parentSideBar: SideBar, rootSideBar: SideBar){
        super(preSwitch.imgSrc, parentSideBar, rootSideBar, preSwitch.info, "");
        const element = this;
        this.div.onclick = () => {
            rootSideBar.collapse();

            if (preSwitch.independant){
                if (this.div.classList.contains("selected")){
                    this.div.classList.remove("selected");
                    preSwitch.unselect();
                } else {
                    this.div.classList.add("selected");
                    preSwitch.trigger();
                }

            } else {
                if (this.div.classList.contains("selected")){
                    this.rootSideBar.collapse();
                    this.parentSideBar.unselectAll();
                    if (typeof this.parentSideBar.parentFolder != "undefined"){
                        this.parentSideBar.parentFolder.div.classList.remove("selected");
                    }
                    preSwitch.unselect();
                } else {
                    this.rootSideBar.collapse();
                    this.parentSideBar.unselectAll();
                    if (typeof this.parentSideBar.parentFolder != "undefined"){
                        this.parentSideBar.parentFolder.img.src = this.img.src;
                        this.parentSideBar.parentFolder.div.classList.add("selected");
                    } else {
                        this.div.classList.add("selected");
                    }
    
                    this.div.classList.add("selected");
                    preSwitch.trigger();
                }
            }

           
           
        }
    }
}



export class SideBar {
    orientation: ORIENTATION_SIDE_BAR; // Vertical or Horizontal
    elements : Array<Element>; // Elements contained in the sidebar 
    rootSidebar: SideBar;
    parentFolder: Option<Folder>;
    div : HTMLDivElement;

    constructor(board: ClientBoard, orientation: ORIENTATION_SIDE_BAR,  left: number, top: number, rootSideBar: Option<SideBar>, preElements: Array<PreFolder | PreInteractor | PreLauncher | PreSwitch> ){
        if (typeof rootSideBar == "undefined"){
            this.rootSidebar = this;
        } else {
            this.rootSidebar = rootSideBar;
        }
        this.parentFolder = undefined;
        
        this.orientation = orientation;

        this.div = document.createElement("div");
        document.body.appendChild(this.div);
        this.div.style.top = top.toString() + "px";
        this.div.style.left = left.toString() + "px";
        
        this.elements = new Array<Element>();
        for (const [index, preElement] of preElements.entries()){
            if (preElement instanceof PreFolder){
                const nextTop = (orientation == ORIENTATION_SIDE_BAR.HORIZONTAL) ? top + 60 : top + index*60;
                const nextLeft =  (orientation == ORIENTATION_SIDE_BAR.HORIZONTAL) ? left + index*60: left + 60;

                const folder = new Folder(board, preElement, nextLeft, nextTop, this, this.rootSidebar, preElement.preElements );
                this.elements.push(folder);
            } else if (preElement instanceof PreLauncher){
                this.elements.push(new Launcher(preElement, this, this.rootSidebar))
            } else if (preElement instanceof PreInteractor){
                this.elements.push(new Interactor(preElement, this, this.rootSidebar, board))
            } else if (preElement instanceof PreSwitch){
                this.elements.push(new Switch(preElement, this, this.rootSidebar))
            }
        }
        this.div.classList.add("side_bar");

        switch(orientation){
            case(ORIENTATION_SIDE_BAR.HORIZONTAL):
                this.div.classList.add("side_bar_horizontal");
                break;
            case(ORIENTATION_SIDE_BAR.VERTICAL):
                this.div.classList.add("side_bar_vertical");
                break;
            default:
                break;
        }
    }  
    


    hide(){
        this.div.style.display = "none";
    }

    show() {
        this.div.style.display = "flex";
    }

    collapse() {
        for (const element of this.elements){
            if (element instanceof Folder){
                element.sideBar.hide();
                element.sideBar.collapse();
            }
        }
    }

    unselectAll(){
        for (const element of this.elements){
            element.div.classList.remove("selected");
        }
    }

    selectInteractor(id: INTERACTOR_TYPE){
        for (const element of this.elements){
            if (element instanceof Interactor && element.preInteractor.id == id){
                element.select();
                break;
            } else if (element instanceof Folder) {
                element.sideBar.selectInteractor(id);
            }
        }

    }

}

