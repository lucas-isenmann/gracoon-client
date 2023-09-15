import { bezierValue, Coord } from "gramoloss";
import { solutionQuadratic } from "../utils";
import { View } from "./camera";
import { CanvasVect } from "./vect";

/**
 * A CanvasCoord is the coordinates of a point on a canvas.
 * These coordinates should be integers.
 * 
 */
export class CanvasCoord extends Coord {
    constructor(x: number, y: number){
        super(Math.floor(x),Math.floor(y));
    }

    copy(): CanvasCoord {
        return new CanvasCoord(this.x, this.y);
    }

    subc(c: CanvasCoord): CanvasCoord {
        return new CanvasCoord(this.x - c.x,this.y - c.y);
    }

    addc(c: CanvasCoord): CanvasCoord {
        return new CanvasCoord(this.x + c.x,this.y + c.y);
    }
 

    translate_by_canvas_vect(shift: CanvasVect): void {
        this.x += shift.x;
        this.y += shift.y;
    }

    middle(c: CanvasCoord) {
        return new CanvasCoord((this.x + c.x) / 2, (this.y + c.y) / 2);
    }

    is_nearby(pos: CanvasCoord, rsquared: number) {
        return this.dist2(pos) <= rsquared;
    }


    /**
     * Return the Server coordinates of the Canvas coordinates.
     */
    toCoord(view: View): Coord {
        return new Coord( (this.x - view.camera.x)/ view.zoom, (this.y - view.camera.y)/ view.zoom);
    }

    static fromCoord(c: Coord, view: View): CanvasCoord{
        return new CanvasCoord(c.x*view.zoom + view.camera.x, c.y*view.zoom+view.camera.y);
    }

    // return boolean
    // true if the square of size 10 centered on this intersects the bezier Curve from c1 to c2 with control point cp
    is_nearby_beziers_1cp(c1: CanvasCoord, cp: CanvasCoord, c2: CanvasCoord): boolean {

        let xA = this.x - 5
        let yA = this.y - 5
        let xB = this.x + 5
        let yB = this.y + 5

        let minX = xA
        let minY = yA
        let maxX = xB
        let maxY = yB

        let x0 = c1.x;
        let y0 = c1.y;
        let x1 = cp.x;
        let y1 = cp.y;
        let x2 = c2.x;
        let y2 = c2.y;

        // case where one of the endvertices is already on the box
        if (c1.is_in_rect(new CanvasCoord(xA, yA), new CanvasCoord(xB, yB)) || c1.is_in_rect(new CanvasCoord(xA, yA), new CanvasCoord(xB, yB))) {
            return true
        } else {
            // we get the quadratic equation of the intersection of the bended edge and the sides of the box
            let aX = (x2 + x0 - 2 * x1);
            let bX = 2 * (x1 - x0);
            let cXmin = x0 - minX;
            let cXmax = x0 - maxX;

            let aY = (y2 + y0 - 2 * y1);
            let bY = 2 * (y1 - y0);
            let cYmin = y0 - minY;
            let cYmax = y0 - maxY;

            // the candidates for the intersections
            let tXmin = solutionQuadratic(aX, bX, cXmin);
            let tXmax = solutionQuadratic(aX, bX, cXmax);
            let tYmin = solutionQuadratic(aY, bY, cYmin);
            let tYmax = solutionQuadratic(aY, bY, cYmax);

            for (let t of tXmax.concat(tXmin)) { // we look for the candidates that are touching vertical sides
                if (t >= 0 && t <= 1) {
                    let y = bezierValue(t, y0, y1, y2);
                    if ((minY <= y && y <= maxY)) { // the candidate touches the box
                        return true;
                    }
                }
            }

            for (let t of tYmax.concat(tYmin)) {
                if (t >= 0 && t <= 1) {
                    let x = bezierValue(t, x0, x1, x2);
                    if ((minX <= x && x <= maxX)) {
                        return true;
                    }
                }
            }

        }
        return false;
    }
}
