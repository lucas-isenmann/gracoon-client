

export enum DOWN_TYPE {
    EMPTY = "EMPTY",
    VERTEX = "VERTEX",
    LINK = "LINK",
    CONTROL_POINT = "CONTROL_POINT",
    STROKE = "STROKE",
    AREA = "AREA",
    LINK_WEIGHT = "LINK_WEIGHT",
    VERTEX_WEIGHT = "VERTEX_WEIGHT",
    TEXT_ZONE = "TEXT_ZONE",
    REPRESENTATION_ELEMENT = "REPRESENTATION_ELEMENT",
    RESIZE = "RESIZE",
    REPRESENTATION = "REPRESENTATION",
    RECTANGLE = "RECTANGLE"
}

export enum RESIZE_TYPE {
    BOTTOM = "BOTTOM",
    TOP = "TOP",
    LEFT = "LEFT",
    RIGHT = "RIGHT",
    TOP_RIGHT = "TOP_RIGHT",
    TOP_LEFT = "TOP_LEFT",
    BOTTOM_RIGHT = "BOTTOM_RIGHT",
    BOTTOM_LEFT = "BOTTOM_LEFT"
}

export namespace RESIZE_TYPE {
    export function to_cursor(resize_type: RESIZE_TYPE): string {
        switch (resize_type) {
            case RESIZE_TYPE.TOP_LEFT:
                return "nw-resize";
            case RESIZE_TYPE.TOP_RIGHT:
                return "ne-resize";
            case RESIZE_TYPE.BOTTOM_RIGHT:
                return "se-resize";
            case RESIZE_TYPE.BOTTOM_LEFT:
                return "sw-resize";
            case RESIZE_TYPE.RIGHT:
                return "e-resize";
            case RESIZE_TYPE.LEFT:
                return "w-resize";
            case RESIZE_TYPE.TOP:
                return "n-resize";
            case RESIZE_TYPE.BOTTOM:
                return "s-resize";
            default:
                return "default";
        }
    }
}



