import { BaseChunk } from "./chunk"
import RootPlot from "./rootPlot"
import { refs, settings } from "../store"
import { MeshBasicMaterial } from "three"
import Queue from "../structures/queue"

const RENDER_LIMIT_MAX = 10_000_000

const material = new MeshBasicMaterial({vertexColors: true})
const root = {
    chunkMaps: null,
    idToIdx: null,
    plot: null,
    chunk: null,
    renderedFaces: 0
}

async function initRoot(){

    // create layer 1 map
    const resL1 = await fetch(`/L1.dat`)
    const bufL1 = await resL1.arrayBuffer()
    const u32L1 = new Uint32Array(bufL1)
    const mapL1 = []
    for(let i = 0; i < u32L1.length; i+=2){

        if(mapL1[u32L1[i]] === undefined)
            mapL1[u32L1[i]] = []
        
        mapL1[u32L1[i]].push(u32L1[i+1])

    }

    // create layer 0 map (from layer 1 map)
    const map00 = new Array(mapL1.length)
    for(let i = 0; i < mapL1.length; i++)
        map00[i] = i
    const mapL0 = [map00]

    // create layer 2 map and chunk id to plot idx map
    const resL2 = await fetch(`/L2.dat`)
    const bufL2 = await resL2.arrayBuffer()
    const u32L2 = new Uint32Array(bufL2)
    const mapL2 = []
    const l2idToIdxs = []
    for(let i = 0; i < u32L2.length; i+=2){

        if(mapL2[u32L2[i]] === undefined){
            mapL2[u32L2[i]] = []
            l2idToIdxs[u32L2[i]] = []
        }
        
        mapL2[u32L2[i]].push(i / 2)
        l2idToIdxs[u32L2[i]].push(u32L2[i+1])

    }

    root.chunkMaps = [mapL0, mapL1, mapL2]
    root.plot = new RootPlot(l2idToIdxs)
    await root.plot.load()

    root.chunk = new BaseChunk(0, null, 0)
    await root.chunk.load()

    refs.scene.add(root.plot.createMesh())

}   

class RenderManager {

    constructor(){

        this.renderedChunks = new Set()
        this.cleanUpQueue = new Queue()
        this.locked = false
        this.load = 0

    }

    async renderWithLock({ chunk }){

        if(this.locked || this.renderedChunks.has(chunk.id))
            return

        this.locked = true
        this.renderedChunks.add(chunk.id)
        await chunk.load()
        if(settings.renderLimit < RENDER_LIMIT_MAX)
            await this.cleanUp()
        this.cleanUpQueue.enqueue(chunk)
        this.locked = false

    }

    async render({ chunk }){

        if(this.renderedChunks.has(chunk.id))
            return

        this.renderedChunks.add(chunk.id)
        await chunk.load()

    }

    async cleanUp(){

        const cleanPer = 0.05

        if(root.renderedFaces > settings.renderLimit){

            const thresh = Math.ceil(settings.renderLimit * (1 - cleanPer))
            while(root.renderedFaces > thresh && this.cleanUpQueue.size()){

                const chunk = this.cleanUpQueue.dequeue()
                const success = await chunk.unload()

                if(success)
                    this.renderedChunks.delete(chunk.id)
                else
                    this.cleanUpQueue.enqueue(chunk)


            }

        }
        

    }

}

export { root, initRoot, RenderManager, material }
