import { Coord, DegreeWidthRep, ORIENTATION } from "gramoloss";
import { drawCircle } from "../display/draw_basics";
import { Camera } from "../display/camera";
import { ClientLinkData } from "../link";
import { CanvasVect } from "../display/canvasVect";
import { ClientVertex } from "../vertex";
import { CanvasCoord } from "../display/canvas_coord";
import { BoardElementType, ClientBoard } from "../board";


export class ClientDegreeWidthRep extends DegreeWidthRep<ClientVertex, ClientLinkData> {
    canvas_corner_top_left : CanvasCoord;
    canvas_corner_bottom_left : CanvasCoord;
    canvas_corner_bottom_right : CanvasCoord;
    canvas_corner_top_right : CanvasCoord;
    board: ClientBoard;

    constructor(board: ClientBoard, c1: Coord, c2: Coord, camera: Camera){
        super(board.graph,c1,c2);
        this.board = board;
        this.canvas_corner_top_left = camera.create_canvas_coord(this.top_left_corner());
        this.canvas_corner_bottom_left = camera.create_canvas_coord(this.bot_left_corner());
        this.canvas_corner_bottom_right = camera.create_canvas_coord(this.bot_right_corner());
        this.canvas_corner_top_right = camera.create_canvas_coord(this.top_right_corner());
    }

    static from_embedding(board: ClientBoard, camera: Camera): ClientDegreeWidthRep{
        if ( board.graph.vertices.size > 0){
            let minX = NaN;
            let maxX = NaN;
            let minY = NaN;
            let maxY = NaN;
            for (const vertex of board.graph.vertices.values()){
                if ( isNaN(minX)){
                    minX = vertex.data.pos.x;
                    maxX = vertex.data.pos.x;
                    minY = vertex.data.pos.y;
                    maxY = vertex.data.pos.y;
                }else {
                    minX = Math.min(minX, vertex.data.pos.x );
                    maxX = Math.max(maxX, vertex.data.pos.x );
                    minY = Math.min(minY, vertex.data.pos.y );
                    maxY = Math.max(maxY, vertex.data.pos.y );
                }
            }
            const w = 20 + maxX - minX;
            minX += w;
            maxX += w;
            return new ClientDegreeWidthRep(board, new Coord(minX, minY), new Coord(maxX, maxY), camera);
        } else {
            return new ClientDegreeWidthRep(board, new Coord(0, 0), new Coord(100, 100), camera);
        }
    }

    getType(): BoardElementType{
        return BoardElementType.Representation;
    }

    draw(){
        const y = (this.c1.y + this.c2.y)/2;

        // draw border
        this.board.ctx.beginPath();
        this.board.ctx.strokeStyle = "blue";
        this.board.ctx.lineWidth = 2;
        const c1canvas = this.canvas_corner_top_left;
        const c2canvas = this.canvas_corner_bottom_right;
        this.board.ctx.rect(c1canvas.x , c1canvas.y, c2canvas.x - c1canvas.x, c2canvas.y - c1canvas.y);
        this.board.ctx.stroke();

        // draw rect fill
        this.board.ctx.globalAlpha = 0.07;
        this.board.ctx.fillStyle = "blue";
        this.board.ctx.fill();
        this.board.ctx.globalAlpha = 1;
        
        // draw arcs
        for (const [index1, x1] of this.x.entries()){
            const canvas_coord1 = this.board.camera.create_canvas_coord(new Coord(x1,y));
            for (const [index2, x2] of this.x.entries()){
                if (x1 < x2){
                    const canvas_coord2 = this.board.camera.create_canvas_coord(new Coord(x2,y));
                    const xmiddle = (canvas_coord1.x + canvas_coord2.x)/2;
                    if (this.board.graph.has_link(index2, index1, ORIENTATION.DIRECTED)){
                        this.board.ctx.beginPath();
                        this.board.ctx.moveTo(canvas_coord1.x, canvas_coord1.y);
                        this.board.ctx.lineWidth = 3;
                        this.board.ctx.quadraticCurveTo(xmiddle, canvas_coord1.y - 50, canvas_coord2.x, canvas_coord2.y);
                        this.board.ctx.stroke();
                    } 
                }
            }
        }

        // draw points
        for (const [index, x] of this.x.entries()){
            const canvas_coord = this.board.camera.create_canvas_coord(new Coord(x,y));
            drawCircle(canvas_coord, "black", 14, 1, this.board.ctx);
            drawCircle(canvas_coord, "blue", 12, 1, this.board.ctx);
            drawCircle(canvas_coord, "black", 10, 1, this.board.ctx);
            this.board.ctx.font = "17px Arial";
            const measure = this.board.ctx.measureText(String(index));
            this.board.ctx.fillStyle = "white";
            this.board.ctx.fillText(String(index), canvas_coord.x - measure.width / 2, canvas_coord.y+ 5);
        }

        // compute dw
        let dw = 0;
        for (const [index1, x1] of this.x.entries()){
            let dwc = 0;
            for (const [index2, x2] of this.x.entries()){
                if (index1 != index2){
                    if (x1 < x2 && this.board.graph.has_link(index2,index1, ORIENTATION.DIRECTED)){
                        dwc += 1;
                    } else if (x2 < x1 && this.board.graph.has_link(index1,index2, ORIENTATION.DIRECTED)){
                        dwc += 1;
                    } 
                }
            }
            if (dwc > dw){
                dw = dwc;
            }
        }

        // draw dw
        for (const [index1, x1] of this.x.entries()){
            let dwc = 0;
            for (const [index2, x2] of this.x.entries()){
                if (index1 != index2){
                    if (x1 < x2 && this.board.graph.has_link(index2,index1, ORIENTATION.DIRECTED)){
                        dwc += 1;
                    } else if (x2 < x1 && this.board.graph.has_link(index1,index2, ORIENTATION.DIRECTED)){
                        dwc += 1;
                    } 
                }
            }
            this.board.ctx.font = "17px Arial";
            const measure = this.board.ctx.measureText(String(dwc));
            const pos = this.board.camera.create_canvas_coord(new Coord(x1,y));
            if (dwc == dw){
                drawCircle(new CanvasCoord(pos.x, pos.y + 25), "red", 10, 0.5, this.board.ctx);
            }
            if ( this.board.isDarkMode()){
                this.board.ctx.fillStyle = "white";
            } else {
                this.board.ctx.fillStyle = "black";
            }
            this.board.ctx.fillText(String(dwc), pos.x - measure.width / 2, pos.y + 30);
        }
    }

    update_after_camera_change(camera: Camera){
        this.canvas_corner_top_left = camera.create_canvas_coord(this.top_left_corner());
        this.canvas_corner_bottom_left = camera.create_canvas_coord(this.bot_left_corner());
        this.canvas_corner_bottom_right = camera.create_canvas_coord(this.bot_right_corner());
        this.canvas_corner_top_right = camera.create_canvas_coord(this.top_right_corner());
    }

    click_over(pos: CanvasCoord, camera: Camera): number | string {
        const y = (this.c1.y + this.c2.y)/2;
        for ( const [index, x] of this.x.entries()){
            const canvas_coord = camera.create_canvas_coord(new Coord(x,y));
            if (canvas_coord.is_nearby(pos, 200)){
                return index;
            }
        }
        return "";
    }

    translate_element_by_canvas_vect(index: number, cshift: CanvasVect, camera: Camera){
        const shift = camera.server_vect(cshift);
        const x = this.x.get(index);
        if (typeof x != "undefined"){
            this.x.set(index, x + shift.x);
        }
    }

    translate_by_canvas_vect(cshift: CanvasVect, camera: Camera){
        const shift = camera.server_vect(cshift);
        for (const [index, x] of this.x.entries()){
            if (typeof x != "undefined"){
                this.x.set(index, x + shift.x);
            }
        }
    }

    onmouseup(camera: Camera){
        this.distribute();
    }
}