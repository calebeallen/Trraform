
import { Frustum, Sphere, Vector3, Vector4 } from "three";
import PlotData from "./plotData";
import Task from "../task/task";
import { CHUNK_SIZE, MAX_DEPTH } from "../../common/constants";
import { I2P } from "../../common/utils";
import MaxHeap from "../structures/maxHeap";
import Chunk from "./chunk";

export default class Plot extends PlotData {

    constructor(plotId, pos, parent, chunk){

        super(plotId)
        
        this.pos = pos
        this.parent = parent
        this.children = []
        this.chunk = chunk // reference shared between all plots that belong to this chunk
        this.verified = false
        this.owner = null

        const c = pos.clone().addScalar(parent.blockSize / 2)
        this.sphere = new Sphere(c, Math.sqrt((parent.blockSize / 2 ) ** 2 * 3)) //does not change, is the absolute bounds of the plot
        this.boundingSphere = this.sphere.clone() //bounds of mesh + plots (not set until plot is loaded)
        
        this.tagPosition = new Vector4(c.x, c.y, c.z, 1)
        this.buildSize = 16
        this.blockSize = this.parent.blockSize / this.buildSize

        this.geometryData = null

    }

    async safeClear(){

        // wait for load before clearing
        if(this._loading !== null)

            await this._loading

        this.clear()

    }

    clear(){

        super.clear()

        for(const child of this.children)

            child.clear()

        this.children = []
        this.boundingSphere.copy(this.sphere)

        this.buildSize = 16
        this.blockSize = this.parent.blockSize / this.buildSize

        this.geometryData = null

    }

    load(){

        if(this._loading === null)

            this._loading = new Promise(async resolve => {

                const localId = this.id.getLocal()
                const plotDataU8 = await this.chunk.getPlotData(localId)

                if(plotDataU8 === null){
                    resolve(this)
                    return
                }

                const task = new Task("process_plot_data", { 
                    plotDataU8,
                    placeSubplots: this.id.depth() < MAX_DEPTH
                })
                const data = await task.run()

                this.owner = data.owner
                this.name = data.name
                this.desc = data.desc
                this.link = data.link
                this.linkTitle = data.linkTitle
                this.verified = this.verified
                this.buildSize = data.buildSize
                this.blockSize = this.parent.blockSize / data.buildSize

                if (data.geometryData !== null) {
                    
                    this.geometryData = data.geometryData
                    
                    //calculate bounding sphere (this is not the same as the geometry bounding sphere. It is scaled and includes plot positions)
                    const min = new Vector3(...data.geometryData.min)
                    const max = new Vector3(...data.geometryData.max)
                    const center = min.clone().add(max).multiplyScalar( this.blockSize / 2 ).add(this.pos)
                    const radius = max.sub(min).length() * this.blockSize / 2

                    //calculate tag position
                    this.tagPosition.x = center.x
                    this.tagPosition.z = center.z
                    this.tagPosition.y = max.y * this.blockSize * 1.1 + this.pos.y

                    this.boundingSphere.set(center, radius)
                
                }
                
                // child plots
                if (this.id.depth() < MAX_DEPTH) {

                    const chunkCount = Math.floor(plotIndicies.length / CHUNK_SIZE)
                    const chunks = new Array(chunkCount)
            
                    // create chunks, give chunks a reference to parent chunk
                    for(let i = 0; i < chunkCount; i++){
            
                        const chunkId = `${this.id.string(false)}_${i}` //id is <parent plot id>_<local chunk number> allows for easy chunk restructuring if needed.
                        chunks[i] = new Chunk(chunkId, this.chunk) 
            
                    }
            
                    //create child plots
                    for(let i = 0; i < plotIndicies.length; i++){
            
                        const childPlotId = this.id.mergeChild(i + 1)
                        const childPos = new Vector3(...I2P(plotIndicies[i], this.buildSize))
                        childPos.multiplyScalar(this.blockSize).add(this.pos)
            
                        // pass shared reference of a chunk to its plots
                        const chunk = chunks[Math.floor(i / CHUNK_SIZE)]
                        const plot = new Plot(childPlotId, childPos, this, chunk)
            
                        chunk.plots.push(plot)
                        this.children.push(plot)
            
                    }

                    for(const chunk of chunks)
                        chunk.computeBoundingSphere()

                }

                resolve(this)
                
            })

        return this._loading

    }

    getClosestContains(target, radiusScalar = 1){

        let minDist = Infinity
        let closest = null

        for(const child of this.children){

            const dist = child.sphere.center.distanceTo(target)
            if(dist <= child.sphere.radius * radiusScalar && dist < minDist){
                minDist = dist
                closest = child
            }

        }

        return closest

    }

    getKClosest(k, target){

        const heap = new MaxHeap()

        for(const child of this.children){

            const { center } = child.boundingSphere
            const dist = center.distanceTo(target)

            if(heap.length < k)
                heap.add({plot: child, dist})
            else if(dist < heap[0].dist)
                heap.addAndPopHead({plot: child, dist})

        }

        const n = heap.length
        const sorted = new Array(n)
        for(let i = sorted.length - 1; i >= 0; i--)
            sorted[i] = heap.popHead()
        
        return sorted

    }

    getKClosestWithHeuristic(k, camera, alpha){

        const { position, viewMatrix } = camera
        const heap = new MaxHeap()

        const frustum = new Frustum()
        frustum.setFromProjectionMatrix(viewMatrix)

        const camFwd = new Vector3()
        camera.getWorldDirection(camFwd)

        for(const child of this.children){

            if(!frustum.intersectsSphere(child.sphere))
                continue

            const { center, radius } = child.sphere
            const dist = center.distanceTo(position)
            const camToCenter = center.clone().sub(position)
            const camDistToSurface = camToCenter.length() - radius
            const proj = camToCenter.clone().projectOnVector(camFwd)
            const projToCenter = camToCenter.sub(proj)
            const projDistToSurface = projToCenter.length() - radius
            const heuristic = camDistToSurface + projDistToSurface * alpha

            if(heap.length < k)
                heap.add({plot: child, dist: heuristic})
            else if(dist < heap[0].dist)
                heap.addAndPopHead({plot: child, dist: heuristic})

        }

        const n = heap.length
        const sorted = new Array(n)
        for(let i = 0; i < n; i++)
            sorted[i] = heap.popHead()
        
        return sorted

    }

}
