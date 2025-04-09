import { Sphere, Vector3 } from "three"
import Task from "../task/task"


export default class Chunk{

    constructor(chunkId, parent){

        this.chunkId = chunkId
        this.parent = parent
        this.plots = []

        this.reset()

    }

    reset(){

        this.children = new Set()
        this.lod = null
        this.boundingSphere = new Sphere()
        this.buildCount = 0
        this._loading = null
        this.plotData = null

    }

    load(){

        if(this._loading === null)

            this._loading = new Promise(async res => {

                const task = new Task("get_chunk", { chunkId: this.chunkId })
                this.plotData = await task.run()

                console.log(this.plotData)
                res(this)

            })
        
        return this._loading

    }

    async getPlotData(plotId){

        await this.load()
        const idStr = plotId.string()
        return this.plotData[idStr] ?? null

    }
    
    computeBoundingSphere(){

        const min = new Vector3(Infinity, Infinity, Infinity)
        const max = new Vector3(-Infinity, -Infinity, -Infinity)

        for(const { sphere } of this.plots){

            const { center } = sphere
            min.min(center)
            max.max(center)

        }

        this.boundingSphere.radius = min.distanceTo(max) / 2
        max.add(min).divideScalar(2)
        this.boundingSphere.center.copy(max)
    
    }

}
