import { BaseChunk } from "./chunk"
import RootPlot from "./rootPlot"

const root = {
    chunkMaps: null,
    idToIdx: null,
    plot: null,
    chunk: null
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
    const idToIdx = []
    for(let i = 0; i < u32L2.length; i+=2){

        if(mapL2[u32L2[i]] === undefined){
            mapL2[u32L2[i]] = []
            idToIdx[u32L2[i]] = []
        }
        
        mapL2[u32L2[i]].push(i / 2)
        idToIdx[u32L2[i]].push(u32L2[i+1])

    }

    root.chunkMaps = [mapL0, mapL1, mapL2]
    root.idToIdx = idToIdx

    root.plot = new RootPlot()
    await root.plot.load()

    root.chunk = new BaseChunk(0, null, 0)

    console.log(root.chunk)

}   

export { initRoot, root }
