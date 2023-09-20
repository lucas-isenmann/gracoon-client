import { Option } from "gramoloss";
import { COLOR_BACKGROUND } from "./board/board";
import { CanvasCoord } from "./board/canvas_coord";
import { Multicolor } from "./multicolor";
import { socket } from "./socket";
import { User } from "./user";


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


    follow(id: string, users: Map<string, User>){
        const u = users.get(id);
        if( typeof u != "undefined" ){
            const borderDIV = document.getElementById("border");
            if (borderDIV == null) return;
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




