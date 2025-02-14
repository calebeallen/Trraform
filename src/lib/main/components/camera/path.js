
import { Vector3 } from "three"

class Segment {

    p0
    p1
    t0
    t1
    length

    constructor(p0, p1, t0, t1){

        this.p0 = p0
        this.p1 = p1
        this.t0 = t0
        this.t1 = t1

        this.length = this.approxLength()
        
    }

    setP0(p, t){

        this.p0 = p
        this.t0 = t

        this.length = this.approxLength()

    }

    setP1(p, t){

        this.p1 = p
        this.t1 = t

        this.length = this.approxLength()

    }

    approxLength(subdivisions = 1000) {

        let length = 0
        let prevP = this.getPosition(0) 

        for (let i = 1; i <= subdivisions; i++) {

            const t = i / subdivisions
            const currP = this.getPosition(t)

            length += currP.distanceTo(prevP)
            prevP = currP

        }

        return length

    }

    getPosition(alpha){

        const { p0, p1, t0, t1 } = this
        const alpha2 = alpha ** 2
        const alpha3 = alpha ** 3
    
        // Hermite basis
        const h1 = 2 * alpha3 - 3 * alpha2 + 1
        const h2 = -2 * alpha3 + 3 * alpha2
        const h3 = alpha3 - 2 * alpha2 + alpha
        const h4 = alpha3 - alpha2
    
        // p(t) = p0*h1 + p1*h2 + m0*h3 + m1*h4
        const x = p0.x*h1 + p1.x*h2 + t0.x*h3 + t1.x*h4
        const y = p0.y*h1 + p1.y*h2 + t0.y*h3 + t1.y*h4
        const z = p0.z*h1 + p1.z*h2 + t0.z*h3 + t1.z*h4

        // console.log(x,y,z,alpha)
    
        return new Vector3(x, y, z)

    }

    getTangent(alpha){

        // if(this.isLine)

        //     return this.t0

        // const { angle, radius, u, v } = this

        // const theta = angle * alpha
        // const sinA  = Math.sin(theta)
        // const cosA  = Math.cos(theta)
        // const dTheta = angle

        // const tx = radius * (-u.x * sinA + v.x * cosA) * dTheta
        // const ty = radius * (-u.y * sinA + v.y * cosA) * dTheta
        // const tz = radius * (-u.z * sinA + v.z * cosA) * dTheta

        // return new Vector3(tx, ty, tz);

    }

}

export class Path {

    constructor(segments = []){

        this.segments = segments
        this.length = 0

    }

    setFromPoints(points){

        if(points.length < 2)

            return null

        this.length = 0
        this.segments = []

        for(let i = 1; i < points.length; i++){

            const p0 = points[i - 1].clone()
            const p1 = points[i].clone()
            const t0 = p1.clone().sub(p0)
            let t1

            if( i < points.length - 1) { 

                t1 = points[i + 1].clone().sub(p1)

            } else

                t1 = t0.clone()

            const segment = new Segment(p0, p1, t0, t1)

            this.segments.push(segment)

            this.length += segment.length

        }

    }

    u2t(u) {

        const dist = this.length * u
        let seg = null, distSum = 0
    
        for (const segment of this.segments) {

            if (dist >= distSum && dist < distSum + segment.length) {

                seg = segment
                break

            }

            distSum += segment.length

        }
    
        // Handle edge case where u == 1 (map to the last segment with t = 1)
        if (!seg) {

            seg = this.segments[this.segments.length - 1]
            return { segment: seg, t: 1 }

        }
    
        const n = dist - distSum
        const d = seg.length
    
        return {
            segment: seg,
            t: n / d
        }

    }

    getPosition(u){

        const { segment, t } = this.u2t(u)

        return segment.getPosition(t)

    }

    getTangent(u){

        const { segment, t } = this.u2t(u)

        return segment.getTangent(t)

    }

    getSegmentIndex(u){

        const { segment } = this.u2t(u)

        return this.segments.indexOf(segment)

    }

    getPoints(samples = 100){

        const points = new Array(samples)

        for(let i = 0; i <= samples; i++)

            points[i] = this.getPosition(i / samples)

        return points
            
    }

}