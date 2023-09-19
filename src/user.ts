import { Coord, Option } from "gramoloss";
import { ClientBoard } from "./board/board";
import { View } from "./board/camera";
import { CanvasCoord } from "./board/canvas_coord";
import { COLOR_BACKGROUND} from "./draw";
import { Multicolor } from "./multicolor";
import { socket } from "./socket";


export class User {
    id: string;
    label: string;
    multicolor: Multicolor;
    pos: Option<Coord>;
    canvas_pos: Option<CanvasCoord>;
    timer_refresh : number; // Date since the last change of position
    id_timeout : number | undefined; // Id of the time_out to kill when position is changed, "" if empty. 

    constructor(id: string, label: string, color: string, view: View, pos?: Coord) {
        this.id = id;
        this.label = label;
        this.multicolor = new Multicolor(color);
         
        if (typeof pos !== 'undefined') {
            this.pos = pos;
            this.canvas_pos = view.create_canvas_coord(this.pos);
        }
        else{
            this.pos = undefined;
            this.canvas_pos = undefined;
        }
        this.timer_refresh = Date.now();
        this.id_timeout = undefined;
    }

    set_pos(newPos: Option<Coord>, board: ClientBoard) {

        if (typeof newPos != "undefined"){
            if( typeof this.pos == "undefined" || ( this.pos.x != newPos.x || this.pos.y != newPos.y ) ){ // If the user position is updated
                this.timer_refresh = Date.now();
                if( typeof this.id_timeout !== "undefined"){
                    clearTimeout(this.id_timeout); // We clear the current timeout 
                    this.id_timeout = undefined;
                }
                // We set a new timeout that starts after 2 seconds. 
                this.id_timeout = setTimeout(() => {
                    // We draw the canvas every 100ms
                    const interval_id = setInterval(()=>{
                        const canvas = document.getElementById('main') as HTMLCanvasElement;
                        const ctx = canvas.getContext('2d');
                        requestAnimationFrame(function () { board.draw() });
    
                        if(Date.now() - this.timer_refresh > 4000){
                            // The interval kill itself after the user does not move for 4secs 
                            clearInterval(interval_id); 
                        }
                    }, 100);
                }, 2000);
            }
        }
        
        this.pos = newPos;
        if (typeof this.pos != "undefined"){
            this.canvas_pos = board.view.create_canvas_coord(this.pos);
        } else {
            this.canvas_pos = undefined;
        }
    }

    setColor(color: string){
        this.multicolor.setColor(color);
    }
    

}

export let users = new Map<string, User>();




export function update_users_canvas_pos(view: View) {
    for (const user of users.values()){
        if ( typeof user.pos != "undefined"){
            user.canvas_pos = view.create_canvas_coord(user.pos);
        }
    }
}

export class Self{
    label: Option<string>;
    multicolor: Option<Multicolor>;
    id: Option<string>;
    following: string | undefined;
    canvasPos: Option<CanvasCoord>;

    constructor(){
        this.label = undefined;
        this.multicolor = undefined;
        this.id = undefined;
        this.following = undefined;
        this.canvasPos = undefined;
    }

    init(id: string, label: string, color: string){
        this.multicolor = new Multicolor(color);
        this.label = label;
        this.id = id;
    }

    update_label(label: string){
        this.label = label;
    }

    setColor(color: string){
        if (typeof this.multicolor == "undefined"){
            this.multicolor = new Multicolor(color);
        } else {
            this.multicolor.setColor(color);
        }
    }


    follow(id: string){
        if(users.has(id)){
            const borderDIV = document.getElementById("border");
            if (borderDIV == null) return;
            const u = users.get(id);
            if (typeof u == "undefined") return;
            this.following = id;
            borderDIV.style.borderColor = u.multicolor.color;
            socket.emit("follow", id);
        }
        else{
            this.following = undefined;
        }
    }

    unfollow(id:string){
        const borderDIV = document.getElementById("border");
        this.following = undefined;
        if (borderDIV != null){
            borderDIV.style.borderColor = COLOR_BACKGROUND;
        }
        socket.emit("unfollow", id);
    }
    
    update_self_user_color(){
        const div = document.getElementById('self_user_color');
        if (div != null && typeof this.multicolor != "undefined"){
            div.style.background = this.multicolor.color;
        }
    }

    update_self_user_div(){
        this.update_self_user_color();
        this.update_self_user_label();
    }
    
    update_user_list_div() {
        const div = document.getElementById("user_list");
        if (div == null) return;
        div.innerHTML = "";
        if (users.size === 0) {
            div.style.visibility = "hidden";
            // div.style.marginLeft = "0px";
            div.style.padding = "0px";
        }
        else {
            div.style.visibility = "visible";
            div.style.padding = "2px";
            // div.style.marginLeft = "10px";
        }
    
        for (let u of users.values()) {
            let newDiv = document.createElement("div");
            newDiv.classList.add("user");
            newDiv.style.color = u.multicolor.contrast;
            newDiv.innerHTML = u.label.substring(0, 1);
            newDiv.title = "Click to follow " + u.label;
            newDiv.style.background = u.multicolor.color;
            newDiv.style.borderColor = u.multicolor.color;
            newDiv.dataset.label = u.label;
    
            const self_user = this;
            newDiv.onclick = function () {
                if(self_user.following === u.id){
                    self_user.unfollow(u.id);
                }
                else{
                    self_user.follow(u.id);
                }
            }
            div.appendChild(newDiv);
        }
    }


    update_self_user_label(){
        let div = document.getElementById('self_user_label');
        if (div == null) return;
        if (typeof this.label == "undefined") return;

        div.textContent = this.label;
        div.addEventListener('keydown', function(e:KeyboardEvent) {   
            const someKeys: Array<string> = ["Delete", "Backspace", "ArrowLeft", "ArrowRight"];
            if (div == null || div.textContent == null) return;

            const prevent = "!@#$%^&*()+=-[]\\\';,./{}|\":<>?";
            if(div.textContent.length > 0 && (e.key == "Escape" || e.key == "Enter")){
                div.blur();
            }
            else if(prevent.includes(e.key) || (div.textContent.length > 8 && someKeys.indexOf(e.key) == -1)){
                e.preventDefault();
            }
        });

        const selfUser = this;
        div.addEventListener('focusout', function() { 
            if (div != null && typeof selfUser.multicolor != "undefined"){
                socket.emit("update_self_user", div.textContent, selfUser.multicolor.color);
            }  
        });

    }

}







