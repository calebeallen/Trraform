
import { Sphere, Vector3 } from "three";
import PlotId from "$lib/common/plotId";
import { expand, I2P, } from "$lib/common/utils";
import Queue from "$lib/main/structures/queue";
import Plot from "$lib/main/plot/plot";
import Octree from "$lib/main/structures/octree";
import Task from "$lib/main/task/task";
import { CHUNK_SIZE } from "$lib/common/constants";
import Chunk from "./chunk";

export default class RootPlot {

    constructor(){

        this.id = new PlotId(0)
        this.pos = new Vector3()
        this.blockSize = 1
        this.children = []
        this.geometryData = {}
        this._loading = null
        this.isRoot = true

    }

    load(){

        if(this._loading === null)

            this._loading = ( async () => {

                //get build data
                const buildDatRes = await fetch("/0x00.dat")
                const buildDataBuf = await buildDatRes.arrayBuffer()
                const buildData = new Uint16Array(buildDataBuf)
                const bs = buildData[1]
                const expanded = expand(buildData)

                //get chunk data
                const chunkMapRes = await fetch("/chunk_map.dat")
                const chunkMapBuf = await chunkMapRes.arrayBuffer()
                const chunkMap = new Uint32Array(chunkMapBuf)
                const chunkCount = chunkMap[chunkMap.length - 2] + 1
                const plotIdxs = []
                const idxToChunk = []

                for(let i = 0; i < chunkMap.length; i+=2){

                    const chunkId = chunkMap[i]
                    const plotIdx = chunkMap[i + 1]

                    idxToChunk.push(chunkId)
                    plotIdxs.push(plotIdx)

                }
                const chunks = new Array(chunkCount)
                for(let i = 0; i < chunkCount; i++){

                    const chunkId = `0_${i.toString(16).toLowerCase()}`
                    chunks[i] = new Chunk(chunkId, null)
        
                }

                // create child plots
                for(let i = 0; i < plotIdxs.length; i++){

                    const childPlotId = this.id.mergeChild(i + 1)
                    const childPos = new Vector3(...I2P(plotIdxs[i], bs))
                    childPos.y++
                    childPos.multiplyScalar(this.blockSize).add(this.pos)
                    
                    const chunk = chunks[idxToChunk[i]]
                    const plot = new Plot(childPlotId, childPos, this, chunk)

                    chunk.plots.push(plot)
                    this.children.push(plot)

                }

                for(const chunk of chunks)
                    chunk.computeBoundingSphere()

                //get geomdata
                const task = new Task("reduce_poly", { expanded, buildSize : bs })
                const geomData = this.geometryData.stdRes = await task.run()

                this.octree = new Octree(this.children, bs)
                this.buildSize = bs
                this.sphere = new Sphere( new Vector3(0.5,0.5,0.5).multiplyScalar(this.buildSize * this.blockSize), Math.sqrt(3 * ( this.buildSize * this.blockSize / 2 ) ** 2) )
                this.boundingSphere = new Sphere(new Vector3(...geomData.center), Math.hypot(...geomData.dp))
                
            })()

        return this._loading

    }

    findPlotById(plotId){

        const ids = plotId.split()

        let next = this

        for(const id of ids){

            if(id > next.children.length)

                return null

            next = next.children[id - 1]

        }

        return next

    }

    isPlotCreated(plotId){

        return this.findPlotById(plotId) !== null

    }

    getClosestContains(target, radiusScalar = 1){

        return this.octree.getClosestContains(target, radiusScalar)

    }

    getKClosest(k, target){

        return this.octree.getKClosest(k, target)

    }

    getKClosestWithHeuristic(k, camera, alpha){

        return this.octree.getKClosestWithHeuristic(k, camera, alpha)

    }

}





