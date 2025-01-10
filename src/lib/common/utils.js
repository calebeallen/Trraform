
import { ColorLibrary } from "./colorLibrary"
import { DESC_FIELD_MAXLEN, LINK_FIELD_MAXLEN, LINK_LABEL_FIELD_MAXLEN, MAX_BUILD_SIZES, NAME_FIELD_MAXLEN, PLOT_VERSION } from "./constants"
import PlotId from "./plotId"

function P2I( pos, size ){

    if(pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x >= size || pos.y >= size || pos.z >= size )

        return null

    return size * ( pos.y * size + pos.z ) + pos.x

}

//position to index with custom dimensions
function P2I_D(pos, d){

    if(pos.x < 0 || pos.y < 0 || pos.z < 0 || pos.x >= d.x || pos.y >= d.y || pos.z >= d.z )

        return null

    return d.x * ( pos.y * d.z + pos.z ) + pos.x

}

function I2P( ind, size ){

    const s2 = size * size

    return [ ind % size, Math.floor( ind / s2 ), Math.floor( ( ind % s2 ) / size ) ]

}

function getFaceIndex ( x, y, z, s, offset ) {

    const s3 = s * 3
    return ( s * (s3 + 2) * y + (y >= s ? s * z + x : (s3 + 1) * z + (z >= s ? x : x * 3 + (x < s ? offset : 0)))) * 12

} 

function getVertexIndicies( start ){

    return [start, start + 1, start + 2, start + 3, start + 2, start + 1]

}

function vertexIndiciesToUintArr(arr){

    const maxInd = typeof arr === "number" ? arr : arr.length / 6 * 4

    if(maxInd < 2**8)

        return new Uint8Array(arr)
    
    if(maxInd < 2**16)

        return new Uint16Array(arr)

    return new Uint32Array(arr)

}

function topFace(x, y, z, w = 1, h = 1){

    return [

        x, y, z,
        x, y, z+h,
        x+w, y, z,
        x+w, y, z+h
        
    ]

}

function bottomFace(x, y, z, w = 1, h = 1){

    return [

        x, y, z,
        x+w, y, z,
        x, y, z+h,
        x+w, y, z+h

    ]

}

function frontFace(x, y, z, w = 1, h = 1){

    return [

        x, y, z,
        x+w, y, z,
        x, y+h, z,
        x+w, y+h, z
        
    ]

}

function backFace(x, y, z, w = 1, h = 1){

    return [

        x, y, z,
        x, y+h, z,
        x+w, y, z,
        x+w, y+h, z
         
    ]

}

function rightFace(x, y, z, w = 1, h = 1){

    return [

        x, y, z,
        x, y+w, z,
        x, y, z+h,
        x, y+w, z+h
        
    ]

}

function leftFace(x, y, z, w = 1, h = 1){

    return [

        x, y, z,
        x, y, z+h,
        x, y+w, z,
        x, y+w, z+h
        
    ]

}

function disposeMesh( mesh ){

    //dispose of all properties that have the dispose property
    for( const p in mesh ){

        const prop = mesh[p]

        if( prop !== null )

            //make sure to not dispose the global basic material
            if( typeof prop.dispose === 'function' && prop.name !== "global-basic-material" )

               prop.dispose()

    }

    //dispose children
    for(let i = 0; i < mesh.children.length; i++)

        disposeMesh(mesh.children[i])

}

//YOU CHANGED THIS
function condense(buildData, buildSize){

    console.log(buildSize)
    const condensed = [0, buildSize] //editor version 0

    const MB15 = 0x7fff

    let last = buildData[0]
    let repeat = 0

    const pushBlocks = () => {

        condensed.push((last << 1) | 1)

        if(repeat > 0){

            const dupAmt = Math.floor(repeat / MB15)
            const extra = repeat % MB15

            for(let k = 0; k < dupAmt; k++) 
            
                condensed.push(MB15 << 1)

            condensed.push(extra << 1)

        }

    }

    for( let i = 1; i < buildData.length; i++ ){  
        
        const current = buildData[i]

        if(current == last) 
        
            repeat++

        else{

            pushBlocks()

            repeat = 0

        }

        last = current
        
    }

    if(last != 0)

        pushBlocks()

    return new Uint16Array(condensed)

}

//for editor version 0
function expand(condensed){

    const expanded = new Uint16Array(condensed[1] ** 3)

    let value
    let j = 0

    for(let i = 2; i < condensed.length; i++)

        if( ( condensed[i] & 1 ) === 1 ){

            value = ( condensed[i] >> 1 )
            expanded[j] = value
            j++

        } else 

            for(let k = 0; k < ( condensed[i] >> 1 ); k++){

                expanded[j] = value
                j++

            }

    const expandedMin = new Uint16Array(j)

    for(let i = 0; i < j; i++)
        
        expandedMin[i] = expanded[i]

    return expanded

}

function verifyBuild(buffer){

    //verify that editor version is vaild
    if( buffer[0] > 0 )

        return false

    const buildSize = buffer[1]
    const build = buffer.subarray(2)

    let blkCount = 0

    for(let i = 0; i < build.length; i++){

        const write = build[i] & 1
        const val = build[i] >> 1

        if (write) {
        
            if(val >= ColorLibrary.colors.length)

            return false

            blkCount++

        } else

            blkCount += val

    }

    if(blkCount > buildSize ** 3)

        return false

    return true

}

function decodePlotData(bytes, depth = 0, validateBuildSize = false){

    const parts = []

    while(bytes.length > 0){

        const lenBytes = bytes.slice(0,4)
        const len = new DataView(lenBytes.buffer).getUint32(0, true)
        parts.push(bytes.subarray(4, len + 4))
        bytes = bytes.subarray(len + 4)

    }

    const jsonData = parts[0].length === 0 ? {} : JSON.parse(new TextDecoder().decode(parts[0]))
    let { ver, name, desc, link, linkLabel, rEnd } = jsonData

    let buildData = null

    if(parts[1]?.length){

        const buildDataU8 = Uint8Array.from(parts[1])
        buildData = new Uint16Array(buildDataU8.buffer)

        //clip build data to fit within max build size for its depth
        if(validateBuildSize){

            const maxInd = MAX_BUILD_SIZES[depth] ** 3 - 1
            let i, ptr = 0

            for(i = 2; i < buildData.length; i++){

                const newBlock = buildData[i] & 1

                if (newBlock) {
                    
                    // if adding the block would push past max length, break
                    if(ptr + 1 > maxInd)
                        
                        break

                    ptr++

                } else {

                    //clip repeat length
                    const lastInd = Math.min( ptr + (buildData[i] >> 1), maxInd )
                    const len = lastInd - ptr

                    if(!len)

                        break

                    if(lastInd == maxInd){

                        buildData[i] = len << 1
                        i++
                        break

                    }

                    ptr += len
                    
                }

            }

            buildData = buildData.subarray(0, i)
            buildData[1] = Math.min(buildData[1], MAX_BUILD_SIZES[depth])

        }

    }

    return {
        ver,
        name : substring(name || "", NAME_FIELD_MAXLEN),
        desc : substring(desc || "", DESC_FIELD_MAXLEN),
        link : (link || "").substring(0, LINK_FIELD_MAXLEN),
        linkLabel : substring(linkLabel || "", LINK_LABEL_FIELD_MAXLEN),
        rEnd : parseInt(rEnd || 0),
        buildData
    }   

}


//packages plot data into:
// | json data length (4 bytes) | json data | buildData length (4 bytes) | buildData |
function encodePlotData({ name, desc, link, linkLabel, rEnd, buildData = null } = {}){

    const json = {
        ver : PLOT_VERSION,
        name : substring(name || "", NAME_FIELD_MAXLEN),
        desc : substring(desc || "", DESC_FIELD_MAXLEN),
        link : (link || "").substring(0, LINK_FIELD_MAXLEN),
        linkLabel : substring(linkLabel || "", LINK_LABEL_FIELD_MAXLEN),
        rEnd : parseInt(rEnd || 0)
    }   

    const parts = []
    const jsonPart = new TextEncoder().encode(JSON.stringify(json))
    parts.push(writeUint32Len(jsonPart.length))
    parts.push(jsonPart)

    if(buildData){
    
        const buildU8 = new Uint8Array(buildData.buffer, buildData.byteOffset)
        parts.push(writeUint32Len(buildU8.length))
        parts.push(buildU8)

    }

    const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0)
    const result = new Uint8Array(totalLength)
    
    let offset = 0;
    for (const part of parts) {
        result.set(new Uint8Array(part.buffer, part.byteOffset, part.byteLength), offset);
        offset += part.byteLength;
    }

    return result

}

function substring(str, len){

    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    const graphemes = Array.from(segmenter.segment(str))
    return graphemes.slice(0, len).map(s => s.segment).join('')

}

function writeUint32Len(value) {

    const buffer = new ArrayBuffer(4)
    new DataView(buffer).setUint32(0, value, true)
    return new Uint8Array(buffer)

}

function pushNotification(notification, header, text, callback = () => {}){

    const id = Math.random()

    notification.update(arr => {

        arr.push({ id, header, text, callback })

        setTimeout(() => deleteNotification(notification, id), 5000)

        return arr

    })

    return id

}

function deleteNotification(notification, _id){

    notification.update(arr => arr.filter(({id}) => id !== _id))

}

// function decodePlotData(buffer, depth){

//     //parse restriction header
//     const restrictionLevel = buffer[1]
//     const endTimeU8 = new Uint8Array(8)
//     for(let i = 0; i < 8; i++)

//         endTimeU8[i] = buffer[i + 2]

//     const endTimeU64 = new BigUint64Array(endTimeU8.buffer)
//     const endTime = endTimeU64[0]

//     //parse body
//     const chunks = _readChunks(buffer.subarray(12))

//     let transferable = []
//     let buildData = null

//     if(chunks[3].length !== 0){

//         const buildDataU8 = new Uint8Array(chunks[3].length)
//         buildDataU8.set(chunks[3])

//         buildData = new Uint16Array(buildDataU8.buffer)
        
//         //limits in place incase someone messes with client side js to upload something that goes beyond allowed constraints
//         //limit build size

//         const buildSize = Math.min(buildData[1], MAX_BUILD_SIZES[depth])
//         const maxLen = buildSize ** 3 + 2

//         buildData = buildData.subarray(0, maxLen)
//         buildData[1] = buildSize
//         transferable.push(buildData.buffer)

//     }

//     const textDecoder = new TextDecoder()

//     //limit text lengths (note they need to be double the length )
//     return [{
//         restrictionLevel,
//         endTime,
//         name : substring(textDecoder.decode(chunks[0]).trim(), NAME_FIELD_MAXLEN),
//         desc : substring(textDecoder.decode(chunks[1]).trim(), DESC_FIELD_MAXLEN),
//         link : substring(textDecoder.decode(chunks[2]).trim(), LINK_FIELD_MAXLEN),
//         buildData
//     }, transferable]

// }


// function encodePlotData(name = null, desc = null, link = null, buildData = null){

//     buildData = buildData || new Uint8Array()

//     const textEncoder = new TextEncoder()
//     const binData = [
//         textEncoder.encode(name || ""), 
//         textEncoder.encode(desc || ""), 
//         textEncoder.encode(link || ""), 
//         new Uint8Array(buildData.buffer)
//     ]
//     const blobParts = [new Uint8Array(12)] //header (set on server) [version(2bytes)|verified(1byte)|restricted(1byte)|restrictionEndTime(8byte)]

//     //prepend byte length to each buffer
//     for(let i = 0; i < binData.length; i++){

//         const sizeHeader = new Uint32Array([binData[i].byteLength])
//         blobParts.push(sizeHeader, binData[i])

//     }

//     //minimum encoded length = header 12 + body 4 * fieldCount = 28 bytes
//     return new Blob( blobParts, { type: "application/octet-stream" } )

// }


export { I2P, P2I, P2I_D, getFaceIndex, getVertexIndicies, vertexIndiciesToUintArr, topFace, bottomFace, frontFace, backFace, leftFace, rightFace, disposeMesh, condense, expand, verifyBuild, decodePlotData, encodePlotData, pushNotification, deleteNotification }