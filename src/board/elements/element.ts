import { CanvasCoord } from "../display/canvas_coord";
import { Color, getCanvasColor } from "../display/colors_v2";
import { BoardElementType, ClientBoard } from "../board";
import { CanvasVect } from "../display/canvasVect";
import { Coord } from "gramoloss";
import katex from "katex";
import { highlightColors } from "../display/highlight_colors";
import { LinkElement } from "./link";


export interface BoardElement {
    cameraCenter: CanvasCoord;
    // serverCenter: Coord; // à virer
    serverId: number;
    boardElementType: BoardElementType;
    delete: () => void;

    updateAfterCameraChange: () => void;
    
    setColor: (color: Color) => void;
    color: Color;

    translate: (cshift: CanvasVect) => void;

    isSelected: boolean;
    select: () => void;
    deselect: () => void;

    isInRect: (corner1: CanvasCoord, corner2: CanvasCoord) => boolean;
    isNearby: (pos: CanvasCoord, d: number) => boolean;
}














