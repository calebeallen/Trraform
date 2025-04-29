
/* TODO: Port to wasm, this is way too slow in js */

import { Vector3 } from "three"
import { ColorLibrary } from "../../common/colorLibrary"
import { PLOT_COUNT, LOW_RES, CHUNK_SIZE, MAX_DEPTH, CHUNK_BUCKET_URL, BUILD_SIZE_STD } from "../../common/constants"
import { I2P, P2I, backFace, bottomFace, expand, frontFace, getVertexIndicies, leftFace, rightFace, topFace, decodePlotData } from "../../common/utils"
import PlotId from "../../common/plotId"

postMessage("loaded")

onmessage = async e => {

    const method = e.data.method
    const data = e.data.data

    let response, transferable

    try{

        switch(method){

            case "reduce_poly":

                [response, transferable] = reducePoly(data.expanded, data.buildSize)
                break

            case "get_chunk":

                [response, transferable] = await getChunk(data.chunkId)
                break

            case "process_plot_data":

                [response, transferable] = await processPlotData(data.plotDataU8, data.placeSubplots)
                break

            case "merge_geometries":

                [response, transferable] = mergeGeometries(data.geometryData)
                break

        }

    } catch(e) {

        console.error(e)

        response = { err: true, msg: e }

        switch(method){

            case "reduce-poly":

                response.buildData = data.buildData
                transferable.push(data.buildData.buffer)
                break

        }

    }

    postMessage( { id: e.data.id, data: response }, transferable )

}

// fetches chunk, decodes it into it's parts
// TODO
async function getChunk(chunkId) {

    const res = await fetch(`${CHUNK_BUCKET_URL}/${chunkId}.dat`)

    if (!res.ok)
        return [{}, []]

    const buf = await res.arrayBuffer()
    const data = new Uint8Array(buf)

    const chunk = {} // The resulting map; keys as string, values as Uint8Array
    const transferable = []
    let cursor = 0
    const dataLength = data.length

    const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength)

    while (cursor < dataLength) {
        if (cursor + 2 > dataLength)
            throw new Error("Not enough bytes to read key length");

        // Read 2-byte key length (little-endian)
        const keyLen = dataView.getUint16(cursor, true);
        cursor += 2

        if (cursor + keyLen > dataLength)
            throw new Error("Not enough bytes to read key")

        // Read key bytes and decode as UTF-8 string
        const keyBytes = data.slice(cursor, cursor + keyLen)
        const key = new TextDecoder().decode(keyBytes)
        cursor += keyLen

        if (cursor + 4 > dataLength)
            throw new Error("Not enough bytes to read value length")

        // Read 4-byte value length (little-endian)
        const valueLen = dataView.getUint32(cursor, true)
        cursor += 4

        if (cursor + valueLen > dataLength)
            throw new Error("Not enough bytes to read value")

        // Read value
        const value = data.slice(cursor, cursor + valueLen)
        cursor += valueLen;

        chunk[key] = value
        transferable.push(value.buffer)
    }

    return [chunk, transferable]
}



/* one function that does everything, should reduce overhead */
// places unplaced subplots
// generates low detail geometry
// generates full detail geometry with poly reduction
async function processPlotData(plotDataU8, placeSubplots = true){

    let { owner, name, desc, link, linkTitle, verified, buildData } = decodePlotData(plotDataU8)

    // for canceled subscriptions, remove benefits
    if(!verified && buildData[1] > BUILD_SIZE_STD){

        const res = await fetch("/default_cactus.dat")
        const buf = await res.arrayBuffer()
       
        const dv = new DataView(buf)
        const len = buf.byteLength / 2
        const _buildData = new Uint16Array(len)
        
        for (let i = 0; i < len; i++) 
            _buildData[i] = dv.getUint16(i * 2, true)

        buildData = _buildData
        link = ""
        linkTitle = ""

    }

    const buildSize = buildData[1]
    const plotData = {
        owner,
        name,
        desc,
        link,
        linkTitle,
        verified,
        buildSize,
        plotIndices: null,
        geometryData: null
    }

    let expanded = buildData.length > 2 ? expand(buildData) : null

    const min = new Vector3(Infinity, Infinity, Infinity)
    const max = new Vector3()
    const v1 = new Vector3()
    const v2 = new Vector3()

    // handle subplot placement if not max depth
    if (placeSubplots) {

        const plotIndices = new Array(PLOT_COUNT).fill(-1)
        let plotsUnplaced = PLOT_COUNT

        // if build is not blank..
        if (expanded !== null) {

            //mark plots that are already placed
            let idx = 0
            for(let i = 2; i < buildData.length; i++){

                const val = buildData[i] >> 1

                if (buildData[i] & 1) {

                    if(val <= PLOT_COUNT && val !== 0){
                        plotIndices[val - 1] = idx
                        plotsUnplaced--
                    }

                    idx++

                } else

                    idx += val

            }

            // if plots unplaced, place on random top surfaces
            if(plotsUnplaced > 0){

                const topSurfaces = []
                const bs2 = buildSize ** 2

                for(let i = 0; i < expanded.length; i++){

                    const y = I2P(i, buildSize)[1]
                    const val = expanded[i]

                    if (val == 0 && (y == 0 || expanded[i - bs2] > PLOT_COUNT))
                        topSurfaces.push(i)

                }

                // hash build data to generate seed
                let hash = 0
                for(let i = 0; i < buildData.length; i++)
                    hash = (hash + buildData[i]) % 2147483647
            
                const rng = seededRNG(hash)

                // shuffle
                const n = Math.min(topSurfaces.length, plotsUnplaced)
                for(let i = 0; i < n; i++){
                    const j = Math.floor(rng() * topSurfaces.length)
                    const temp = topSurfaces[j]
                    topSurfaces[j] = topSurfaces[i]
                    topSurfaces[i] = temp
                }

                for(let i = 0, j = 0; i < n; i++){

                    const idx = topSurfaces[i]
                    while(plotIndices[j] != -1 && j < PLOT_COUNT) j++

                    if(j < PLOT_COUNT){
                        expanded[idx] = j + 1
                        plotIndices[j] = idx
                        plotsUnplaced--
                    }

                }

            }

        }

        // if left over plots, place in a grid
        const X0 = 1/12, Z0 = 3/12, S = 1/6
        let j = 0

        for (let z = 0; z < 4; z++)
        for (let x = 0; x < 6; x++) {

            v1.set(X0 + x * S, 0, Z0 + z * S)
            v1.multiplyScalar(buildSize).floor()

            const idx = P2I(v1, buildSize)
    
            if (expanded !== null && expanded[idx] > 0 && expanded[idx] <= PLOT_COUNT)
                continue

            while (plotIndices[j] != -1 && j < PLOT_COUNT) j++

            if (j < PLOT_COUNT) {

                plotIndices[j] = idx
                
                if(expanded !== null)
                    expanded[idx] = j + 1
                
            }

        }

        plotData.plotIndices = plotIndices

        // account for subplot positions in min/max
        for(let i = 0; i < plotIndices.length; i++){

            v1.set(...I2P(plotIndices[i], buildSize))
            min.min(v1)
            max.max(v1)

        }

    
    }
    
    //if build is empty, no geometry processing
    if(expanded === null)

        return [plotData, null]
   
    const [ geometryData, transferable ] = reducePoly(expanded, buildSize)

    v2.fromArray(geometryData.dp)
    v1.fromArray(geometryData.center) 
    v1.sub(v2)
    min.min(v1)
    v1.fromArray(geometryData.center)
    v1.add(v2)
    max.max(v1)    

    geometryData.min = min.toArray()
    geometryData.max = max.toArray()
    plotData.geometryData = geometryData

    return [ plotData, transferable ]

}

function seededRNG(seed){

    let state = seed
    
    return function () {
        state = (state * 16807) % 2147483647
        return state / 2147483647;
    }

}

function reducePoly(buildData /* expanded */, buildSize){

    const position = []
    const color = []
    const index = []
    const slice = new Array(buildSize)

    const p = new Vector3()
    const min = new Vector3(Infinity, Infinity, Infinity)
    const max = new Vector3()

    const cached = new Map()

    let indCounter = 0
    let testCounter = 0

    for(var i = 0; i < buildSize; i++)

        slice[i] = new Uint16Array(buildSize)

    //for each direction
    for(var i = 0; i < 6; i++){

        //for each layer create slice
        for(var c = 0; c < buildSize; c++){

            let ind 

            //fill slice with data
            for(var b = 0; b < buildSize; b++)
            for(var a = 0; a < buildSize; a++){

                switch(i){

                    case 0:
                    case 1:

                        p.x = a
                        p.y = c
                        p.z = b

                        ind = P2I(p, buildSize)
                        p.y += i % 2 === 0 ? 1 : -1

                        break
        
                    case 2:
                    case 3:
                        
                        p.x = a
                        p.y = b
                        p.z = c

                        ind = P2I(p, buildSize)
                        p.z += i % 2 === 0 ? 1 : -1

                        break
        
                    case 4:
                    case 5:
        
                        p.x = c
                        p.y = a
                        p.z = b

                        ind = P2I(p, buildSize)
                        p.x += i % 2 === 0 ? 1 : -1

                        break
        
                }
                
                const compInd = P2I(p, buildSize)
                const block = ind > buildData.length - 1 || buildData[ind] <= PLOT_COUNT ? 0 : 1
                const compBlock = compInd === null || compInd > buildData.length - 1 || buildData[compInd] <= PLOT_COUNT ? 0 : 1

                slice[b][a] = compBlock || !block ? 0 : buildData[ind]

            }

            for(let z = 0; z < buildSize; z++)
            for(let x = 0; x < buildSize; x++){
    
                //if start of rectangle found, search for entire rectangle
                if(slice[z][x] != 0){
    
                    let ci = slice[z][x]
                    let expandDown = true
                    let expandRight = true
                    let curX = x
                    let curZ = z
    
                    //locate start and end of rectangle
                    while(expandRight || expandDown){
    
                        if(curX + 1 >= buildSize)
    
                            expandRight = false
    
                        if(curZ + 1 >= buildSize)
                        
                            expandDown = false
        
                        if(expandRight)
    
                            for(let j = 0; j <= curZ - z; j++)
    
                                if( slice[z + j][curX + 1] === 0 || slice[z + j][curX + 1] !== ci)
    
                                    expandRight = false

                        if(expandRight) 
                        
                            curX++
    
                        if(expandDown)
    
                            for(let j = 0; j <= curX - x; j++)
    
                                if(slice[curZ + 1][x + j] === 0 || slice[curZ + 1][x + j] !== ci)
                                    
                                    expandDown = false
    
                        if(expandDown) 
                        
                            curZ++
    
                    }

                    const w = curX - x + 1
                    const h = curZ - z + 1
        
                    //set all values containing rectangle to 0
                    for(let z1 = 0; z1 < h; z1++)
                    for(let x1 = 0; x1 < w; x1++)
    
                        slice[z + z1][x + x1] = 0

                    let facePositions 
    
                    switch(i){

                        case 0: 
    
                            facePositions = topFace(x, c + 1, z, w, h)
                            break
                        
                        case 1:
    
                            facePositions = bottomFace(x, c, z, w, h)
                            break
    
                        case 2: 
    
                            facePositions = frontFace(x, z, c + 1, w, h)
                            break
    
                        case 3: 
    
                            facePositions = backFace(x, z, c, w, h)
                            break
                        
                        case 4: 
    
                            facePositions = rightFace(c + 1, x, z, w, h)
                            break
    
                        case 5: 
    
                            facePositions = leftFace(c, x, z, w, h)
                            break
    
                    }
                    const faceColor = ColorLibrary.applyLight(ci, Math.floor(i / 2))
                    facePositions = new Uint8Array(facePositions)

                    //check for cached indicies
                    for(let j = 0; j < 6; j++){

                        if(j === 4 || j === 5){

                            const k = index.length - (j - 3) * 2
                            index.push(index[k])
                            continue

                        }

                        const k = j * 3
                        const key = BigInt(facePositions[k] | (facePositions[k + 1] << 8) | (facePositions[k + 2] << 16)) | (BigInt(faceColor[0]) << 24n) | (BigInt(faceColor[1]) << 32n) | (BigInt(faceColor[2]) << 40n)
                        let ind = cached.get(key)

                        if(ind === undefined){

                            p.set(facePositions[k], facePositions[k + 1], facePositions[k + 2])
                            min.min(p)
                            max.max(p)

                            position.push(facePositions[k], facePositions[k + 1], facePositions[k + 2])
                            color.push(...faceColor)
                            cached.set(key, indCounter)
                            index.push(indCounter)
                            indCounter++

                        } else{

                            index.push(ind)
                            testCounter++

                        }

                    }

                }
                
            }

        }

    }

    const center = min.add(max).divideScalar(2)
    for(let i = 0; i < position.length; i+=3){

        position[i] -= center.x
        position[i + 1] -= center.y
        position[i + 2] -= center.z

    }

    const pf32 = new Float32Array(position)
    const cu8 = new Uint8Array(color)
    const iu32 = new Uint32Array(index)

    return [{ 
        position: pf32,
        color: cu8,
        index: iu32,
        center: center.toArray(),
        dp: max.sub(center).toArray()
    },[
        pf32.buffer,
        cu8.buffer,
        iu32.buffer
    ]]

}

function mergeGeometries(data){

    const n = data.position.length

    //compute world bounds
    const v1 = new Vector3(), v2 = new Vector3()
    const mergedMin = new Vector3(Infinity, Infinity, Infinity)
    const mergedMax = new Vector3(-Infinity, -Infinity, -Infinity)

    for(let i = 0; i < n; i++){

        v1.set(...data.min[i])
        mergedMin.min(v1)
        v1.set(...data.max[i])
        mergedMax.max(v1)
        
    }

    const mergedCenter = mergedMin.clone().add(mergedMax).divideScalar(2)
    const minScale = Math.min(...data.scale)
    const offsets = new Array(n)
    let totalPositions = 0, totalIndices = 0

    offsets[0] = 0

    for(let i = 0; i < n; i++){
        const positionLength = data.position[i].length
        const indexLength = data.index[i].length

        totalPositions += positionLength
        totalIndices += indexLength

        if(i > 0)

            offsets[i] = offsets[i - 1] + data.position[i - 1].length / 3

        //normalize positions
        //reposition relative to merged center
        v1.set(...data.min[i])
        v2.set(...data.max[i])
        const center = v1.add(v2).divideScalar(2) //world relative center
        center.sub(mergedCenter).divideScalar(minScale) //local relative center, remove scale

        const scale = data.scale[i] / minScale
        const p = new Vector3()
    
        for(let j = 0; j < positionLength; j+=3){

            p.set(data.position[i][j], data.position[i][j+1], data.position[i][j+2])
            p.multiplyScalar(scale).add(center)

            data.position[i][j] = p.x
            data.position[i][j + 1] = p.y
            data.position[i][j + 2] = p.z

        }

    }

    const position = new Float32Array(totalPositions)
    const color = new Uint8Array(totalPositions)
    const index = new Uint32Array(totalIndices)

    let positionOffset = 0, indexOffset = 0

    for(let i = 0; i < n; i++){

        const posLength = data.position[i].length
        const idxLength = data.index[i].length

        position.set(data.position[i], positionOffset)
        color.set(data.color[i], positionOffset)

        for(let j = 0; j < idxLength; j++)

            index[indexOffset + j] = data.index[i][j] + offsets[i]
        
        positionOffset += posLength
        indexOffset += idxLength

    }

    //normalize bounds
    const dp = mergedMax.sub(mergedCenter).divideScalar(minScale)

    return [{ position, color, index, center: mergedCenter.toArray(), dp: dp.toArray(), scale: minScale }, [position.buffer, color.buffer, index.buffer]]

}
