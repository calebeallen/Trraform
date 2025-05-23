import { BufferAttribute, BufferGeometry, LOD, Mesh, MeshBasicMaterial, Sphere, Vector3 } from "three"
import { refs, settings } from "./store"
import MaxHeap from "./structures/maxHeap"
import Task from "./task/task"


const CLEAN_UP_AMT = 10
const THROTTLE = 30
const DT_LOAD = 0.5 
const DT_REFRESH = 0.5

const material = new MeshBasicMaterial({vertexColors: true})

export default class RenderManager {

    constructor(){

        this.renderedChunks = new Set()
        this.renderedBuildsCount = 0
        this.totalTimeElapsed = 0
        this.lastLoadTimeStamp = 0
        this.lastRefreshTimeStamp = 0
        this.throttle = THROTTLE
        this.processing = 0

    }

    setLodDistances(ratio){

        for(const { lod } of this.renderedChunks){
            
            if(lod)
            for(const level of lod.levels)
                level.distance *= ratio

        }

    }

    update(dt){

        this.totalTimeElapsed += dt

        if(this.totalTimeElapsed - this.lastLoadTimeStamp >= DT_LOAD){

            this.throttle = THROTTLE
            this.lastLoadTimeStamp = this.totalTimeElapsed

        }

        if(this.totalTimeElapsed - this.lastRefreshTimeStamp >= DT_REFRESH){

            for(const { lod } of this.renderedChunks){

                if(lod !== null)

                    lod.update(refs.camera)

            }

            this.lastRefreshTimeStamp = this.totalTimeElapsed

        }

    }

    hasAvailability(){

        return this.throttle > 0 && this.processing < Task.threadPool.length

    }

    _createMesh(position, color, index, pos, radius, scale){
    
        const geometry = new BufferGeometry()
        geometry.setAttribute("position", new BufferAttribute(position, 3))
        geometry.setAttribute("color", new BufferAttribute(color, 3))
        geometry.setIndex(new BufferAttribute(index, 1))
        geometry.attributes.color.normalized = true
        geometry.attributes.position.onUpload(() => geometry.attributes.position.array = null)
        geometry.attributes.color.onUpload(() => geometry.attributes.color.array = null)
        geometry.index.onUpload(() => geometry.index.array = null)
        geometry.boundingSphere = new Sphere(new Vector3(), radius)

        const mesh = new Mesh(geometry, material)
        mesh.position.copy(pos)
        mesh.scale.set(scale,scale,scale)
        mesh.updateMatrix()
        mesh.matrixWorld.copy(mesh.matrix)
        mesh.matrixAutoUpdate = mesh.matrixWorldAutoUpdate = false

        return mesh

    }
    
    async renderStatic(plot){ //for root plot/anything that doesn't need to be mangaged

        await plot.load()
        const mesh = this._createMesh(
            plot.geometryData.stdRes.position, 
            plot.geometryData.stdRes.color, 
            plot.geometryData.stdRes.index,
            new Vector3(...plot.geometryData.stdRes.center),
            Math.hypot(...plot.geometryData.stdRes.dp),
            plot.blockSize
        )
        refs.scene.add(mesh)
        plot.geometryData = null

    }

    async refresh(plot){

        const chunk = plot.chunk
        await this.unrenderChunk(chunk)
        await this.render(plot)

    }

    async managedRender(plot, camera, leaveRendered){

        const {chunk} = plot
        if(this.throttle <= 0 || this.processing >= Task.threadPool.length || this.renderedChunks.has(chunk))
            return

        this.processing += chunk.plots.length
        this.throttle -= chunk.plots.length
        await this.render(plot)

        if(this.renderedBuildsCount > settings.renderLimit)
            await this.cleanUp(camera, leaveRendered)

        this.processing -= chunk.plots.length

    }

    async render({ chunk, parent }){

        if(this.renderedChunks.has(chunk))
            return

        this.renderedChunks.add(chunk)

        // load all plots
        const loadPlots = chunk.plots.map(plot => plot.load())
        const plots = await Promise.all(loadPlots)
        let buildCount = 0

        for(const plot of plots)
            if(plot.geometryData !== null)
                buildCount++

        this.renderedBuildsCount += buildCount
        chunk.buildCount = buildCount

        if(buildCount > 0){

            // merge geometries
            const merged = {}

            for(const res of ["stdRes", "lowRes"]){

                const packaged = { position : [], color : [], index: [], min : [], max : [], scale : [] }

                // package data to be merged
                for(let i = 0; i < chunk.plots.length; i++){

                    if(chunk.plots[i].geometryData == null)

                        continue

                    const geomData = chunk.plots[i].geometryData[res]

                    packaged.position.push(geomData.position)
                    packaged.color.push(geomData.color)
                    packaged.index.push(geomData.index)

                    //compute bounds relative to world
                    const scale = chunk.plots[i].blockSize
                    const center = new Vector3(...geomData.center)
                    const centerDiff = new Vector3(...geomData.dp)
                    const min = center.clone().sub(centerDiff)
                    const max = center.clone().add(centerDiff)

                    min.multiplyScalar(scale).add(chunk.plots[i].pos)
                    max.multiplyScalar(scale).add(chunk.plots[i].pos)

                    packaged.min.push(min.toArray())
                    packaged.max.push(max.toArray())
                    packaged.scale.push(scale)

                }

                //merge
                const mergeTask = new Task( "merge_geometries", { geometryData : packaged } )
                merged[res] = await mergeTask.run()
                
            }

            const stdMD = merged.stdRes
            const stdRes = this._createMesh(
                stdMD.position,
                stdMD.color,
                stdMD.index,
                new Vector3(...stdMD.center),
                Math.hypot(...stdMD.dp),
                stdMD.scale
            )
            const lowMD = merged.lowRes
            const lowRes = this._createMesh(
                lowMD.position,
                lowMD.color,
                lowMD.index,
                new Vector3(...lowMD.center),
                Math.hypot(...lowMD.dp),
                lowMD.scale
            )

            const lod = new LOD()
            lod.autoUpdate = lod.matrixAutoUpdate = lod.matrixWorldAutoUpdate = false
            lod.addLevel(stdRes, 0)
            lod.addLevel(lowRes, settings.lowLODDist * parent.blockSize, 0.01)
            lod.position.copy(stdRes.position)
            lod.updateMatrix()
            lod.matrixWorld.copy(lod.matrix)
            lod.update(refs.camera)
            refs.scene.add(lod)
            
            chunk.boundingSphere.center.copy(stdRes.position)
            chunk.boundingSphere.radius = Math.hypot(...stdMD.dp)
            chunk.lod = lod      
            
        }

        // add chunk to parent's children list
        if(chunk.parent !== null)
            chunk.parent.children.add(chunk)

        chunk.plotData = chunk._loading = null

    }

    async cleanUp(camera, leaveRendered) {

        //remove furthest chunks
        const heap = new MaxHeap()
        
        o: for(const chunk of this.renderedChunks){

            if(chunk.buildCount == 0)
                continue

            // // could happen if parent plot gets called for unrender. 
            // // In this case it would cause the child plots to be cleared even if they are in leaveRendered
            if(chunk.boundingSphere.containsPoint(camera.position))
                continue

            // prevent unrender then rerender cycle
            for(const plot of chunk.plots)
                if(leaveRendered.has(plot.id.id))
                    continue o
                
            heap.push({
                chunk,
                dist: refs.camera.position.distanceTo(chunk.boundingSphere.center) + chunk.boundingSphere.radius
            })

        }

        heap.heapify()

        while(this.renderedBuildsCount > settings.renderLimit - CLEAN_UP_AMT && heap.length > 0)
            await this.unrenderChunk(heap.popHead().chunk)

    }

    async unrenderChunk(chunk){

        if(chunk == null || !this.renderedChunks.has(chunk)) 
            return

        // recursively unrender child chunks
        for(const child of chunk.children)
            this.unrenderChunk(child)

        // reset all plots in chunk
        for(const plot of chunk.plots)
            await plot.safeClear()

        // remove chunk from parent 
        if(chunk.parent !== null)
            chunk.parent.children.delete(chunk)

        // remove from renderedChunks set
        this.renderedChunks.delete(chunk)

        // remove from scene
        if(chunk.lod !== null)
            refs.scene.remove(chunk.lod)

        // deduct from rendered builds count
        this.renderedBuildsCount -= chunk.buildCount

        //reset chunk to be rendered again
        chunk.reset()

    }

}