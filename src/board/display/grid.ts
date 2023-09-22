import { Option } from "gramoloss";
import { View } from "./camera";

const GRID_COLOR = '#777777';


export enum GridType {
    GridRect,
    GridVerticalTriangular,
    GridHorizontalTriangular, 
    GridPolar
}

export class Grid {
    type: Option<GridType>;

    grid_size: number;
    grid_min_size: number;
    grid_max_size: number;
    grid_initial_size: number;

    constructor(){
        this.type = undefined;
        this.grid_min_size = 40;
        this.grid_max_size = 100;
        this.grid_initial_size = 70;
        this.grid_size = this.grid_initial_size;
    }

    updateToZoom(newZoom: number){
        this.grid_size = this.grid_initial_size * newZoom;
        while (this.grid_size > this.grid_max_size){
            this.grid_size /= 2;
        }
        while (this.grid_size < this.grid_min_size){
            this.grid_size *= 2;
        }
    }

    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: View){
        if ( this.type == GridType.GridRect){
            this.drawRectangularGrid(canvas, ctx, camera);
        } else if ( this.type == GridType.GridVerticalTriangular){
            this.drawVerticalTriangularGrid(canvas, ctx, camera);
        }
    }

    /**
     * The length of the grid is `grid_size`
     */
    drawRectangularGrid(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: View) {
        const grid_size = this.grid_size;

        for (let i = camera.camera.x % grid_size; i < canvas.width; i += grid_size) {
            ctx.beginPath();
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = 1;
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }

        for (let i = camera.camera.y % grid_size; i < canvas.height; i += grid_size) {
            ctx.beginPath();
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = 1;
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
    }



    /**
     * Draw a triangular grid. 
     * The length of the equilateral triangle is `grid_size` of camera.
     */
    drawVerticalTriangularGrid(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: View) {
        const grid_size = this.grid_size;
        const h = grid_size*Math.sqrt(3)/2;

        //   \ diagonals
        for (let x = (camera.camera.x - camera.camera.y/Math.sqrt(3)) % grid_size - Math.floor((canvas.width+canvas.height)/grid_size)*grid_size; x < canvas.width; x += grid_size) {
            ctx.beginPath();
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = 1;
            ctx.moveTo(x, 0);
            ctx.lineTo(x + canvas.height , canvas.height*Math.sqrt(3));
            ctx.stroke();
        }

        //   / diagonals
        for (let x = (camera.camera.x + camera.camera.y/Math.sqrt(3)) % grid_size + Math.floor((canvas.width+canvas.height)/grid_size)*grid_size; x > 0 ; x -= grid_size) {
            ctx.beginPath();
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = 1;
            ctx.moveTo(x, 0);
            ctx.lineTo(x - canvas.height , canvas.height*Math.sqrt(3));
            ctx.stroke();
        }

        // horizontal lines
        for (let y = camera.camera.y % h; y < canvas.height; y += h) {
            ctx.beginPath();
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = 1;
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // debugging : draw the quadrilateral containing the point

        // for (let i = 0 ; i < 10 ; i ++){
        //     for (let j = 0 ; j < 10 ; j ++){
        //         let pos = new Coord(i*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2);
        //         pos = pos.add(camera.camera);
        //         let cpos = new CanvasCoord(pos.x, pos.y);
        //         draw_circle(cpos, "red", 10, 1, ctx);
        //     }
        // }


        // const px = ((mouse_pos.x - camera.camera.x) - (mouse_pos.y - camera.camera.y)/Math.sqrt(3))/grid_size;
        // const py = (mouse_pos.y - camera.camera.y)/h;
        // const i = Math.floor(px);
        // const j = Math.floor(py);

        // let pos = new Coord(i*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2);
        // pos = pos.add(camera.camera);
        // let cpos = new CanvasCoord(pos.x, pos.y);
        // draw_circle(cpos, "blue", 10, 1, ctx);

        // let pos2 = new Coord((i+1)*grid_size + (j+1)*grid_size/2, Math.sqrt(3)*(j+1)*grid_size/2);
        // pos2 = pos2.add(camera.camera);
        // let cpos2 = new CanvasCoord(pos2.x, pos2.y);
        // draw_circle(cpos2, "blue", 10, 1, ctx);


    }
}