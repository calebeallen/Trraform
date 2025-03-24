
import { Vector3, Vector4, Box3, Frustum, Sphere } from "three"
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

    getKClosest(k, target){

        const heap = new MaxHeap()
        this._getKClosest(this, k, target, heap)

        const sorted = new Array(heap.length)
        for(let i = sorted.length - 1; i >= 0; i--){
            const { child } = heap.popHead()
            const plot = child.worldPlot
            const dist = plot.boundingSphere.center.distanceTo(target)
            sorted[i] = { plot, dist }
        }
        
        return sorted

    }

    _getKClosest(node, k, target, heap){

        const sortedChildren = []
        for(const child of node.children){
            const { center, radius } = child.sphere
            const distToSurface = target.distanceTo(center) - radius
            sortedChildren.push({ child, dist: distToSurface })
        }

        sortedChildren.sort((a, b) => a.dist - b.dist)

        for(const elem of sortedChildren){

            const { child, dist } = elem
            if(heap.length === k && dist > heap[0].dist)
                break
            
            if(child.worldPlot === null)
                this._getKClosest(child, k, target, heap)
            
            else {

                if(heap.length < k)
                    heap.add(elem)
                else
                    heap.addAndPopHead(elem)

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
            return heap.map(({child, dist}) => ({plot: child.worldPlot, dist}))

        //sort in ascending order
        const n = heap.length
        const sorted = new Array(heap.length)
        for(let i = 0; i < n; i++){
            const { child, dist } = heap.popHead()
            sorted[i] = { plot: child.worldPlot, dist }
        }

        return sorted

    }


    _getKClosestWithHeuristic(node, k, camPos, camFwd, alpha, heap, frustum){

        const sortedChildren = []
        
        // filter out-of-bound nodes, calculate heuristic
        for(const child of node.children){

            const { sphere } = child

            // continue if outside of frustum
            if(!frustum.intersectsSphere(sphere))
                continue

            const camToCenter = sphere.center.clone().sub(camPos)
            const camDistToSurface = camToCenter.length() - sphere.radius
            const proj = camToCenter.clone().projectOnVector(camFwd)
            const projToCenter = camToCenter.sub(proj)
            const projDistToSurface = projToCenter.length() - sphere.radius
            const heuristic = camDistToSurface + projDistToSurface * alpha

            sortedChildren.push({ child, dist: heuristic })

        }

        // sort by heuristic
        sortedChildren.sort((a, b) => a.dist - b.dist)

        // recursive step to minimize heuristic
        for(const elem of sortedChildren){

            const { child, dist } = elem
            if(heap.length === k && dist > heap[0].dist)
                break

            if(child.worldPlot === null)
                this._getKClosestWithHeuristic(child, k, camPos, camFwd, alpha, heap, frustum)

            else {

                if(heap.length < k)
                    heap.add(elem)
                else
                    heap.addAndPopHead(elem)

            }

        }

    }

}