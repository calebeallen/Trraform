
import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial, ShaderMaterial, Sphere, Vector3, LOD, Box3 } from "three"
import Task from "$lib/main/task/task"
import { settings, refs } from "$lib/main/store";

const material = new MeshBasicMaterial({vertexColors: true})
// const material = new ShaderMaterial({
//     vertexShader: `

//         #define EPSILON 1e-10
//         uniform float logDepthBufFC;
      
//         attribute vec3 color;
//         flat varying vec3 vColor;

//         void main() {
//             vColor = color;
//             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
//             gl_Position.z = log2(gl_Position.w + 1.0) * logDepthBufFC;
//             gl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;
//         }

//     `,
//     fragmentShader: `

//         flat varying vec3 vColor;
  
//         void main() {
//             gl_FragColor = vec4(vColor, 1.0); 
//         }

//     `,
//     uniforms: {
//         logDepthBufFC: { value: 0.0001 }
//     }
// });

const dt_LOAD = 0.5
const dt_CLEAN = 0.1
const dt_REFRESH = 0.5

export default class RenderManager{

    constructor(scene){

        this.scene = scene
        this.processing = 0
        this.vramEstimate = 0
        this.renderedPlots = new Set()
        this.renderedLods = new Set()
        this.renderQueue = new RenderQueue()
        this.renderedChunks = {}
        
        this.totalTimeElapsed = 0
        this.lastLoadTimeStamp = 0
        this.lastCleanUpTimeStamp = 0
        this.lastRefreshTimeStamp = 0

        this.throttleSeconds = 0
        this.throttle = 0

    }

    
    hasAvailablility(){

        return Task.threadPool.length - this.processing > 0

    }

    isFree(){

        return this.processing === 0

    }

    setLodDistances(ratio){

        for(const lod of this.renderedLods)
        for(const level of lod.levels){

            level.distance *= ratio

        }

    }

    update(dt /*in seconds*/){

        this.totalTimeElapsed += dt

        const seconds = Math.floor(this.totalTimeElapsed)

        if(this.totalTimeElapsed - this.lastLoadTimeStamp >= dt_LOAD){

            this.throttle = 10
            this.lastLoadTimeStamp = this.totalTimeElapsed

        }

        if(this.totalTimeElapsed - this.lastCleanUpTimeStamp >= dt_CLEAN){

            // make single statement
            if(settings.render.limitType === 0){ // vram limit

                if(settings.render.vramLimit < 24000 && this.vramEstimate / 1e6 > settings.render.vramLimit)

                    this.unrenderOldestChunks()

            } else {

                if(settings.render.renderLimit < 75000 && this.renderedPlots.size > settings.render.renderLimit)

                    this.unrenderOldestChunks()

            }
            
            this.lastCleanUpTimeStamp = this.totalTimeElapsed

        }

        if(this.totalTimeElapsed - this.lastRefreshTimeStamp >= dt_REFRESH){

            for(const lod of this.renderedLods)

                lod.update(refs.camera)

            this.lastRefreshTimeStamp = this.totalTimeElapsed
            // console.log(`vram usage: ${Math.floor(this.vramEstimate / 1e6)} MB\nsystem usage: ${Math.floor(performance.memory.usedJSHeapSize / 1e6)} MB`)

        }

    }

    _memoryFootprint(geomData){

        let total = 0
        total += geomData.stdRes.position.length * 4
        total += geomData.stdRes.color.length
        total += geomData.stdRes.index.length * 4
        total += geomData.lowRes.position.length * 4
        total += geomData.lowRes.color.length
        total += geomData.lowRes.index.length * 4
        return total

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
        this.scene.add(mesh)
        this.renderedPlots.add(plot)
        plot.geometryData = null

    }

    async render(plot){

        if(this.renderedPlots.has(plot) || !this.throttle)

            return

        this.renderedPlots.add(plot)
        this.throttle--
        this.processing++

        let chunk = this.renderedChunks[plot.chunk.id]

        //if chunk doesn't exist, create it, add it to rendered
        if(!chunk)

            this.renderedChunks[plot.chunk.id] = chunk = {
                id: plot.chunk.id,
                size: plot.chunk.size, //every plot in a chunk has a reference to the same chunk object
                lods : [],
                plots : [],
                vramFootprint : 0,
                childChunkIds : new Set()
            }

        this.renderQueue.enqueue(chunk)
        await plot.load()
        chunk.plots.push(plot) //push plot after geometry data has been created. This ensures that all of them are processed before a merge happens.

        for(const childPlot of plot.children)

            chunk.childChunkIds.add(childPlot.chunk.id)
        
        if (plot.geometryData !== null && plot.geometryData.stdRes.position.length) {
            
            // if all plots processed, merge
            if (chunk.plots.length === chunk.size) {
                
                const merged = {}

                for(const res of ["stdRes", "lowRes"]){

                    const packaged = { position : [], color : [], index: [], min : [], max : [], scale : [] }

                    for(let i = 0; i < chunk.plots.length; i++){

                        if(chunk.plots[i].geometryData == null)

                            continue

                        const geomData = chunk.plots[i].geometryData[res]

                        packaged.position.push(geomData.position)
                        packaged.color.push(geomData.color)
                        packaged.index.push(geomData.index)

                        //compute bounds relative to world
                        const scale = chunk.plots[i].blockSize
                        const center = new Vector3(...geomData.center), dp = new Vector3(...geomData.dp)
                        const min = center.clone().sub(dp)
                        const max = center.clone().add(dp)

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

                this.vramEstimate -= chunk.vramFootprint
                chunk.vramFootprint = this._memoryFootprint(merged)
                this.vramEstimate += chunk.vramFootprint

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
                lod.addLevel(lowRes, settings.render.lowResDist * plot.parent.blockSize, 0.01)
                lod.position.copy(stdRes.position)
                lod.updateMatrix()
                lod.matrixWorld.copy(lod.matrix)
                lod.update(refs.camera)
                refs.scene.add(lod)

                //unrender lods
                for(const lod of chunk.lods){

                    refs.scene.remove(lod)
                    this.renderedLods.delete(lod)
        
                }

                //clean up system mem
                for(const plot of chunk.plots)

                    plot.geometryData = null

                this.renderedLods.add(lod)
                chunk.lods = [lod]
                
            } else {

                let center = new Vector3(...plot.geometryData.lowRes.center).multiplyScalar(plot.blockSize).add(plot.pos)
                const lowRes = this._createMesh(
                    plot.geometryData.lowRes.position,
                    plot.geometryData.lowRes.color,
                    plot.geometryData.lowRes.index,
                    center,
                    Math.hypot(...plot.geometryData.lowRes.dp),
                    plot.blockSize
                )
                center = new Vector3(...plot.geometryData.stdRes.center).multiplyScalar(plot.blockSize).add(plot.pos)
                const stdRes = this._createMesh(
                    plot.geometryData.stdRes.position,
                    plot.geometryData.stdRes.color,
                    plot.geometryData.stdRes.index,
                    center,
                    Math.hypot(...plot.geometryData.stdRes.dp),
                    plot.blockSize
                )
                const lod = new LOD()
                lod.autoUpdate = lod.matrixAutoUpdate = lod.matrixWorldAutoUpdate = false
                lod.addLevel(stdRes, 0)
                lod.addLevel(lowRes, settings.render.lowResDist * plot.parent.blockSize, 0.01)
                lod.position.copy(plot.pos)
                // lod.scale.set(plot.blockSize, plot.blockSize, plot.blockSize)
                lod.updateMatrix()
                lod.matrixWorld.copy(lod.matrix)
                lod.update(refs.camera)

                refs.scene.add(lod)
                this.renderedLods.add(lod)
                chunk.lods.push(lod)

                const vramFootprint = this._memoryFootprint(plot.geometryData)
                chunk.vramFootprint += vramFootprint
                this.vramEstimate += vramFootprint
        
            }

        }

        this.processing--

    }

    _disposeLod(lod){

        refs.scene.remove(lod)
        this.renderedLods.delete(lod)

        for(const level of lod.levels)

            level.object.geometry.dispose()
        
    }

    _unrender(chunk){

        //for each child chunk, check if it is rendered, if so, call _unrender
        for(const childId of chunk.childChunkIds){

            const childChunk = this.renderedChunks[childId]
            if(childChunk)

                this._unrender(childChunk)

        }
       
        for(const lod of chunk.lods)

            this._disposeLod(lod)
            
        for(const plot of chunk.plots){

            plot.clear()
            this.renderedPlots.delete(plot)

        }

        this.vramEstimate -= chunk.vramFootprint

        delete this.renderedChunks[chunk.id]

    }

    unrenderOldestChunks(){

        //dequeue until something rendered found
        let chunk = this.renderQueue.dequeue()

        while(this.renderedChunks[chunk.id] === undefined)

            chunk = this.renderQueue.dequeue()

        if(chunk)

            this._unrender(chunk)

    }

    unrenderChunkById(chunkId){
        
        const chunk = this.renderedChunks[chunkId]

        if(!chunk)

            return
        
        this._unrender(chunk)

    }

}

class RenderQueue {

    constructor() {

        this.head = null
        this.tail = null

    }

    enqueue(chunk) {

        // Find node
        let node = this.head

        while (node !== null) {

            if (node.chunk.id === chunk.id) break
            node = node.next

        }

        // If node not found, create it
        if (node === null) {

            const newNode = { next: null, back: null, chunk }

            if (this.head === null) 

                this.head = this.tail = newNode

            else {

                newNode.back = this.tail
                this.tail.next = newNode
                this.tail = newNode

            }

        } else {

            // Remove node from its current spot
            if (node.back !== null) 
                node.back.next = node.next
            else
                this.head = node.next
            
            if (node.next !== null) 
                node.next.back = node.back
            else
                this.tail = node.back
            
            // Add node to the back of the queue
            node.next = null
            node.back = this.tail

            if (this.tail !== null)
                this.tail.next = node
        
            this.tail = node
            
            if (this.head === null) 
                this.head = node
            
        }
    }

    dequeue() {

        if (this.head === null) 
            
            return null

        const dqed = this.head
        this.head = dqed.next

        if (this.head !== null) 

            this.head.back = null

        else 

            // The queue is now empty
            this.tail = null;
        
        return dqed.chunk

    }

}
