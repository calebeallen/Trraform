import { BufferAttribute, BufferGeometry, LOD, Mesh, MeshBasicMaterial, Sphere, Vector3 } from "three"
import { refs, settings } from "./store"
import MaxHeap from "./structures/maxHeap"
import Task from "./task/task"


const CLEAN_UP_AMT = 5

const DT_LOAD = 0.5 
const dt_REFRESH = 0.5

const material = new MeshBasicMaterial({vertexColors: true})

export default class RenderManager {

    constructor(){

        this.rendered = new Set()
        this.totalTimeElapsed = 0
        this.lastLoadTimeStamp = 0
        this.lastRefreshTimeStamp = 0
        this.throttle = Task.threadPool.length

    }

    setLodDistances(ratio){

        for(const { lod } of this.rendered)
            for(const level of lod.levels)
                level.distance *= ratio

    }

    update(dt){

        this.totalTimeElapsed += dt

        if(this.totalTimeElapsed - this.lastLoadTimeStamp >= DT_LOAD){

            this.throttle = Task.threadPool.length
            this.lastLoadTimeStamp = this.totalTimeElapsed

        }

        if(this.totalTimeElapsed - this.lastRefreshTimeStamp >= dt_REFRESH){

            for(const { lod } of this.rendered){

                if(lod !== null)

                    lod.update(refs.camera)

            }

            this.lastRefreshTimeStamp = this.totalTimeElapsed

        }

    }

    hasAvailability(){

        return this.throttle > 0

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

    async render({ chunk, parent }){

        if(this.throttle <= 0 || this.rendered.has(chunk))

            return

        this.rendered.add(chunk)
        this.throttle -= chunk.plots.length

        // load all plots
        const loadPlots = chunk.plots.map(plot => plot.load())
        await Promise.all(loadPlots)

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
            const mergeTask = new Task( "merge-geometries", { geometryData : packaged } )
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
        
        chunk.center.copy(stdRes.position)
        chunk.lod = lod        

        // add chunk to parent list
        if(chunk.parent !== null)
            chunk.parent.children.add(chunk)

        if(this.rendered.size > settings.renderLimit)
            await this.cleanUp()

    }

    async cleanUp() {

        //remove furthest chunks
        const heap = MaxHeap()
        
        for(const chunk of this.rendered)

            heap.push({
                chunk,
                dist: refs.camera.distanceToSquared(chunk.center)
            })

        heap.heapify()

        for(let i = 0; i < CLEAN_UP_AMT; i++)

            await this.unrenderChunk(heap.popHead())

    }

    async unrenderChunk(chunk){

        if(chunk == null || !this.rendered.has(chunk)) 
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

        // remove from rendered set
        this.rendered.delete(chunk)

        // remove from scene
        refs.scene.remove(chunk.lod)

    }

}