
import { Matrix4, Vector4 } from "three"

class Node {

    constructor(points, depth){

        const axis = depth % 3
        const medianIndex = Math.floor(points.length / 2)

        points.sort( (a, b) => a.p[axis] - b.p[axis] )

        this.a = axis
        this.p = points[medianIndex].p
        this.d = points[medianIndex].d

        const left = points.slice( 0, medianIndex )
        const right = points.slice( medianIndex + 1 )

        this.l = left.length > 0 ? new Node(left, depth + 1) : null
        this.r = right.length > 0 ? new Node(right, depth + 1) : null

    }

}

export default class KdTree extends Node {

    constructor(points, data){

        const packaged = []

        for(let i = 0; i < points.length; i++)

            packaged.push( { p: points[i], d: data[i] } )

        super(packaged, 0)

    }

    findKClosest(target, k, heap = new MaxHeap()){

        this._findKClosest(this, target, k, 0, heap)

        heap.forEach(elem =>{
            
            elem.dist = Math.sqrt(elem.dist)
        
        })

        return heap

    }

    findKClosestInCamera(target, k, camera, heap = new MaxHeap()){

        const viewMatrix = new Matrix4()
        viewMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse )

        this._findKClosestInCamera(this, target, k, 0, viewMatrix, heap)

        heap.forEach(elem =>{
            
            elem.dist = Math.sqrt(elem.dist)
        
        })

        return heap
        

    }

    withinSphere(target, radius, found = []){

        this._withinSphere(this, target, radius * radius, 0, found)

        found.forEach(elem => elem.dist = Math.sqrt(elem.dist))

        return found

    }

    findClosest(target){

        const closest = this._findClosest(this, target, 0)

        return {

            data: closest.d,
            dist: Math.sqrt(this.distSquared(target, closest.p))

        } 

    }

    _inCamera(point, viewMatrix){

        const v = new Vector4(point[0], point[1], point[2], 1)
        v.applyMatrix4(viewMatrix)

        v.x = (v.x / v.w + 1) / 2
        v.y = (v.y / v.w + 1) / 2
        v.z /= v.w

        if(v.x > 1 || v.x < 0 || v.y > 1 || v.y < 0 || v.z > 1)

            return null

        return v

    }

    _findKClosestInCamera(root, target, k, depth, viewMatrix, heap){

        if(root === null)

            return 

        const axis = depth % 3
        const split = target[axis] < root.p[axis]
        const next = split ? root.l : root.r
        const other = split ? root.r : root.l

        //traverse tree
        this._findKClosestInCamera(next, target, k, depth + 1, viewMatrix, heap)

        const dist = this.distSquared(target, root.p)

        if(heap.length < k){

            const vect = this._inCamera(root.p, viewMatrix)

            if(vect)

                heap.add({node: root.d, dist, vect})

        }else if(dist < heap[0].dist){

            const vect = this._inCamera(root.p, viewMatrix)

            if(vect){

                heap.popHead()
                heap.add({node: root.d, dist, vect})

            }

        }

        const distToSplit = (target[axis] - root.p[axis]) ** 2

        if(heap.length === 0)

            this._findKClosestInCamera(other, target, k, depth + 1, viewMatrix, heap)

        else if(distToSplit < heap[0].dist)

            this._findKClosestInCamera(other, target, k, depth + 1, viewMatrix, heap)

    }

    _findKClosest(root, target, k, depth, heap){

        if(root === null)

            return 

        const axis = depth % 3
        const split = target[axis] < root.p[axis]
        const next = split ? root.l : root.r
        const other = split ? root.r : root.l

        //traverse tree
        this._findKClosest(next, target, k, depth + 1, heap)

        const dist = this.distSquared(target, root.p)

        if(heap.length < k)

            heap.add({node: root.d, dist})

        else if(dist < heap[0].dist){

            heap.popHead()
            heap.add({node: root.d, dist})

        }

        const distToSplit = (target[axis] - root.p[axis]) ** 2

        if(distToSplit < heap[0].dist)

            this._findKClosest(other, target, k, depth + 1, heap)

    }
    
    _withinSphere(root, center, radSquared, depth, found){

        if (root === null)

            return
    
        const axis = depth % 3
        const split = center[axis] < root.p[axis]
        const next = split ? root.l : root.r
        const other = split ? root.r : root.l
    
        // Traverse down the tree first
        this._withinSphere(next, center, radSquared, depth + 1, found)
    
        // get the distance from the current node to the center of the sphere
        const distToCenter = this.distSquared(center, root.p);
    
        // Check if the current node is within the sphere
        if (distToCenter <= radSquared) 

            found.push({
             
                data: root.d,
                dist: distToCenter

            })
        
        // Calculate distance to the splitting plane
        const distToSplit = (center[axis] - root.p[axis]) ** 2
    
        // Only recurse into the opposite subtree if the sphere intersects the splitting plane
        if (distToSplit <= radSquared) 

            this._withinSphere(other, center, radSquared, depth + 1, found)

    }

    _findClosest(root, target, depth){

        if(root === null)

            return null

        const split = target[depth % 3] < root.p[depth % 3]
        const next = split ? root.l : root.r
        const other = split ? root.r : root.l

        //traverse tree
        let temp = this._findClosest(next, target, depth + 1)
        
        let best = this.closest(target, temp, root)

        const r2 = this.distSquared(target, best.p)

        const distToSplit = ((target[depth % 3] - root.p[depth % 3])) ** 2

        if(r2 > distToSplit){

            temp = this._findClosest(other, target, depth + 1)
            best = this.closest(target, temp, best)

        }

        return best

    }

    closest(p, n0, n1){

        if (n0 === null) 
        
            return n1

        if (n1 === null) 
        
            return n0

        return this.distSquared(n0.p, p) < this.distSquared(n1.p, p) ? n0 : n1

    }

    distSquared(p1, p2){

        return Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2) + Math.pow(p1[2] - p2[2], 2)

    }

}
