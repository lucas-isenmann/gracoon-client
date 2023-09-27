import { Coord, linesIntersection, Option, Vect } from "gramoloss";
import { Camera } from "./camera";
import { CanvasCoord } from "./canvas_coord";
import { drawArc, drawLine } from "./draw_basics";

const GRID_COLOR = '#777777';


export enum GridType {
    GridRect,
    GridVerticalTriangular,
    GridHorizontalTriangular, 
    GridPolar
}

export class Grid {
    type: Option<GridType>;

    polarCenter: Coord;
    polarDivision: number; // >= 5

    grid_size: number;
    grid_min_size: number;
    grid_max_size: number;
    grid_initial_size: number;

    constructor(){
        this.type = undefined;
        this.polarCenter = new Coord(400,400);
        this.polarDivision = 12;
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

    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: Camera){
        if ( this.type == GridType.GridRect){
            this.drawRectangularGrid(canvas, ctx, camera);
        } else if ( this.type == GridType.GridVerticalTriangular){
            this.drawVerticalTriangularGrid(canvas, ctx, camera);
        } else if ( this.type == GridType.GridPolar){
            this.drawPolarGrid(canvas, ctx, camera);
        }
    }

    /**
     * The length of the grid is `grid_size`
     */
    drawRectangularGrid(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: Camera) {
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

    drawPolarGrid(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: Camera) {
        const color = GRID_COLOR;
        const c = this.polarCenter;
        const center = CanvasCoord.fromCoord(c, camera);

        const cTopLeft = new CanvasCoord(0, 0).toCoord(camera);
        const cBotRight = new CanvasCoord(canvas.width, canvas.height).toCoord(camera);
        const cBotLeft = new CanvasCoord(0, canvas.height).toCoord(camera);
        const cTopRight = new CanvasCoord(canvas.width, 0).toCoord(camera);

        const d1 = Math.sqrt(cBotRight.dist2(c));
        const d2 = Math.sqrt(cBotLeft.dist2(c));
        const d3 = Math.sqrt(cTopLeft.dist2(c));
        const d4 = Math.sqrt(cTopRight.dist2(c));
        
        let min = Math.min(d1, d2, d3, d4);
        let max = Math.max(d1, d2, d3, d4);


        if (0 <= center.x && center.x <= canvas.width){
            const dBot = Math.sqrt(c.orthogonal_projection(cBotLeft, new Vect(1,0)).dist2(c));
            const dTop = Math.sqrt(c.orthogonal_projection(cTopRight, new Vect(1,0)).dist2(c));
            min = Math.min(min, dBot, dTop);
            max = Math.max(max, dBot, dTop);
        }
        if ( 0 <= center.y  && center.y <= canvas.height){
            const dLeft = Math.sqrt(c.orthogonal_projection(cBotLeft, new Vect(0,1)).dist2(c));
            const dRight = Math.sqrt(c.orthogonal_projection(cTopRight, new Vect(0,1)).dist2(c));
            min = Math.min(min, dLeft, dRight);
            max = Math.max(max, dLeft, dRight);
        }

        const mini = (0 <= center.x && center.x <= canvas.width && 0 <= center.y && center.y <= canvas.height ) ? 0 :  Math.floor(min*camera.zoom/(this.grid_size*2));
        for (let i = mini ; i <= max*camera.zoom/(this.grid_size*2) ; i ++ ){
            drawArc(ctx, center, color, i*this.grid_size*2, 1, 1);
        }

        const c1 = new CanvasCoord(0, center.y);
        const c2 = new CanvasCoord(canvas.width, center.y);
        drawLine(c1, c2, ctx, color, 1 );

        // const c3 = new CanvasCoord(center.x, 0);
        // const c4 = new CanvasCoord(center.x, canvas.height);
        // drawLine(c3, c4, ctx, color,  );

        for (let i = 0 ; i < this.polarDivision ; i ++){
            const angle = 2*Math.PI*i/this.polarDivision;
            const rot = new Vect(1, 0);
            rot.rotate(angle);
            const end = c.copy();
            end.translate(rot);


            if ( i > this.polarDivision/2){
                const inter1 = linesIntersection(c, end, cTopLeft, cTopRight  )
                if (typeof inter1 != "undefined"){
                    drawLine(center, CanvasCoord.fromCoord(inter1, camera), ctx, color, 1);
                }
            } else {
                const inter2 = linesIntersection(c, end, cBotLeft, cBotRight  )
                if (typeof inter2 != "undefined"){
                    drawLine(center, CanvasCoord.fromCoord(inter2, camera), ctx, color, 1);
                }
            }
            

            
        }

    }



    /**
     * Draw a triangular grid. 
     * The length of the equilateral triangle is `grid_size` of camera.
     */
    drawVerticalTriangularGrid(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, camera: Camera) {
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
        //         drawCircle(cpos, "red", 10, 1, ctx);
        //     }
        // }


        // const px = ((mouse_pos.x - camera.camera.x) - (mouse_pos.y - camera.camera.y)/Math.sqrt(3))/grid_size;
        // const py = (mouse_pos.y - camera.camera.y)/h;
        // const i = Math.floor(px);
        // const j = Math.floor(py);

        // let pos = new Coord(i*grid_size + j*grid_size/2, Math.sqrt(3)*j*grid_size/2);
        // pos = pos.add(camera.camera);
        // let cpos = new CanvasCoord(pos.x, pos.y);
        // drawCircle(cpos, "blue", 10, 1, ctx);

        // let pos2 = new Coord((i+1)*grid_size + (j+1)*grid_size/2, Math.sqrt(3)*(j+1)*grid_size/2);
        // pos2 = pos2.add(camera.camera);
        // let cpos2 = new CanvasCoord(pos2.x, pos2.y);
        // drawCircle(cpos2, "blue", 10, 1, ctx);


    }
}