
import { ColorLibrary } from "./colorLibrary"
import { DESC_FIELD_MAXLEN, LINK_FIELD_MAXLEN, LINK_LABEL_FIELD_MAXLEN, MIN_BUILD_SIZE, NAME_FIELD_MAXLEN, PLOT_COUNT } from "./constants"

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

function condense(buildData, buildSize){

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

function validateBuildData(data) {

    const MAX_COLOR_INDEX = ColorLibrary.colors.length - 1

    if (data.length < 2) 
        return false

    const bs = data[1]
    const bs3 = bs ** 3
  
    const subplotsUsed = new Array(PLOT_COUNT).fill(false)
  
    let blkCnt = 0
  
    for (let i = 2; i < data.length; i++) {

        const write = data[i] & 1
        const val = data[i] >>> 1
    
        if (write === 1) {

            if (val > MAX_COLOR_INDEX)
                return false
            
            if (val > 0 && val <= PLOT_COUNT) {

                if (subplotsUsed[val - 1])
                    return false
        
                if ((i + 1) < data.length && ((data[i + 1] & 1) === 0))
                    return false
        
                subplotsUsed[val - 1] = true

            }
    
            blkCnt++

        } else 

            blkCnt += val
        
        if (blkCnt > bs3)
            return false
        
    }
    
    return true

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

// does not do an in-depth validation
function decodePlotData(bytes){

    const parts = []

    while(bytes.length > 0){

        const lenBytes = bytes.slice(0,4)
        const len = new DataView(lenBytes.buffer).getUint32(0, true)
        parts.push(bytes.subarray(4, len + 4))
        bytes = bytes.subarray(len + 4)

    }

    // json part is mandatory, build is optional
    if(parts.length == 0 || parts.length > 2)

        throw new Error("cannot decode plot data: invalid parts length")

    const jsonData = JSON.parse(new TextDecoder().decode(parts[0]))
    const { ver, name, desc, link, linkLabel, rEnd } = jsonData
    let buildData = null

    // if it has a build part, give blank build
    // *this is already done on server, but just for precaution
    if (parts.length == 1) {
        
        buildData = new Uint16Array([0, MIN_BUILD_SIZE])

    } else {

        const buildDataU8 = Uint8Array.from(parts[1])
        const dv = new DataView(buildDataU8.buffer)
        const len = buildDataU8.length / 2

        buildData = new Uint16Array(len)

        for (let i = 0; i < len.length; i++) 
            buildData[i] = dv.getUint16(i * 2, true)

    }

    return { ver, name, desc, link, linkLabel, rEnd, buildData }   

}

// not used 
function encodePlotData({ name, desc, link, linkLabel, rEnd, buildData = null } = {}){

    const json = {
        name : substring(name ?? "", NAME_FIELD_MAXLEN),
        desc : substring(desc ?? "", DESC_FIELD_MAXLEN),
        link : (link ?? "").substring(0, LINK_FIELD_MAXLEN),
        linkLabel : substring(linkLabel ?? "", LINK_LABEL_FIELD_MAXLEN),
        rEnd : parseInt(rEnd ?? 0)
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

export { I2P, P2I, P2I_D, getFaceIndex, getVertexIndicies, vertexIndiciesToUintArr, topFace, bottomFace, frontFace, backFace, leftFace, rightFace, disposeMesh, condense, expand, validateBuildData, decodePlotData, encodePlotData, pushNotification, deleteNotification }