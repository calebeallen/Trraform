
import { Frustum, Sphere, Vector3, Vector4 } from "three";
import PlotData from "./plotData";
import Task from "../task/task";
import { refs } from "../store";
import { MAX_DEPTH, PLOT_COUNT } from "../../common/constants";
import { I2P, P2I } from "../../common/utils";
import MaxHeap from "../structures/maxHeap";

export default class Plot extends PlotData {

    static defaultChildPlots(buildSize){

        //place unplaced plots
        const pos = new Vector3()
        const plotIndicies = new Array(PLOT_COUNT)
        const chunkArr = new Array(PLOT_COUNT)
        const X0 = 1/12, Z0 = 3/12, S = 1/6

        //start with default positions
        for(let z = 0; z < 4; z++)
        for(let x = 0; x < 6; x++){

            const chunk = Math.floor( z / 2 ) * 2 + Math.floor(x / 3) //chunk size 6

            pos.set(X0 + x * S, 0, Z0 + z * S)
            pos.multiplyScalar(buildSize).floor()

            const plotId = z * 6 + x
            const ind = P2I(pos, buildSize)

            plotIndicies[plotId] = ind
            chunkArr[plotId] = chunk

        }

        return [plotIndicies, chunkArr]

    }

    constructor(plotId, pos, parent, chunk){

        super(plotId)
        
        this.pos = pos
        this.parent = parent
        this.children = []
        this.chunk = chunk //object shared between all plots that belong to this chunk
        this.minted = false

        this.sphere = new Sphere(pos.clone().addScalar( parent.blockSize / 2), Math.sqrt((parent.blockSize / 2 ) ** 2 * 3)) //does not change, is the absolute bounds of the plot
        this.boundingSphere = this.sphere.clone() //bounds of mesh + plots (not set until plot is loaded)
        
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

                const task = new Task("get-plot-data", {
                    id: this.id.id,
                    depth: this.id.depth()
                })
                const data = await task.run()

                if(data === null){

                    resolve(this)
                    return

                }

                this.name = data.name
                this.desc = data.desc
                this.link = data.link
                this.linkLabel = data.linkLabel
                this.buildSize = data.buildSize
                this.blockSize = this.parent.blockSize / data.buildSize
                this.minted = true

                if (data.geometryData !== null) {
                    
                    this.geometryData = data.geometryData
                    
                    //calculate bounding sphere (this is not the same as the geometry bounding sphere. It is scaled and includes plot positions)
                    const min = new Vector3(...data.geometryData.min)
                    const max = new Vector3(...data.geometryData.max)
                    const center = min.clone().add(max).multiplyScalar( this.blockSize / 2 ).add(this.pos)
                    const radius = max.sub(min).length() * this.blockSize / 2
                    this.boundingSphere.set(center, radius)
                
                }
                
                //child plots
                if (this.id.depth() < MAX_DEPTH)

                    this.createChildPlots( data.plotIndicies, data.chunkArr )

                resolve(this)
                
            })

        return this._loading

    }

    createChildPlots(plotIndicies, chunkArr){

        //create shared chunk reference, give parent chunk a reference to child
        let maxChunkId = chunkArr[0]
        for(let i = 1; i < chunkArr.length; i++)

            if(chunkArr[i] > maxChunkId)
                maxChunkId = chunkArr[i]

        const chunkCount = maxChunkId + 1
        const chunks = new Array(chunkCount)

        // create chunks, give parent a reference to child chunks
        for(let i = 0; i < chunkCount; i++)

            chunks[i] = { 
                parent: this.chunk,
                children: new Set(),
                plots: [],
                lod: null,
                center: new Vector3(),
                buildCount: 0
            }

        //create child plots
        for(let i = 0; i < plotIndicies.length; i++){

            const childPlotId = this.id.mergeChild(i + 1)
            const childPos = new Vector3(...I2P(plotIndicies[i], this.buildSize))
            childPos.multiplyScalar(this.blockSize).add(this.pos)

            const chunk = chunks[chunkArr[i]]
            const plot = new Plot(childPlotId, childPos, this, chunk)

            chunk.plots.push(plot)
            this.children.push(plot)

        }

    }

    _inView(vector){
    
        const v = new Vector4(vector.x, vector.y, vector.z, 1)
        v.applyMatrix4(refs.camera.viewMatrix)
        v.x /= v.w
        v.y /= v.w
        v.z /= v.w
        
        return !(v.z >= 1 || v.x < -1 || v.x > 1 || v.y < -1 || v.y > 1)

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

    getKClosest(k, camera){

        const { position, viewMatrix } = camera
        const heap = new MaxHeap()

        const frustum = new Frustum()
        frustum.setFromProjectionMatrix(viewMatrix)

        for(const child of this.children){

            if(!frustum.intersectsSphere(child.sphere))
                continue

            const dist = child.sphere.center.distanceTo(position)

            if(heap.length < k)
                heap.add({plot: child, dist})
            else if(dist < heap[0].dist)
                heap.addAndPopHead({plot: child, dist})

        }

        const n = heap.length
        const sorted = new Array(n)
        for(let i = 0; i < n; i++)
            sorted[i] = heap.popHead()
        
        return sorted

    }

    withinView(){

        const found = []

        for(const child of this.children)

            if(this._inView(child.sphere.center))

                found.push(child)

        return found
        
    }

    withinRadius(center, radius){

        const found = []

        for(const child of this.children)

            if(center.distanceTo(child.sphere.center) < radius * this.blockSize && this._inView(child.sphere.center))

                found.push(child)

        return found

    }

}
