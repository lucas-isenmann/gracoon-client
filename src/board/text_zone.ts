import { Coord, TextZone } from "gramoloss";
import renderMathInElement from "../katex-auto-render/auto-render";
import { BoardElementType, ClientBoard } from "./board";
import { Camera } from "./display/camera";
import { CanvasVect } from "./display/canvasVect";
import { CanvasCoord } from "./display/canvas_coord";
import { marked } from "marked";
import { INTERACTOR_TYPE } from "../interactors/interactor";
import DOMPurify from "dompurify";

export class ClientTextZone extends TextZone {
    canvas_pos: CanvasCoord;
    div: HTMLDivElement;
    contentDiv: HTMLDivElement;
    lastMousePos: CanvasCoord;
    board: ClientBoard;
    
    constructor(pos: Coord, width: number, text: string, board: ClientBoard, index: number){
        super(pos, width, text, index);  
        this.board = board;
        this.canvas_pos = board.camera.create_canvas_coord(pos);
        this.lastMousePos = new CanvasCoord(0,0);

            this.div = document.createElement("div");
            this.div.id = "text_zone_" + index;
            this.resetDivPos();
            document.body.appendChild(this.div);
            this.div.classList.add("text_zone");
            this.div.style.width = String(this.width) + "px";

            const content = document.createElement("div");
            content.id = "text_zone_content_" + index;
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
                this.lastMousePos = new CanvasCoord(e.pageX, e.pageY);
                function move_div(e: MouseEvent){
                    const new_mouse_pos = new CanvasCoord(e.pageX, e.pageY);
                    textZone.width += new_mouse_pos.x - textZone.lastMousePos.x;
                    textZone.lastMousePos = new_mouse_pos;
                    textZone.div.style.width = String(textZone.width) + "px";
                }
                window.addEventListener("mousemove", move_div);
                function stop_event(){
                    board.emit_update_element( BoardElementType.TextZone, index, "width", textZone.width);
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
                        board.emit_translate_elements([[BoardElementType.TextZone, index]], shift);
                        textZone.lastMousePos = new_mouse_pos;
                    }
                    window.addEventListener("mousemove", move_div);
                    function stop_event(){
                        window.removeEventListener("mouseup", stop_event);
                        window.removeEventListener("mousemove", move_div);
                    }
                    window.addEventListener("mouseup", stop_event);
                } else if (board.interactorLoadedId == INTERACTOR_TYPE.ERASER){
                    board.emit_delete_elements([[BoardElementType.TextZone, index]]);
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
                board.emit_update_element(BoardElementType.TextZone, index, "text", this.text);
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
                board.emit_update_element(BoardElementType.TextZone, index, "text", this.text);

                if (e.key == "Enter" && board.keyPressed.has("Control")) {
                    content.blur();
                }
            }

        this.updateText(text);
    }

    translate(shift: CanvasVect, camera: Camera) {
        this.canvas_pos.translate_by_canvas_vect(shift);
        this.pos = camera.createServerCoord(this.canvas_pos);
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
        this.div.style.top = String(this.canvas_pos.y) + "px";
        this.div.style.left = String(this.canvas_pos.x) + "px";
    }

    is_nearby(canvas_pos: CanvasCoord): boolean{
        return (this.canvas_pos.x <= canvas_pos.x && canvas_pos.x <= this.canvas_pos.x + this.div.clientWidth) && (this.canvas_pos.y <= canvas_pos.y && canvas_pos.y <= this.canvas_pos.y + this.div.clientHeight);
    }

    update_after_camera_change(camera: Camera){
        this.canvas_pos = camera.create_canvas_coord(this.pos);
        this.resetDivPos();
        this.applyScaling(camera.zoom)
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
