
import { Sphere, Vector3, Vector4 } from "three";
import PlotData from "./plotData";
import Task from "../task/task";
import { refs } from "../store";
import { MAX_DEPTH, PLOT_COUNT } from "../../common/constants";
import { I2P, P2I } from "../../common/utils";

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
        this.hasGeometry = false

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
        this.hasGeometry = false

    }

    load(){

        if(this._loading === null)

            this._loading = ( async () => {

                try {

                    const task = new Task("generate-plot", {
                        id: this.id.id,
                        depth: this.id.depth()
                    })
                    const data = await task.run()

                    if(data.err) 
                        
                        throw new Error("Error generating plot")

                    this.name = data.name
                    this.desc = data.desc
                    this.link = data.link
                    this.linkLabel = data.linkLabel
                    this.minted = true

                    let plotIndicies, chunkArr

                    if (data.geometryData !== null) {
                        
                        this.buildSize = data.buildSize
                        this.geometryData = data.geometryData
                        this.hasGeometry = true
                        this.blockSize = this.parent.blockSize / data.buildSize
                        
                        //calculate bounding sphere (this is not the same as the geometry bounding sphere. It is scaled and includes plot positions)
                        const min = new Vector3(...data.geometryData.min)
                        const max = new Vector3(...data.geometryData.max)
                        const center = min.clone().add(max).multiplyScalar( this.blockSize / 2 ).add(this.pos)
                        const radius = max.sub(min).length() * this.blockSize / 2
                        this.boundingSphere.set(center, radius)

                        //set child data
                        plotIndicies = data.plotIndicies
                        chunkArr = data.chunkArr
                    
                    } else
                        
                        //set default child data
                        [plotIndicies, chunkArr] = Plot.defaultChildPlots(this.buildSize)

                    //child plots
                    if (this.id.depth() < MAX_DEPTH)

                        this.createChildPlots( plotIndicies, chunkArr )

                } catch {}

                return this
                
            })()

        return this._loading

    }

    createChildPlots(plotIndicies, chunkArr){

        const chunkSizes = {}

        for(let i = 0; i < chunkArr.length; i++){

            if(!chunkSizes[chunkArr[i]]) 
                chunkSizes[chunkArr[i]] = 1
            else 
                chunkSizes[chunkArr[i]]++

        }

        //create chunk objects to pass to children (they are shared for memory efficiency)
        const chunks = []
        for(const [i, size] of Object.entries(chunkSizes))

            chunks[i] = { id: ((BigInt(this.id.id) << 16n) | BigInt(parseInt(i) + 1)).toString(16), size }

        //create child plots
        for(let i = 0; i < plotIndicies.length; i++){

            const childPlotId = this.id.mergeChild(i + 1)
            const childPos = new Vector3(...I2P(plotIndicies[i], this.buildSize))
            childPos.multiplyScalar(this.blockSize).add(this.pos)
            this.children.push( new Plot(childPlotId, childPos, this, chunks[chunkArr[i]]) )

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

    getContains(point){

        const found = []

        for(const child of this.children)

            if(child.sphere.containsPoint(point))

                found.push(child)

        return found

    }

    getKClosest(point, k, heap){

        for(const child of this.children){

            const dist = child.sphere.center.distanceTo(point)

            if (heap.length < k || dist < heap[0].dist) {
                
                heap.add({child, dist})

                if(heap.length > k)

                    heap.popHead()

            }

        }
        
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
