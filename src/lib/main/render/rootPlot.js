
import { Sphere, Vector3 } from "three";
import PlotId from "$lib/common/plotId";
import { expand, I2P, } from "$lib/common/utils";
import Plot from "./plot";
import Octree from "$lib/main/structures/octree";
import Task from "$lib/main/task/task";
import { root } from "./engine";

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
                const idToIdx = root.idToIdx
                const plotIndices = []

                for(const l of idToIdx)
                    plotIndices.push(...l)
                
                // create child plots
                for(let i = 0; i < plotIndices.length; i++){

                    const childPlotId = this.id.mergeChild(i + 1)
                    const childPos = new Vector3(...I2P(plotIndices[i], bs))
                    childPos.y++
                    childPos.multiplyScalar(this.blockSize).add(this.pos)
                    
                    const plot = new Plot(childPlotId, childPos, this, null)

                    this.children.push(plot)

                }

                //get geom data
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





