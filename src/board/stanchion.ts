import { bezier_curve_point, Coord, linesIntersection, Vect } from "gramoloss";
import { ClientVertex } from "./vertex";


/**
 *  Coords are O, Control points are +
 * 
 * ```
 *  cp pos   quarterEdgePoint    edgeAdj
 *  +  O     O  + quarterCp      O
 *                + middleCp
 * V---O-----------O-------------V
 *     edgePoint   middlePoint
 *     O
 *     jumpAdj
 * ```
 */
export class QuarterPoint {
    id: number;
    pos: Coord;
    cp: Coord;
    edgePoint: Coord; // are temporarily used for computing the other points
    quarterEdgePoint: Coord;
    quarterEdgeCP: Coord;
    middleEdgePoint: Coord;
    middleEdgeCP: Coord;

    interiorAdj: number;
    edgeAdj: number;
    jumpAdj: number;
    vertexAdj: ClientVertex;

    constructor( 
        id: number,
        pos: Coord,
        cp: Coord,
        interiorAdj: number,
        edgeAdj: number,
        jumpAdj: number,
        vertexAdj: ClientVertex){
            this.id = id;
            this.pos = pos;
            this.cp = cp;
            this.interiorAdj = interiorAdj;
            this.edgeAdj = edgeAdj;
            this.jumpAdj = jumpAdj;
            this.vertexAdj = vertexAdj;
            this.edgePoint = new Coord(0,0);
            this.quarterEdgePoint = new Coord(0,0);
            this.quarterEdgeCP = new Coord(0,0);
            this.middleEdgePoint = new Coord(0,0);
            this.middleEdgeCP = new Coord(0,0);
        }

    
    /**
     *  edgePoint can be computed only with the positions of qpJump and qpEdge.
     * edgePoint is used after for computing quarter and middle points.
     */
    computeEdgePoint(qpJump: QuarterPoint, qpEdge: QuarterPoint){
        const vpos = this.vertexAdj.getPos();
        const edgeDir = vpos.vectorTo(qpEdge.vertexAdj.getPos());
    
        if ( qpJump.pos.vectorTo(this.pos).dot(edgeDir) < 0 ){ // (pos -vpos). e < (jpos - vpos).e
            this.edgePoint = qpJump.pos.orthogonal_projection(vpos, edgeDir);
        } else {
            this.edgePoint = this.pos.orthogonal_projection(vpos, edgeDir );
        }
    }


    /**
     * 
     * @param h 
     * @param ratio in [0, 1]
     */
    computeQuarterMiddlePoints(qpEdge: QuarterPoint, h: number, ratio: number, t: number){
        const vpos = this.vertexAdj.getPos();
        const npos = qpEdge.vertexAdj.getPos();

        const middle = this.edgePoint.middle(qpEdge.edgePoint);
        const dir = Vect.from_coords(vpos, npos);
        dir.rotate(Math.PI/2);
        dir.setNorm(h);
        const middleA = middle.copy();
        middleA.translate(dir);
        const middleB = middle.copy();
        middleB.rtranslate(dir);

        const dir1 = this.edgePoint.vectorTo(qpEdge.edgePoint);
        dir1.rescale(ratio/2);

        


        if (this.id %2 == 1){
            const middle1 = middleA.copy(); // m1 = A - dir1
            middle1.rtranslate(dir1);
            const middle2 = middleB.copy(); // m2 = B + dir1
            middle2.translate(dir1);

            // truncated twist
            const w1 = bezier_curve_point(t, [middle1, middleA, middleB, middle2]);
            const c1 = middle1.copy();
            const cd1 = Vect.from_coords(middle1, middleA);
            cd1.rescale(t);
            c1.translate(cd1);

            const cw1 = w1.copy();
            const cdw1 = Vect.from_coords(w1, c1);
            cdw1.setNorm(cd1.norm());
            cw1.translate(cdw1);

            this.quarterEdgePoint = middle1;
            this.quarterEdgeCP = c1;
            this.middleEdgeCP = cw1; 
            this.middleEdgePoint = w1;

        } else {
            const middle1 = middleB.copy();
            middle1.rtranslate(dir1);
            const middle2 = middleA.copy();
            middle2.translate(dir1);
        
            // let d = `L ${middle1.x} ${middle1.y}`;
            // d += `C ${middleB.x} ${middleB.y}, ${middleA.x} ${middleA.y}, ${middle2.x} ${middle2.y}`;
            // d += `L ${qp2.pos.x} ${qp2.pos.y}`;

            this.quarterEdgePoint = middle1;
            this.quarterEdgeCP = middleB;
            // this.middleEdgeCP = cw1; // useless
            // this.middleEdgePoint = w1; // useless
        }

    }
}




/**  qp1.id is ODD:
 * 
 * ```
 *              B-m2---qp2
 * v1 ----------|--------- v2
 *    qp1 ---m1-A
 * ```
 * 
 * qp1.id is EVEN:
 * ```
 *    qp1----m1-B       
 * v1 ----------|--------- v2
 *              A-m2---qp2
 * ```
 */

export function curvedStanchion(qp1: QuarterPoint, qp2: QuarterPoint, h : number, h2: number): string{
    const v1 = qp1.vertexAdj;
    const v2 = qp2.vertexAdj;

    const middle = v1.getPos().middle(v2.getPos());
    const dir = Vect.from_coords(v1.getPos(), v2.getPos());
    dir.rotate(Math.PI/2);
    dir.setNorm(h);
    const middleA = middle.copy();
    middleA.translate(dir);
    const middleB = middle.copy();
    middleB.rtranslate(dir);

    const dir1 = Vect.from_coords(v1.getPos(), v2.getPos());
    dir1.setNorm(h2);

    if (qp1.id %2 == 1){
        const middle1 = middleA.copy(); // m1 = A -dir1
        middle1.rtranslate(dir1);
    
        const middle2 = middleB.copy(); // m2 = B + dir1
        middle2.translate(dir1);
    
        let d = `L ${middle1.x} ${middle1.y}`;
        d += `C ${middleA.x} ${middleA.y}, ${middleB.x} ${middleB.y}, ${middle2.x} ${middle2.y}`;
        d += `L ${qp2.pos.x} ${qp2.pos.y}`;
        return d;
    }
    else {
        const middle1 = middleB.copy();
        middle1.rtranslate(dir1);
    
        const middle2 = middleA.copy();
        middle2.translate(dir1);
    
        let d = `L ${middle1.x} ${middle1.y}`;
        d += `C ${middleB.x} ${middleB.y}, ${middleA.x} ${middleA.y}, ${middle2.x} ${middle2.y}`;
        d += `L ${qp2.pos.x} ${qp2.pos.y}`;
        return d;
    }
}

/**  qp1.id is ODD:
 * 
 * ```
 *                      B-m2---qp2
 * v1 ------------------|--------- v2
 *                   w1
 *                 cw1
 *                /
 *    qp1 ---m1-c1------A
 * ```
 * 
 * qp1.id is EVEN:
 * ```
 *    qp1----m1-B       
 * v1 ----------|--------- v2
 *              A-m2---qp2
 * ```
 */
export function curvedStanchionUnder(qp1: QuarterPoint, qp2: QuarterPoint, h : number, h2: number, t: number): string{
    const v1 = qp1.vertexAdj;
    const v2 = qp2.vertexAdj;

    const middle = v1.getPos().middle(v2.getPos());
    const dir = Vect.from_coords(v1.getPos(), v2.getPos());
    dir.rotate(Math.PI/2);
    dir.setNorm(h);
    const middleA = middle.copy();
    middleA.translate(dir);
    const middleB = middle.copy();
    middleB.rtranslate(dir);

    const dir1 = Vect.from_coords(v1.getPos(), v2.getPos());
    dir1.setNorm(h2);

    

    if (qp1.id %2 == 1){
        const middle1 = middleA.copy(); // m1 = A - dir1
        middle1.rtranslate(dir1);
    
        const middle2 = middleB.copy(); // m2 = B + dir1
        middle2.translate(dir1);

        // under
        const w1 = bezier_curve_point(t, [middle1, middleA, middleB, middle2]);
        const c1 = middle1.copy();
        const cd1 = Vect.from_coords(middle1, middleA);
        cd1.x *= t;
        cd1.y *= t;
        c1.translate(cd1);

        const cw1 = w1.copy();
        const cdw1 = Vect.from_coords(w1, c1);
        cdw1.setNorm(cd1.norm());
        cw1.translate(cdw1);

        const w2 = bezier_curve_point(t, [middle2, middleB, middleA, middle1]);

        const c2 = middle2.copy();
        const cd2 = Vect.from_coords(middle2, middleB);
        cd2.x *= t;
        cd2.y *= t;
        c2.translate(cd2);

        const cw2 = w2.copy();
        const cdw2 = Vect.from_coords(w2, c2);
        cdw2.setNorm(cd2.norm());
        cw2.translate(cdw2);

        let d = `L ${middle1.x} ${middle1.y} C ${c1.x} ${c1.y}, ${cw1.x} ${cw1.y}, ${w1.x} ${w1.y}`;
        d += `M ${w2.x} ${w2.y} C ${cw2.x} ${cw2.y}, ${c2.x} ${c2.y}, ${middle2.x} ${middle2.y}`;
        d += `L ${qp2.pos.x} ${qp2.pos.y}`;
        return d;
    
    }
    else { // Starting from an even QP, we go over
        const middle1 = middleB.copy();
        middle1.rtranslate(dir1);
    
        const middle2 = middleA.copy();
        middle2.translate(dir1);
    
        let d = `L ${middle1.x} ${middle1.y}`;
        d += `C ${middleB.x} ${middleB.y}, ${middleA.x} ${middleA.y}, ${middle2.x} ${middle2.y}`;
        d += `L ${qp2.pos.x} ${qp2.pos.y}`;
        return d;
    }
}





export function curvedStanchionUnder2(qp1: QuarterPoint, qp2: QuarterPoint, h : number, h2: number, t: number): string{
    const v1 = qp1.vertexAdj;
    const v2 = qp2.vertexAdj;

    const middle = qp1.edgePoint.middle(qp2.edgePoint);
    const dir = Vect.from_coords(v1.getPos(), v2.getPos());
    dir.rotate(Math.PI/2);
    dir.setNorm(h);
    const middleA = middle.copy();
    middleA.translate(dir);
    const middleB = middle.copy();
    middleB.rtranslate(dir);

    const dir1 = qp1.edgePoint.vectorTo(qp2.edgePoint);
    dir1.rescale(0.25);
    

    if (qp1.id %2 == 1){
        const middle1 = middleA.copy(); // m1 = A - dir1
        middle1.rtranslate(dir1);
    
        const middle2 = middleB.copy(); // m2 = B + dir1
        middle2.translate(dir1);

        // under
        const w1 = bezier_curve_point(t, [middle1, middleA, middleB, middle2]);
        const c1 = middle1.copy();
        const cd1 = Vect.from_coords(middle1, middleA);
        cd1.x *= t;
        cd1.y *= t;
        c1.translate(cd1);

        const cw1 = w1.copy();
        const cdw1 = Vect.from_coords(w1, c1);
        cdw1.setNorm(cd1.norm());
        cw1.translate(cdw1);

        const w2 = bezier_curve_point(t, [middle2, middleB, middleA, middle1]);

        const c2 = middle2.copy();
        const cd2 = Vect.from_coords(middle2, middleB);
        cd2.x *= t;
        cd2.y *= t;
        c2.translate(cd2);

        const cw2 = w2.copy();
        const cdw2 = Vect.from_coords(w2, c2);
        cdw2.setNorm(cd2.norm());
        cw2.translate(cdw2);

        let d = `L ${middle1.x} ${middle1.y} C ${c1.x} ${c1.y}, ${cw1.x} ${cw1.y}, ${w1.x} ${w1.y}`;
        d += `M ${w2.x} ${w2.y} C ${cw2.x} ${cw2.y}, ${c2.x} ${c2.y}, ${middle2.x} ${middle2.y}`;
        d += `L ${qp2.pos.x} ${qp2.pos.y}`;
        return d;
    
    }
    else { // Starting from an even QP, we go over
        const middle1 = middleB.copy();
        middle1.rtranslate(dir1);
    
        const middle2 = middleA.copy();
        middle2.translate(dir1);
    
        let d = `L ${middle1.x} ${middle1.y}`;
        d += `C ${middleB.x} ${middleB.y}, ${middleA.x} ${middleA.y}, ${middle2.x} ${middle2.y}`;
        d += `L ${qp2.pos.x} ${qp2.pos.y}`;
        return d;
    }
}



export function pathToSVGPath(d: string, width: number, color: string): string {
    return `<path d="${d}" stroke="${color}" fill="none" stroke-linejoin="round" stroke-linecap="round" stroke-width="${width}"/>`;
}

export function angleAround(origin: Coord, p1: Coord, p2: Coord): number {
    const q1 = p1.sub(origin);
    const q2 = p2.sub(origin);
    const x1 = q1.x;
    const y1 = q1.y;
    const x2 = q2.x;
    const y2 = q2.y;
    const angle1 = Math.atan2(y1, x1);
    const angle2 = Math.atan2(y2, x2);
    return (angle2 - angle1 + Math.PI) % (2 * Math.PI) - Math.PI;
}

// to put in gramoloss -> 2d-coords
export function comparePointsByAngle(origin: Coord, p1: Coord, p2: Coord): number {
    const q1 = p1.sub(origin);
    const q2 = p2.sub(origin);
    const x1 = q1.x;
    const y1 = q1.y;
    const x2 = q2.x;
    const y2 = q2.y;
    const angle1 = Math.atan2(y1, x1);
    const angle2 = Math.atan2(y2, x2);

    if (angle1 < angle2) {
        return -1;
    } else if (angle1 > angle2) {
        return 1;
    } else {
        return 0;
    }
}


export function coordToSVGcircle(coord: Coord, r: number, color: string){
    return `<circle
        cx="${coord.x}"
        cy="${coord.y}"
        r="${r}"
        fill="${color}"
        />`;
}

export function segmentToSVGLine(p1: Coord, p2: Coord, color: string, width: number): string{
    return `<line
        x1="${p1.x}"
        y1="${p1.y}"
        x2="${p2.x}"
        y2="${p2.y}"
        stroke="${color}"
        stroke-width="${width}"
        />`
}



/**
 * Returns 3 Coords: the first is the position of the even QP.
 * The second is the CP of both QPs.
 * The third is the odd QP.
 */
export function auxCombMap(vertex: ClientVertex, neighbor: ClientVertex, nextNeighborCW: ClientVertex, h: number, adapatToEdgeLength: boolean, durete: number): [Coord, Coord, Coord]{
    console.log("auxCombMap", vertex.index, neighbor.index, nextNeighborCW.index);

    const edgeDir = vertex.getPos().vectorTo(neighbor.getPos());
    edgeDir.setNorm(1);
    const nextEdgeDir = vertex.getPos().vectorTo(nextNeighborCW.getPos());
    nextEdgeDir.setNorm(1);
    const dir = Vect.from_coords(vertex.getPos(), neighbor.getPos());
    const dir2 = Vect.from_coords(vertex.getPos(), nextNeighborCW.getPos());

    let hnext = h;
    if (adapatToEdgeLength){
        h = hFromEdgeLength(dir);
        hnext = hFromEdgeLength(dir2);
    }

    dir.rotate(Math.PI/2);
    dir.setNorm(h);

    const vshifted = vertex.getPos().copy();
    vshifted.translate(dir);
    const nshifted = neighbor.getPos().copy();
    nshifted.translate(dir);

    dir2.rotate(-Math.PI/2);
    dir2.setNorm(hnext);

    const vshifted2 = vertex.getPos().copy();
    vshifted2.translate(dir2);
    const nshifted2 = nextNeighborCW.getPos().copy();
    nshifted2.translate(dir2);


    const w = linesIntersection(vshifted, nshifted, vshifted2, nshifted2);
    if (typeof w === "undefined"){
        return [vshifted, vshifted, vshifted];
    } 

    const qp1pos = w.copy();
    edgeDir.setNorm(durete);
    qp1pos.translate(edgeDir);

    const qp2pos = w.copy();
    nextEdgeDir.setNorm(durete);
    qp2pos.translate(nextEdgeDir);

    return [qp1pos, w, qp2pos];

    const angle = angleAround(vertex.getPos(),  nextNeighborCW.getPos(), neighbor.getPos());
     console.log("angle: ", vertex.index, neighbor.index, nextNeighborCW.index, angle);
    if (  0 < angle || angle < -Math.PI){
        // v1
        console.log("case1");
        // svgString += `<path d="M ${vshifted.x} ${vshifted.y} C ${w.x} ${w.y}, ${w.x} ${w.y}, ${vshifted2.x} ${vshifted2.y}" stroke="black" fill="none"/>`;
        return [vshifted, w, vshifted2];

        // vAngleCWPoints.set(neighbors[i].index, vshifted);
        // vAngleCCWPoints.set(neighbors[j].index, vshifted2)
        
    } else {
        console.log("case2");
        const r = 0.5;
        const m1 = new Coord((1+r)*w.x - vshifted.x*r, (1+r)*w.y - vshifted.y*r);
        const m2 = new Coord((1+r)*w.x - vshifted2.x*r, (1+r)*w.y - vshifted2.y*r);
        return [m1, w, m2];        

        // svgString += `<path d="M ${m1.x} ${m1.y} C ${w.x} ${w.y}, ${w.x} ${w.y}, ${m2.x} ${m2.y}" stroke="black" fill="none"/>`;
    
        // vAngleCWPoints.set(neighbors[i].index, m1);
        // vAngleCCWPoints.set(neighbors[j].index, m2)
    }
}


/**
 * Return the distance from the edge to the quarter point 
 */
export function hFromEdgeLength(edgeVector: Vect): number{
    return edgeVector.norm()/9;
}

/**
 * Return the distance from the middle to the twisted middle point of the quarter point 
 */
export function h2FromEdgeLength(edgeVector: Vect): number{
    return edgeVector.norm()/9;
}
