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

    gridSize: number;
    gridMinSize: number;
    gridMaxSize: number;
    gridInitialSize: number;

    constructor(camera: Camera){
        this.type = undefined;

        this.polarCenter = new CanvasCoord(window.innerWidth/2, window.innerHeight/2, camera);
        this.polarDivision = 6;
        this.gridMinSize = 40;
        this.gridMaxSize = 100;
        this.gridInitialSize = 70;
        this.gridSize = this.gridInitialSize;
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
        this.gridSize = this.gridInitialSize * newZoom;
        while (this.gridSize > this.gridMaxSize){
            this.gridSize /= 2;
        }
        while (this.gridSize < this.gridMinSize){
            this.gridSize *= 2;
        }
    }

   
}
