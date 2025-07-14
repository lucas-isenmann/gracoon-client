import { Option } from "gramoloss";
import { Camera } from "./camera";
import { CanvasCoord } from "./canvas_coord";

const GRID_COLOR = '#777777';


export enum GridType {
    GridRect,
    GridVerticalTriangular,
    GridHorizontalTriangular, 
    GridPolar
}

export class Grid {
    type: Option<GridType>;

    polarCenter: CanvasCoord;
    polarDivision: number; // >= 5

    grid_size: number;
    grid_min_size: number;
    grid_max_size: number;
    grid_initial_size: number;

    constructor(camera: Camera){
        this.type = undefined;

        this.polarCenter = new CanvasCoord(window.innerWidth/2, window.innerHeight/2, camera);
        this.polarDivision = 6;
        this.grid_min_size = 40;
        this.grid_max_size = 100;
        this.grid_initial_size = 70;
        this.grid_size = this.grid_initial_size;
    }

    get(property: string): Option<string>{
        if (property == "polarDivision") return this.polarDivision.toString();
        else return undefined;
    }

    set(property: string, v: string){
        if (property == "polarDivision"){
            this.polarDivision = parseInt(v);
        }
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

   
}
