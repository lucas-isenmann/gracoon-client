import { Coord, TextZone } from "gramoloss";
import { interactor_loaded } from "../interactors/interactor_manager";
import renderMathInElement from "../katex-auto-render/auto-render";
import { BoardElementType, ClientBoard } from "./board";
import { View } from "./camera";
import { CanvasVect } from "./vect";
import { CanvasCoord } from "./canvas_coord";
import { marked } from "marked";
import { INTERACTOR_TYPE } from "../interactors/interactor";

export class ClientTextZone extends TextZone {
    canvas_pos: CanvasCoord;
    div: HTMLDivElement;
    content_div: HTMLDivElement;
    last_mouse_pos: CanvasCoord;
    board: ClientBoard;
    
    constructor(pos: Coord, width: number, text: string, board: ClientBoard, index: number){
        super(pos, width, text);
        this.board = board;
        this.canvas_pos = board.view.create_canvas_coord(pos);
        this.last_mouse_pos = new CanvasCoord(0,0);

            this.div = document.createElement("div");
            this.div.id = "text_zone_" + index;
            this.reset_div_pos();
            document.body.appendChild(this.div);
            this.div.classList.add("text_zone");
            this.div.style.width = String(this.width) + "px";

            const content = document.createElement("div");
            content.id = "text_zone_content_" + index;
            content.classList.add("text_zone_content", "content_editable");
            content.innerHTML = text;
            content.contentEditable = "true";
            content.spellcheck = false;
            this.div.appendChild(content);
            this.content_div = content;
            

            const sidebar = document.createElement("div");
            sidebar.classList.add("text_zone_sidebar");
            this.div.appendChild(sidebar);

            const text_zone = this;

            sidebar.onmousedown = (e: MouseEvent) => {
                this.last_mouse_pos = new CanvasCoord(e.pageX, e.pageY);
                function move_div(e: MouseEvent){
                    const new_mouse_pos = new CanvasCoord(e.pageX, e.pageY);
                    text_zone.width += new_mouse_pos.x - text_zone.last_mouse_pos.x;
                    text_zone.last_mouse_pos = new_mouse_pos;
                    text_zone.div.style.width = String(text_zone.width) + "px";
                }
                window.addEventListener("mousemove", move_div);
                function stop_event(){
                    board.emit_update_element( BoardElementType.TextZone, index, "width", text_zone.width);
                    window.removeEventListener("mouseup", stop_event);
                    window.removeEventListener("mousemove", move_div);
                }
                window.addEventListener("mouseup", stop_event);
                return;
            }

            content.onmousemove = () => {
                if (interactor_loaded.id == INTERACTOR_TYPE.SELECTION){
                    const s = window.getSelection();
                    s.removeAllRanges();
                }
            }

            content.onmousedown = (e: MouseEvent) => {
                this.last_mouse_pos = new CanvasCoord(e.pageX, e.pageY);
                if (interactor_loaded.id == INTERACTOR_TYPE.SELECTION){
                    function move_div(e: MouseEvent){
                        console.log("moveDiv");
                        const new_mouse_pos = new CanvasCoord(e.pageX, e.pageY);
                        const cshift = CanvasVect.from_canvas_coords(text_zone.last_mouse_pos, new_mouse_pos);
                        const shift = board.view.server_vect(cshift);
                        board.emit_translate_elements([[BoardElementType.TextZone, index]], shift);
                        text_zone.last_mouse_pos = new_mouse_pos;
                    }
                    window.addEventListener("mousemove", move_div);
                    function stop_event(){
                        window.removeEventListener("mouseup", stop_event);
                        window.removeEventListener("mousemove", move_div);
                    }
                    window.addEventListener("mouseup", stop_event);
                } else if (interactor_loaded.id == INTERACTOR_TYPE.ERASER){
                    board.emit_delete_elements([[BoardElementType.TextZone, index]]);
                }
            }

            content.onfocus = (e) => {
                if ( interactor_loaded.id != INTERACTOR_TYPE.SELECTION){
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

            content.onkeyup = (e) => {
                saveSelection();
                board.emit_update_element(BoardElementType.TextZone, index, "text", this.text);

                if (e.key == "Enter" && board.keyPressed.has("Control")) {
                    content.blur();
                }
            }

        this.update_text(text);
    }

    translate(shift: CanvasVect, view: View) {
        this.canvas_pos.translate_by_canvas_vect(shift);
        this.pos = view.create_server_coord(this.canvas_pos);
        this.reset_div_pos();
    }


    update_text(new_text: string){
        this.text = new_text;
        // new_text = new_text.replace(/(\r\n)/g, "<br>");
        // new_text = new_text.replace(/\n/g, "<br>");
        // new_text = new_text.replace(/\r/g, "");
        //  for (const content of this.div.getElementsByClassName("text_zone_content")){
        // this.content_div.innerText = new_text;// katex.renderToString(text);
        const test = marked.parse(new_text);
        this.content_div.innerHTML = test;
        renderMathInElement(this.content_div);

        //  }
        this.reset_div_pos();
    }

    reset_div_pos(){
            this.div.style.top = String(this.canvas_pos.y) + "px";
            this.div.style.left = String(this.canvas_pos.x) + "px";
    }

    is_nearby(canvas_pos: CanvasCoord): boolean{
        return (this.canvas_pos.x <= canvas_pos.x && canvas_pos.x <= this.canvas_pos.x + this.div.clientWidth) && (this.canvas_pos.y <= canvas_pos.y && canvas_pos.y <= this.canvas_pos.y + this.div.clientHeight);
    }

    update_after_camera_change(view: View){
        this.canvas_pos = view.create_canvas_coord(this.pos);
        this.reset_div_pos();
    }
}



// Saving caret position when editing


let savedRange: Range = null;

function saveSelection() {
    if(window.getSelection)//non IE Browsers
    {
        savedRange = window.getSelection().getRangeAt(0);
    }
}

function restoreSelection(div_id: string) {
    document.getElementById(div_id).focus();
    if (savedRange != null) {
        if (window.getSelection)//non IE and there is already a selection
        {
            const s = window.getSelection();
            if (s.rangeCount > 0) 
                s.removeAllRanges();
            s.addRange(savedRange);
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
