import { Coord } from "gramoloss";
import { CanvasCoord } from "../display/canvas_coord";
import { BoardElement } from "../element";
import { BoardElementType, ClientBoard } from "../board";
import { Color } from "../display/colors_v2";
import { INTERACTOR_TYPE } from "../../interactors/interactor";
import { CanvasVect } from "../display/canvasVect";
import { marked } from "marked";
import DOMPurify from "dompurify";
import renderMathInElement from "../../katex-auto-render/auto-render";


export class TextZoneElement implements BoardElement {
    id: number;
    cameraCenter: CanvasCoord = new CanvasCoord(0,0);
    serverCenter: Coord = new Coord(0,0);
    serverId: number;
    boardElementType: BoardElementType = BoardElementType.TextZone;
    color: Color;
    isSelected: boolean = false;

    board: ClientBoard;
    div: HTMLDivElement;
    width: number;
    contentDiv: HTMLDivElement;
    lastMousePos: CanvasCoord = new CanvasCoord(0,0);
    text: string = "";
    
    constructor(pos: Coord, width: number, text: string, board: ClientBoard, serverId: number){
        this.board = board;
        this.cameraCenter = board.camera.create_canvas_coord(pos);
        this.width = width;
        this.color = Color.Neutral;

        this.serverId = serverId;

        this.id = board.elementCounter;
        board.elements.set(this.id, this);
        board.elementCounter += 1;
        this.board = board;



        this.div = document.createElement("div");
        this.div.id = "text_zone_" + serverId;
        this.resetDivPos();
        document.body.appendChild(this.div);
        this.div.classList.add("text_zone");
        this.div.style.width = String(this.width) + "px";

        const content = document.createElement("div");
        content.id = "text_zone_content_" + serverId;
        content.classList.add("text_zone_content", "content_editable");
        // content.innerHTML = text;
        content.contentEditable = "true";
        content.spellcheck = false;
        this.div.appendChild(content);
        this.contentDiv = content;
            
        // this.updateText(text);

        const sidebar = document.createElement("div");
        sidebar.classList.add("text_zone_sidebar");
        this.div.appendChild(sidebar);

        const textZone = this;

        sidebar.onmousedown = (e: MouseEvent) => {
            this.lastMousePos.x = e.pageX
            this.lastMousePos.y = e.pageY;
            function move_div(e: MouseEvent){
                const new_mouse_pos = new CanvasCoord(e.pageX, e.pageY);
                textZone.width += new_mouse_pos.x - textZone.lastMousePos.x;
                textZone.lastMousePos = new_mouse_pos;
                textZone.div.style.width = String(textZone.width) + "px";
            }
            window.addEventListener("mousemove", move_div);
            function stop_event(){
                board.emit_update_element( BoardElementType.TextZone, serverId, "width", textZone.width);
                window.removeEventListener("mouseup", stop_event);
                window.removeEventListener("mousemove", move_div);
            }
            window.addEventListener("mouseup", stop_event);
            return;
        }

        content.onmousemove = () => {
            if (board.interactorLoadedId == INTERACTOR_TYPE.SELECTION){
                const s = window.getSelection();
                if (s){
                    s.removeAllRanges();
                }
            }
        }

        content.onmousedown = (e: MouseEvent) => {
            this.lastMousePos = new CanvasCoord(e.pageX, e.pageY);
            if (board.interactorLoadedId == INTERACTOR_TYPE.SELECTION){
                function move_div(e: MouseEvent){
                    console.log("moveDiv");
                    const new_mouse_pos = new CanvasCoord(e.pageX, e.pageY);
                    const cshift = CanvasVect.from_canvas_coords(textZone.lastMousePos, new_mouse_pos);
                    const shift = board.camera.server_vect(cshift);
                    board.emit_translate_elements([[BoardElementType.TextZone, serverId]], shift);
                    textZone.lastMousePos = new_mouse_pos;
                }
                window.addEventListener("mousemove", move_div);
                function stop_event(){
                    window.removeEventListener("mouseup", stop_event);
                    window.removeEventListener("mousemove", move_div);
                }
                window.addEventListener("mouseup", stop_event);
            } else if (board.interactorLoadedId == INTERACTOR_TYPE.ERASER){
                board.emit_delete_elements([[BoardElementType.TextZone, serverId]]);
            }
        }

        content.onfocus = (e) => {
            if ( board.interactorLoadedId != INTERACTOR_TYPE.SELECTION){
                content.innerText = this.text;
                restoreSelection(content.id);
            } else {
                content.blur();
            }
        }

        content.onblur = (e) => {
            onDivBlur();
            board.emit_update_element(BoardElementType.TextZone, serverId, "text", this.text);
        }


        content.oninput = (e) => {
            this.text = content.innerText;
        }

        content.onkeydown = (e) => {
            if (e.key == "Tab") { // tab key
                console.log("tab");
                e.preventDefault(); 

                const sel = window.getSelection();
                if (sel){
                    const range = sel.getRangeAt(0);
                    // \u0009 = Tab but not displayed in div
                    // \u00a0 = Space
                    const tabNode = document.createTextNode("\u00a0");
                    range.insertNode(tabNode);
                    range.setStartAfter(tabNode);
                    range.setEndAfter(tabNode); 
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }

        content.onkeyup = (e) => {
            saveSelection();
            board.emit_update_element(BoardElementType.TextZone, serverId, "text", this.text);

            if (e.key == "Enter" && board.keyPressed.has("Control")) {
                content.blur();
            }
        }

        this.updateText(text);
    }


    delete(){
        this.div.remove();
    }

    setColor (color: Color){

    }
    select() {
    }

    deselect() {
    }

    isInRect (corner1: CanvasCoord, corner2: CanvasCoord) {
        return false;
    }

    translate(cshift: CanvasVect) {
        this.cameraCenter.translate_by_canvas_vect(cshift);
        this.board.camera.setFromCanvas(this.serverCenter, this.cameraCenter);
        this.resetDivPos();
    }


    async updateText(new_text: string){
        this.text = new_text;
        // new_text = new_text.replace(/(\r\n)/g, "<br>");
        // new_text = new_text.replace(/\n/g, "<br>");
        // new_text = new_text.replace(/\r/g, "");
        //  for (const content of this.div.getElementsByClassName("text_zone_content")){
        // this.contentDiv.innerText = new_text;// katex.renderToString(text);
        let parsed = await marked.parse(new_text);
        parsed = DOMPurify.sanitize(parsed);
        this.contentDiv.innerHTML = parsed;
        renderMathInElement(this.contentDiv);

        //  }
        this.resetDivPos();
    }

    resetDivPos(){
        this.div.style.top = String(this.cameraCenter.y) + "px";
        this.div.style.left = String(this.cameraCenter.x) + "px";
    }

    isNearby(pos: CanvasCoord, d: number): boolean{
        return (this.cameraCenter.x <= pos.x && pos.x <= this.cameraCenter.x + this.div.clientWidth) && (this.cameraCenter.y <= pos.y && pos.y <= this.cameraCenter.y + this.div.clientHeight);
    }

    updateAfterCameraChange(){
        this.cameraCenter.setFromCoord(this.serverCenter, this.board.camera);
        this.resetDivPos();
        this.applyScaling(this.board.camera.zoom)
    }

    applyScaling(scale: number): void {
        if (this.div) {
          this.div.style.transform = `scale(${scale})`;
          this.div.style.transformOrigin = 'left top';
        }
      }
}



// Saving caret position when editing


let savedRange: Range | null = null;

function saveSelection() {
    if(window.getSelection)//non IE Browsers 
    {
        savedRange = window.getSelection().getRangeAt(0);
    }
}

function restoreSelection(div_id: string) {
    const div = document.getElementById(div_id);
    if (div) div.focus;

    if (savedRange != null) {
        if (window.getSelection)//non IE and there is already a selection
        {
            const s = window.getSelection();
            if (s != null ){
                if ( s.rangeCount > 0) 
                s.removeAllRanges();
            s.addRange(savedRange);
            }
        }
        else if (document.createRange)//non IE and no selection
        {
            window.getSelection().addRange(savedRange);
        }
    }
}

function onDivBlur() {
    savedRange = null;
}
