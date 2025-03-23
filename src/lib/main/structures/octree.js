
import { Vector3, Vector4, Box3, Frustum, Sphere } from "three"
import { refs } from "$lib/main/store"
import MaxHeap from "$lib/main/structures/maxHeap"

class OctreeNode {

    constructor(worldPlots, pos, size, center, radius){

        this.children = []
        this.sphere = new Sphere(center, radius)
        this.worldPlot = null
        
        if(size === 1){

            this.worldPlot = worldPlots[0]

        } else {

            const octetSize = size / 2

            for(let y = 0; y < 2; y++)
            for(let z = 0; z < 2; z++)
            for(let x = 0; x < 2; x++){
        
                const octetBounds = new Box3( 
                    new Vector3(x,y,z).multiplyScalar(octetSize).add(pos), 
                    new Vector3(x + 1, y + 1, z + 1).multiplyScalar(octetSize).add(pos) 
                )

                const octetWorldPlots = []

                for(let i = 0; i < worldPlots.length; i++){

                    if( octetBounds.containsPoint(worldPlots[i].sphere.center) ){

                        octetWorldPlots.push(worldPlots[i])
                        worldPlots.splice(i,1)
                        i--

                    }

                }
                
                if(octetWorldPlots.length){

                    const center = octetBounds.min.clone().add(octetBounds.max).divideScalar(2)

                    this.children.push( new OctreeNode(octetWorldPlots, octetBounds.min, octetSize, center, radius / 2 ))

                }

            }
        
        }

    }

}


export default class Octree extends OctreeNode{

    constructor(worldPlots){

        const copy = Array.from(worldPlots)

        super( copy, new Vector3(), 128, new Vector3(64,64,64), Math.sqrt(64 ** 2 * 3) ) 

    }

    _inView(vector){
    
        const v = new Vector4(vector.x, vector.y, vector.z, 1)
    
        v.applyMatrix4(refs.camera.viewMatrix)
        
        v.x /= v.w
        v.y /= v.w
        v.z /= v.w
    
        if(v.z >= 1 || v.x < -1 || v.x > 1 || v.y < -1 || v.y > 1)
        
            return false

        return true

    }

    getContains(point, scale = 1){

        const containers = []

        this._getContains(point, this, containers, scale)

        return containers

    }

    _getContains(point, node, containers, scale){

        for(const child of node.children)

            if(point.distanceTo(child.sphere.center) <= child.sphere.radius * scale){

                if(child.worldPlot)
                    containers.push(child.worldPlot)
                else
                    this._getContains(point, child, containers, scale)

            }

    }

    getClosestContains(target, radiusScalar){

        const closest = { plot: null, dist: Infinity }
        this._getClosestContains(target, this, closest, radiusScalar)
        return closest.plot

    }

    _getClosestContains(target, node, closest, radiusScalar){
        
        for(const child of node.children){

            const dist = target.distanceTo(child.sphere.center)

            if(dist <= child.sphere.radius * radiusScalar){

                if(child.worldPlot !== null){

                    if(dist < closest.dist){
                        closest.dist = dist
                        closest.plot = child.worldPlot
                    }

                } else

                    this._getClosestContains(target, child, closest, radiusScalar)

            }

        }
        
    }

    getKClosestWithHeuristic(k, camera, alpha){

        const frustum = new Frustum()
        frustum.setFromProjectionMatrix(camera.viewMatrix)

        const camFwd = new Vector3()
        camera.getWorldDirection(camFwd)

        const heap = new MaxHeap()

        this._getKClosestWithHeuristic(this, k, camera.position, camFwd, alpha, heap, frustum)

        if(heap.length <= 1)
            return heap.map(({node, dist}) => ({plot: node.worldPlot, dist}))

        // // compute distance without heuristic
        // for(const elem of heap)
        //     elem.dist = camera.position.distanceTo(elem.node.worldPlot.sphere.center)

        // heap.heapify()

        //sort in ascending order
        const n = heap.length
        const sorted = new Array(heap.length)
        for(let i = 0; i < n; i++){
            const elem = heap.popHead()
            sorted[i] = {
                plot: elem.node.worldPlot,
                dist: elem.dist
            }
        }

        return sorted

    }


    _getKClosestWithHeuristic(node, k, camPos, camFwd, alpha, heap, frustum){

        const next = []
        
        // filter out-of-bound nodes, calculate heuristic
        for(const child of node.children){

            const { sphere } = child

            // continue if outside of frustum
            if(!frustum.intersectsSphere(sphere))
                continue

            // continue if outside of max dist bounds or if distance to node is greater than the max distance of the items found so far.
            
            const camToCenter = sphere.center.clone().sub(camPos)
            const camDistToSurface = camToCenter.length() - sphere.radius
            const proj = camToCenter.clone().projectOnVector(camFwd)
            const projToCenter = camToCenter.sub(proj)
            const projDistToSurface = projToCenter.length() - sphere.radius
            const heuristic = camDistToSurface + projDistToSurface * alpha

            next.push({ child, dist: heuristic })

        }

        // sort by heuristic
        next.sort((a, b) => a.dist - b.dist)

        // recursive step to minimize heuristic
        for(const { child, dist } of next){

            if(heap.length === k && dist > heap[0].dist)
                continue

            if(child.worldPlot === null)
                this._getKClosestWithHeuristic(child, k, camPos, camFwd, alpha, heap, frustum)

            else {

                const heapElem = { node: child, dist }
                if(heap.length < k)
                    heap.add(heapElem)
                else
                    heap.addAndPopHead(heapElem)

            }

        }

    }

    getKClosest(point, k, heap = new MaxHeap()){

        this._getKClosest(point, k, this, heap)

    }

    _getKClosest(point, k, node, heap){

        const next = []

        for(const child of node.children){


            let dist = child.sphere.center.distanceTo(point)

            if(!child.worldPlot)

                dist -= child.sphere.radius

            next.push({child, dist})

        }

        next.sort((a, b) => a.dist - b.dist)

        for(const node of next){

            const { child, dist } = node

            if(heap.length < k || dist < heap[0].dist){

                if(child.worldPlot){

                    heap.add({data: child.worldPlot, dist})

                    if(heap.length > k)

                        heap.popHead()

                } else

                    this._getKClosest(point, k, child, heap)

            }

        }

    }

    withinRadius(center, radius){

        const found = []

        this._withinRadius(center, radius, this, found)

        return found

    }

    _withinRadius(center, radius, node, found){

        for(const child of node.children){

            const dist = child.sphere.center.distanceTo(center)

            if(child.worldPlot){

                if(dist <= radius && this._inView(child.sphere.center))

                    found.push(child.worldPlot)

            } else {

                if(dist - child.sphere.radius <= radius)

                    this._withinRadius(center, radius, child, found)

            }

        }

    }

    kClosestToPointAndLine(origin, dir, k){

        const frustum = new Frustum()
        const heap = new MaxHeap()

        frustum.setFromProjectionMatrix(refs.camera.viewMatrix)

        this._kClosestToPointAndLine(origin, dir, k, this, heap, frustum)

        return heap

    }

    _kClosestToPointAndLine(origin, dir, k, node, heap, frustum){

        const next = []

        for(const child of node.children){
            
            let dist

            if(child.worldPlot){

                if(!this._inView(child.worldPlot.sphere.center))

                    continue
                
                const originToNode = child.worldPlot.sphere.center.clone().sub(origin)

                dist = originToNode.length()
                dist += originToNode.cross(dir).length() 

            } else {

                if(!frustum.intersectsSphere(child.sphere))

                    continue
    
                const originToNode = child.sphere.center.clone().sub(origin)
    
                //take into account distance from line to bounding sphere 
                dist = (originToNode.length() - child.sphere.radius) 
    
                //take into account distance from camera to bounding spere
                dist += (originToNode.cross(dir).length() - child.sphere.radius) 

            }

            next.push( { child, dist } )

        }

        next.sort((a, b) => a.dist - b.dist)

        for(const node of next){

            const { child, dist } = node

            if( heap.length < k || dist < heap[0].dist ){

                if(child.worldPlot){

                    heap.add(node)

                    if(heap.length > k)

                        heap.popHead()

                }else

                    this._kClosestToPointAndLine(origin, dir, k, child, heap, frustum)

            }

        }

    }

}