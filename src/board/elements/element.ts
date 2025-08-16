import { CanvasCoord } from "../display/canvas_coord";
import { Color } from "../display/colors_v2";
import { BoardElementType } from "../board";
import { CanvasVect } from "../display/canvasVect";


export interface BoardElement {
    id: number;
    cameraCenter: CanvasCoord;
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














