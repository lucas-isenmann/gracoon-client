import { bezierValue, Board, Coord, Vect } from "gramoloss";
import { solutionQuadratic } from "../../utils";
import { Camera } from "./camera";
import { CanvasVect } from "./canvasVect";

/**
 * A CanvasCoord is the coordinates of a point on a canvas.
 * These coordinates should be integers.
 * 
 */
export class CanvasCoord  {
    x: number;
    y: number;
    serverPos: Coord;
    private camera: Camera;

    constructor(x: number, y: number, camera: Camera){
        // super(Math.floor(x),Math.floor(y));
        this.x = x;
        this.y = y;
        this.camera = camera;
        this.serverPos = new Coord( (x - camera.camera.x)/ camera.zoom, (y - camera.camera.y)/ camera.zoom);
    }

    static fromCoord(c: Coord, camera: Camera): CanvasCoord{
        return new CanvasCoord(c.x*camera.zoom + camera.camera.x, c.y*camera.zoom+camera.camera.y, camera);
    }

    copy(): CanvasCoord {
        return new CanvasCoord(this.x, this.y, this.camera);
    }

    setServerPos(x: number, y: number){
        this.serverPos.x = x;
        this.serverPos.y = y;
        this.x = this.serverPos.x*this.camera.zoom + this.camera.camera.x;
        this.y = this.serverPos.y*this.camera.zoom + this.camera.camera.y;
    }

    setLocalPos(x: number, y: number){
        this.x = x;
        this.y = y;
        this.serverPos.x = (x - this.camera.camera.x)/ this.camera.zoom
        this.serverPos.y = (y - this.camera.camera.y)/ this.camera.zoom;
    }

    updateAfterCameraChange(){
        this.x = this.serverPos.x*this.camera.zoom + this.camera.camera.x;
        this.y = this.serverPos.y*this.camera.zoom + this.camera.camera.y;
    }


    dist(c: CanvasCoord): number {
        return Math.sqrt( (this.x - c.x)**2 + (this.y - c.y)**2);
    }

    dist2(c: CanvasCoord): number {
        return  (this.x - c.x)**2 + (this.y - c.y)**2;
    }


    is_in_rect(c1: CanvasCoord, c2: CanvasCoord): boolean {
        return (Math.min(c1.x, c2.x) <= this.x && this.x <= Math.max(c1.x, c2.x) &&
                Math.min(c1.y, c2.y) <= this.y && this.y <= Math.max(c1.y, c2.y))
    }
    
 

    translate_by_canvas_vect(shift: CanvasVect) {
        this.setLocalPos(this.x + shift.x, this.y + shift.y);
    }

    orthogonal_projection(c: Coord, dir: Vect): CanvasCoord{
        const u =  new Coord(this.x, this.y).orthogonal_projection(c, dir);
        return new CanvasCoord(u.x, u.y, this.camera);
    }

    middle(c: CanvasCoord) {
        return new CanvasCoord((this.x + c.x) / 2, (this.y + c.y) / 2, this.camera);
    }

    // is_nearby(pos: CanvasCoord, rsquared: number) {
    //     return this.dist2(pos) <= rsquared;
    // }


    /**
     * Return the Server coordinates of the Canvas coordinates.
     */
    toCoord(): Coord {
        return this.serverPos;
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
        if (c1.is_in_rect(new CanvasCoord(xA, yA, this.camera), new CanvasCoord(xB, yB, this.camera)) || c1.is_in_rect(new CanvasCoord(xA, yA, this.camera), new CanvasCoord(xB, yB, this.camera))) {
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
