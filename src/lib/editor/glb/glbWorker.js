
import { ClampToEdgeWrapping, Matrix3, MirroredRepeatWrapping, RepeatWrapping, Vector2, Vector3 } from "three"

const V1 = new Vector3()
const V2 = new Vector3()
const V3 = new Vector3()

const UV1 = new Vector2()
const UV2 = new Vector2()
const UV3 = new Vector2()

const C1 = new Vector3()
const C2 = new Vector3()
const C3 = new Vector3()

const AB = new Vector3()
const AB1 = new Vector3()
const AB2 = new Vector3()
const CB = new Vector3()
const AI = new Vector3()

const normal = new Vector3()
const max = new Vector3()
const min = new Vector3()
const dimensions = new Vector3()

const pos = new Vector3()
const triCoords = new Vector3()

//unit vectors
const ih = new Vector3(1,0,0)
const jh = new Vector3(0,1,0)
const kh = new Vector3(0,0,1)

let chunk 
let uvMatrix

let position = []
let color = []

postMessage("loaded")

onmessage = e => {

    chunk = e.data

    let faceCount = 0

    const m = chunk.matrix
    const p = chunk.position
    const ids = chunk.indicies

    const transferable = [p.buffer]

    if(chunk.uvMatrix)

        uvMatrix = new Matrix3(...chunk.uvMatrix)

    if(chunk.type === "material")

        C1.setFromColor(chunk.color)

    if(ids) {

        let i1, i2, i3

        for(let i = 0; i < ids.length; i+=3){

            i1 = ids[i] * 3
            i2 = ids[i + 1] * 3
            i3 = ids[i + 2] * 3

            V1.set( p[i1], p[i1 + 1], p[i1 + 2] ).applyMatrix4(m)
            V2.set( p[i2], p[i2 + 1], p[i2 + 2] ).applyMatrix4(m)
            V3.set( p[i3], p[i3 + 1], p[i3 + 2] ).applyMatrix4(m)

            if ( chunk.type === "texture" ) {

                const uv = chunk.uv

                i1 = ids[i] * 2
                i2 = ids[i + 1] * 2
                i3 = ids[i + 2] * 2

                UV1.set( uv[i1], uv[i1+1])
                UV2.set( uv[i2], uv[i2+1])
                UV3.set( uv[i3], uv[i3+1])

            } else if( chunk.type === "color" ) {

                const c = chunk.color

                C1.set( c[i1], c[i1 + 1], c[i1 + 2] )
                C2.set( c[i2], c[i2 + 1], c[i2 + 2] )
                C3.set( c[i3], c[i3 + 1], c[i3 + 2] )

            }

            processFace()

            faceCount++

        }

        transferable.push(ids.buffer)

    } else {

        for(let i = 0; i < p.length; i += 9){

            V1.set( p[i], p[i+1], p[i+2] ).applyMatrix4(m)
            V2.set( p[i+3], p[i+4], p[i+5] ).applyMatrix4(m)
            V3.set( p[i+6], p[i+7], p[i+8] ).applyMatrix4(m)

            if( chunk.type === "texture" ) {

                const uv = chunk.uv

                const uvI = i * 6 / 9

                UV1.set( uv[uvI], uv[uvI+1] )
                UV2.set( uv[uvI+2], uv[uvI+3] )
                UV3.set( uv[uvI+4], uv[uvI+5] )

            } else if ( chunk.type === "color" ) {

                const c = chunk.color

                C1.set( c[i], c[i+1], c[i+2] )
                C2.set( c[i+3], c[i+4], c[i+5] )
                C3.set( c[i+6], c[i+7], c[i+8] )

            }

            processFace()

            faceCount++

        }

    }

    //transfer buffers back
    if(chunk.type === "texture")

        transferable.push( chunk.texture.buffer, chunk.uv.buffer )

    else if(chunk.type === "vrt-colors")

        transferable.push( chunk.color.buffer )


    postMessage( { position, color, chunk: chunk, faceCount }, transferable )

    position = []
    color = []
    chunk = null

}

function processFace(){

    normal.copy(V2).sub(V1).cross( V3.clone().sub(V1) ).normalize()

    max.copy(V1).max(V2).max(V3)
    min.copy(V1).min(V2).min(V3)

    dimensions.copy(max).sub(min).addScalar(1)

    //draw border of face
    line( V1, V2, ih, jh ) 
    line( V2, V3, jh, kh )
    line( V3, V1, kh, ih )

    //start each block at its border position relative to the bounding box of the face
    //project blocks in xy plane onto face

    for(var x = 0; x < dimensions.x; x++)
    for(var y = 0; y < dimensions.y; y++){

        projectBlock( x, y, 0, kh )

    }


    //project blocks in yz plane onto face
    for(var y = 0; y < dimensions.y; y++)
    for(var z = 0; z < dimensions.z; z++){

        projectBlock(  0, y, z, ih )

    }
    

    //project blocks in xz plane onto face
    for(var z = 0; z < dimensions.z; z++)
    for(var x = 0; x < dimensions.x; x++){

        projectBlock(  x, 0, z, jh )

    }


}

function line( a, b, triCoordA, triCoordB ) {

    const dist = a.distanceTo(b)
    const slope = b.clone().sub(a).divideScalar( dist )

    //interpolate between position a and b, place block on each iteration
    for(var i = 0; i < dist; i++){

        triCoords.copy(triCoordA).multiplyScalar( 1 - i / dist ).add( triCoordB.clone().multiplyScalar( i / dist ) )
        pos.copy(a).add( slope.clone().multiplyScalar(i) ).floor()

        drawBlock()

    }

}

function projectBlock( x, y, z, dir ){

    pos.set(x,y,z).add(min).addScalar(0.5)
    
    pos.add( dir.clone().multiplyScalar( V1.clone().sub(pos).dot(normal) / dir.dot(normal) ) )

    triCoords.set( ...barycentricCoords(V1,V2,V3,pos) )

    if( triCoords.x >= 0 && triCoords.y >= 0 && triCoords.z >= 0 && triCoords.x <= 1 && triCoords.y <= 1 && triCoords.z <= 1 && isFinite(pos.x) && isFinite(pos.y) && isFinite(pos.z) ){

        pos.floor()

        drawBlock()

    }

}

function  barycentricCoords(A,B,C,P){

    const v0 = B.clone().sub(A)
    const v1 = C.clone().sub(A)
    const vp = P.clone().sub(A)

    const d00 = v0.dot(v0)
    const d01 = v0.dot(v1)
    const d11 = v1.dot(v1)
    const dp0 = vp.dot(v0)
    const dp1 = vp.dot(v1)

    const det = d00 * d11 - d01 ** 2

    const u = (d11 * dp0 - d01 * dp1) / det
    const v = (d00 * dp1 - d01 * dp0) / det

    return [1 - u - v, u, v]

}

function triCoord( A, B, C ){

    AB.copy(B).sub(A)

    CB.copy(B).sub(C)

    AI.copy(pos).sub(A)

    AB1.copy(AB)

    AB1.sub( AB2.copy(AB).projectOnVector( CB ) )

    return 1 - AB1.dot(AI) / AB1.dot(AB)

}

function drawBlock(){

    switch(chunk.type){

        case 'texture':

            const t = chunk.texture
            const { width, height } = chunk

            //take linear combination of uvs
            const uv = UV1.clone().multiplyScalar(triCoords.x)
            .add(UV2.clone().multiplyScalar(triCoords.y))
            .add(UV3.clone().multiplyScalar(triCoords.z))

            uv.applyMatrix3(uvMatrix)

            //clamp uv between [0,1]
            switch(chunk.wrapS){

                case ClampToEdgeWrapping:

                    uv.x = uv.x < 0 ? 0 : uv.x > 1 ? 1 : uv.x
                    break

                case RepeatWrapping:

                    uv.x %= 1
                    uv.x = uv.x < 0 ? 1 + uv.x : uv.x
                    break

                case MirroredRepeatWrapping:

                    uv.x = Math.abs(uv.x)
                    uv.x = Math.floor(uv.x) % 2 === 1 ? 1 - uv.x % 1 : uv.x % 1

            }

            switch(chunk.wrapT){

                case ClampToEdgeWrapping:

                    uv.y = uv.y < 0 ? 0 : uv.y > 1 ? 1 : uv.y
                    break

                case RepeatWrapping:

                    uv.y %= 1
                    uv.y = uv.y < 0 ? 1 + uv.y : uv.y
                    break

                case MirroredRepeatWrapping:

                    uv.y = Math.abs(uv.y)
                    uv.y = Math.floor(uv.y) % 2 === 1 ? 1 - uv.y % 1 : uv.y % 1

            }

            const uvScaled = uv.clone();
            uvScaled.x *= width; // Scale x by texture width
            uvScaled.y *= height; // Scale y by texture height;
            
            // Determine surrounding texels
            const x0 = Math.floor(uvScaled.x);
            const x1 = x0 + 1;
            const y0 = Math.floor(uvScaled.y);
            const y1 = y0 + 1;
            
            // Fractional offsets
            const tx = uvScaled.x - x0;
            const ty = uvScaled.y - y0;
            
            // Clamp indices to texture resolution to avoid out-of-bounds access
            const clamp = (val, max) => Math.max(0, Math.min(val, max - 1));
            const x0Clamped = clamp(x0, width);
            const x1Clamped = clamp(x1, width);
            const y0Clamped = clamp(y0, height);
            const y1Clamped = clamp(y1, height);
            
            // Fetch texel RGBA values
            const i00 = ((y0Clamped * width + x0Clamped) * 4);
            const i10 = ((y0Clamped * width + x1Clamped) * 4);
            const i01 = ((y1Clamped * width + x0Clamped) * 4);
            const i11 = ((y1Clamped * width + x1Clamped) * 4);
            
            const color00 = [t[i00], t[i00 + 1], t[i00 + 2], t[i00 + 3]];
            const color10 = [t[i10], t[i10 + 1], t[i10 + 2], t[i10 + 3]];
            const color01 = [t[i01], t[i01 + 1], t[i01 + 2], t[i01 + 3]];
            const color11 = [t[i11], t[i11 + 1], t[i11 + 2], t[i11 + 3]];
            
            // Interpolate along X-axis
            const row0 = color00.map((c, j) => c * (1 - tx) + color10[j] * tx);
            const row1 = color01.map((c, j) => c * (1 - tx) + color11[j] * tx);
            
            // Interpolate along Y-axis
            const finalColor = row0.map((c, j) => c * (1 - ty) + row1[j] * ty);
            
            // Normalize RGBA values to [0, 1]
            const normalizedColor = finalColor.map((c) => c / 255);
            
            // Handle alpha channel
            if (normalizedColor[3] < 0.5) {
                return; // Discard the pixel
            }
            
            // Push RGB and alpha values
            for (let j = 0; j < 3; j++) {
                color.push(normalizedColor[j]);
            }
            

            break

        case 'vrt-colors':

            C1.multiplyScalar(triCoords.x)
            C2.multiplyScalar(triCoords.y)
            C3.multiplyScalar(triCoords.z)

            C1.add(C2).add(C3)

        case 'material':

            color.push( C1.x, C1.y, C1.z )

    }

    position.push(pos.x, pos.y, pos.z)

}
