
/* TODO: Port to wasm, this is way too slow in js */

import { Vector3 } from "three"
import { ColorLibrary } from "../../common/colorLibrary"
import { PLOT_COUNT, LOW_RES, CHUNK_SIZE, MAX_DEPTH, CHUNK_BUCKET_URL } from "../../common/constants"
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

                [response, transferable] = processPlotData(data.plotDataU8, data.placeSubplots)
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
async function getChunk(chunkId){

    const res = await fetch(`${CHUNK_BUCKET_URL}/${chunkId}`)

    // if(!res.ok)
    //     return {}, []

    return [{}, []]

}

/* one function that does everything, should reduce overhead */
// places unplaced subplots
// generates low detail geometry
// generates full detail geometry with poly reduction
function processPlotData(plotDataU8, placeSubplots = true){

    const { owner, name, desc, link, linkTitle, verified, buildData } = decodePlotData(plotDataU8)

    const buildSize = buildData[1]
    const plotData = {
        owner,
        name,
        desc,
        link,
        linkTitle,
        verified,
        buildSize,
        plotIndicies: null,
        geometryData: null
    }

    let expanded = buildData.length > 2 ? expand(buildData) : null

    const min = new Vector3(Infinity, Infinity, Infinity)
    const max = new Vector3()
    const v1 = new Vector3()
    const v2 = new Vector3()

    // handle subplot placement if not max depth
    if (subplots) {

        const plotIndicies = new Array(PLOT_COUNT).fill(-1)
        let plotsUnplaced = PLOT_COUNT

        // if build is not blank..
        if (expanded !== null) {

            //mark plots that are already placed
            let idx = 0
            for(let i = 2; i < buildData.length; i++){

                const val = buildData[i] >> 1

                if (buildData[i] & 1) {

                    if(val <= PLOT_COUNT && val !== 0){
                        plotIndicies[val - 1] = idx
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
                    while(plotIndicies[j] != -1 && j < PLOT_COUNT) j++

                    if(j < PLOT_COUNT){
                        expanded[idx] = j + 1
                        plotIndicies[j] = idx
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

            while (plotIndicies[j] != -1 && j < PLOT_COUNT) j++

            if (j < PLOT_COUNT) {

                plotIndicies[j] = idx
                
                if(expanded !== null)
                    expanded[idx] = j + 1
                
            }

        }

        plotData.plotIndicies = plotIndicies

        // account for subplot positions in min/max
        for(let i = 0; i < plotIndicies.length; i++){

            v1.set(...I2P(plotIndicies[i], buildSize))
            min.min(v1)
            max.max(v1)

        }

    
    }
    
    //if build is empty, no geometry processing
    if(expanded === null)

        return [plotData, null]
   
    const stdRes = reducePoly(expanded, buildSize)[0]
    const lowRes = makeLowRes(expanded, buildSize, LOW_RES)
    v2.fromArray(stdRes.dp)
    v1.fromArray(stdRes.center) 
    v1.sub(v2)
    min.min(v1)
    v1.fromArray(stdRes.center)
    v1.add(v2)
    max.max(v1)    

    plotData.geometryData = {
        max: max.toArray(),
        min: min.toArray(),
        stdRes,
        lowRes
    }

    return [plotData, [
        stdRes.position.buffer,
        stdRes.color.buffer,
        stdRes.index.buffer,
        lowRes.position.buffer,
        lowRes.color.buffer,
        lowRes.index.buffer
    ]]

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

function makeLowRes(buildData, size, newSize){

    const chunkSize = Math.ceil(size / newSize) 
    const chunkVolume = chunkSize ** 3
    const boxes = []

    for(let cy = 0; cy < newSize; cy++)
    for(let cz = 0; cz < newSize; cz++)
    for(let cx = 0; cx < newSize; cx++){

        const yLim = Math.min(size - chunkSize * cy, chunkSize)
        const zLim = Math.min(size - chunkSize * cz, chunkSize)
        const xLim = Math.min(size - chunkSize * cx, chunkSize)

        // calculate center of mass and color
        const averageColor = new Vector3()
        const centerOfMass = new Vector3()
        let n = 0

        for(let _y = 0; _y < yLim; _y++)
        for(let _z = 0; _z < zLim; _z++)
        for(let _x = 0; _x < xLim; _x++){
    
            const x = cx * chunkSize + _x
            const y = cy * chunkSize + _y
            const z = cz * chunkSize + _z
            const i = size * ( y * size + z ) + x

            if(i >= buildData.length)

                continue

            const ci = buildData[i]

            if(ci <= PLOT_COUNT)

                continue

            const c = ColorLibrary.colors[ci]

            centerOfMass.x += x
            centerOfMass.y += y
            centerOfMass.z += z
            averageColor.x += c[0]
            averageColor.y += c[1]
            averageColor.z += c[2]
            n++
            
        }

        if(n === 0)

            continue

        centerOfMass.divideScalar(n).floor().addScalar(0.5)
        averageColor.divideScalar(n)

        //calculate deviation in x,y,z
        const dev = new Vector3()

        for(let _y = 0; _y < yLim; _y++)
        for(let _z = 0; _z < zLim; _z++)
        for(let _x = 0; _x < xLim; _x++){

            const x = cx * chunkSize + _x
            const y = cy * chunkSize + _y
            const z = cz * chunkSize + _z

            dev.x += Math.abs(x - centerOfMass.x)
            dev.y += Math.abs(y - centerOfMass.y)
            dev.z += Math.abs(z - centerOfMass.z)
            
        }

        dev.divideScalar(chunkVolume * 1.2)
        boxes.push({
            min : centerOfMass.sub(dev).add(new Vector3().random()),
            col : averageColor,
            delta : dev.multiplyScalar(2),
        })

    }

    const position = new Float32Array(boxes.length * 72)
    const color = new Uint8Array(boxes.length * 72)
    const index = new Uint32Array(boxes.length * 36)

    let pi = 0
    let ii = 0
    let indCounter = 0

    const _min = new Vector3(Infinity, Infinity, Infinity)
    const max = new Vector3(-Infinity, -Infinity, -Infinity)
    const v = new Vector3()

    for (const { min, delta, col } of boxes) {
        
        for(let i = 0; i < 6; i++){

            let facePositions
            const indicies = getVertexIndicies(indCounter)

            switch(i){

                case 0: 

                    facePositions = topFace(min.x, min.y + delta.y, min.z, delta.x, delta.z)
                    break
                
                case 1:

                    facePositions = bottomFace(min.x, min.y, min.z, delta.x, delta.z)
                    break

                case 2: 

                    facePositions = frontFace(min.x, min.y, min.z + delta.z, delta.x, delta.y)
                    break

                case 3: 

                    facePositions =  backFace(min.x, min.y, min.z, delta.x, delta.y)
                    break
                
                case 4: 

                    facePositions = rightFace(min.x + delta.x, min.y, min.z, delta.y, delta.z)
                    break

                case 5: 

                    facePositions = leftFace(min.x, min.y, min.z, delta.y, delta.z)
                    break

            }

            //brighten color slightly
            const col1 = ColorLibrary.applyLightRGB(col.toArray(), Math.floor(i / 2))

            for(let j = 0; j < 4; j++, pi++){

                const k = j * 3
                const k1 = pi * 3

                position[k1] = facePositions[k] 
                position[k1 + 1] = facePositions[k + 1] 
                position[k1 + 2] = facePositions[k + 2]
                v.set(position[k1], position[k1 + 1], position[k1 + 2])
                _min.min(v)
                max.max(v)

                color[k1] = col1[0]
                color[k1 + 1] = col1[1]
                color[k1 + 2] = col1[2]

            }

            for(let j = 0; j < 6; j++, ii++)

                index[ii] = indicies[j]

            indCounter += 4

        }

    }

    const center = _min.add(max).divideScalar(2)

    for(let i = 0; i < position.length; i+=3){

        position[i] -= center.x
        position[i + 1] -= center.y
        position[i + 2] -= center.z

    }

    return { 
        position, 
        color, 
        index, 
        center : center.toArray(),
        dp : max.sub(center).toArray()
    }

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


// unused but may use later
function resizeBuildData(buildData, size, newSize){

    const resized = new Uint16Array(newSize ** 3)
    const chunkSize = Math.ceil(size / newSize) 

    for(let cy = 0; cy < newSize; cy++)
    for(let cz = 0; cz < newSize; cz++)
    for(let cx = 0; cx < newSize; cx++){

        const yLim = Math.min(size - chunkSize * cy, chunkSize)
        const zLim = Math.min(size - chunkSize * cz, chunkSize)
        const xLim = Math.min(size - chunkSize * cx, chunkSize)

        let mostCommon = 0
        let max = 0
        let colorCounts = {}

        for(let _y = 0; _y < yLim; _y++)
        for(let _z = 0; _z < zLim; _z++)
        for(let _x = 0; _x < xLim; _x++){
    
            const y = cy * chunkSize + _y
            const z = cz * chunkSize + _z
            const x = cx * chunkSize + _x
            const i = size * ( y * size + z ) + x

            if(i >= buildData.length)

                continue

            const col = buildData[i]

            if(col === 0)
                continue

            if(colorCounts[col] === undefined){

                colorCounts[col] = 1

            }else

                colorCounts[col]++

            if(colorCounts[col] > max){

                max = colorCounts[col]
                mostCommon = col

            }
            
        }

        if(mostCommon)

            resized[newSize * ( cy * newSize + cz ) + cx] = mostCommon
    
    }

    return resized

}

