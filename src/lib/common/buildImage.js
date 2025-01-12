
import { LinearSRGBColorSpace, Matrix4, PerspectiveCamera, Scene, Spherical, Vector3, Vector4, WebGLRenderer } from "three"
import { disposeMesh } from "./utils"

const RES = 1000
const PRECISION = 2

function getCamera(geometry, aspectRatio){

    const camera = new PerspectiveCamera(70, aspectRatio, 0.01, 1000)

    if(!geometry.boundingSphere)

        geometry.computeBoundingSphere()

    const bounds = geometry.boundingSphere

    camera.position.setFromSpherical(new Spherical(bounds.radius * 2, Math.PI * 4.5/10, Math.PI / 4)).add(bounds.center)
    camera.lookAt(bounds.center)

    camera.updateMatrixWorld()

    return camera

}

function centerMesh(mesh, viewMatrix){

    const position = mesh.geometry.attributes.position.array

    const vect4 = new Vector4()

    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity

    for(let i = 0; i < position.length; i+=3){

        vect4.set(position[i], position[i + 1], position[i + 2], 1)
        vect4.applyMatrix4(viewMatrix)

        vect4.x = vect4.x / vect4.w + 1
        vect4.y = vect4.y / vect4.w + 1

        if(vect4.x < xMin)
            xMin = vect4.x
        if(vect4.x > xMax)
            xMax = vect4.x
        if(vect4.y < yMin)
            yMin = vect4.y
        if(vect4.y > yMax)
            yMax = vect4.y

    }

    const dx = (2 - xMax + xMin) / 2 - xMin
    const dy = (2 - yMax + yMin) / 2 - yMin
    const viewMatrixInv = viewMatrix.clone().invert()

    for(let i = 0; i < position.length; i+=3){

        vect4.set(position[i], position[i + 1], position[i + 2], 1)
        vect4.applyMatrix4(viewMatrix)

        vect4.x += dx * vect4.w
        vect4.y += dy * vect4.w

        vect4.applyMatrix4(viewMatrixInv)

        position[i] = vect4.x
        position[i + 1] = vect4.y
        position[i + 2] = vect4.z

    }

    mesh.geometry.attributes.position.needsUpdate = true

}

function buildImageUrl(width, height, mesh){

    const offscreen = document.createElement("canvas")
    const renderer = new WebGLRenderer( { canvas: offscreen, alpha: true, antialias: false } )
    const scene = new Scene()

    renderer.outputColorSpace = LinearSRGBColorSpace
    renderer.setSize(width, height, false)
    renderer.setPixelRatio( window.devicePixelRatio )

    const camera = getCamera(mesh.geometry, width / height)
    const viewMatrix = new Matrix4()
    viewMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)

    centerMesh(mesh, viewMatrix)

    scene.add(mesh)

    renderer.render(scene, camera)

    const gl = renderer.getContext()
    const w = offscreen.width
    const h = offscreen.height

    const imgData = new Uint8ClampedArray(w * h * 4) 

    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, imgData)

    for(let y = 0; y < Math.floor(h / 2); y++)
    for(let x = 0; x < w; x++)
    for(let i = 0; i < 4; i++){ 

        const topIndex = (y * w + x) * 4 + i
        const bottomIndex = ((h - y - 1) * w + x) * 4 + i

        // Swap top and bottom pixels
        const temp = imgData[topIndex]
        imgData[topIndex] = imgData[bottomIndex]
        imgData[bottomIndex] = temp

    }
    
    //write centered image to canvas then url
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.putImageData(new ImageData(imgData, w, h), 0, 0)

    const url = canvas.toDataURL()

    //clean up 
    scene.remove(mesh)
    renderer.forceContextLoss()
    renderer.dispose()

    return url

}


function preprocessPNG(mesh, resolution = 1000){

    const position = mesh.geometry.attributes.position.array
    const color = mesh.geometry.attributes.color.array
    const indicies = mesh.geometry.index.array

    const camera = getCamera(mesh.geometry, 1)
    const vect4 = new Vector4()
    const viewMatrix = new Matrix4()
    viewMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)

    const faces = []

    for(let i = 0; i < indicies.length; i+=6){

        //get face direction and size
        const v1 = new Vector3(position[indicies[i] * 3], position[indicies[i] * 3 + 1], position[indicies[i] * 3 + 2])
        const v2 = new Vector3(position[indicies[i + 1] * 3], position[indicies[i + 1] * 3 + 1], position[indicies[i + 1] * 3 + 2])
        const v3 = new Vector3(position[indicies[i + 2] * 3], position[indicies[i + 2] * 3 + 1], position[indicies[i + 2] * 3 + 2])
        const v4 = new Vector3(position[indicies[i + 3] * 3], position[indicies[i + 3] * 3 + 1], position[indicies[i + 3] * 3 + 2])

        v2.sub(v1)
        v3.sub(v1)
        v4.sub(v1)

        v2.cross(v3).normalize()

        let faceDir
        let delta1, delta2

        if(v2.x !== 0){

            if(v2.x < 0)

                continue

            faceDir = 0
            delta1 = v4.y
            delta2 = v4.z

        }else if(v2.y !== 0){

            if(v2.y < 0)

                continue

            faceDir = 1
            delta1 = v4.x
            delta2 = v4.z

        }else if(v2.z !== 0){

            if(v2.y < 0)

                continue

            faceDir = 2
            delta1 = v4.x
            delta2 = v4.y

        }

        const verticies = []

        let z = 0
        
        //project face into 2d space
        for(let j = 0; j < 4; j++){

            const k = indicies[i+j] * 3
            vect4.set(position[k], position[k+1], position[k+2], 1)

            //project point
            vect4.applyMatrix4(viewMatrix)

            verticies.push({

                x: (vect4.x / vect4.w + 1) / 2,
                y: (vect4.y / vect4.w + 1) / 2 

            })

            z += vect4.z / vect4.w
            
        }

        const depth = z / 4
        const pos = v1
        const col = [color[indicies[i] * 3], color[indicies[i] * 3 + 1], color[indicies[i] * 3 + 2]]

        faces.push({ pos, col, delta1, delta2, faceDir, verticies, depth })

    }
   
    let dx = 0
    let dy = 0

    const processedFaces = []

    if(faces.length > 0 ){

        //depth sorting
        faces.sort( (a, b) => a.depth - b.depth )
        const imgBounds = { min: Object.assign({}, faces[0].verticies[0]), max: Object.assign({}, faces[0].verticies[0]) }
        const grid = new Uint8Array(resolution ** 2)

        for(const face of faces){

            let drawn = false

            const vrts = face.verticies
            const faceBounds = { min: Object.assign({}, vrts[0]), max: Object.assign({}, vrts[0]) }
            
            //compute bounds
            for(const v of vrts){

                if(v.x < faceBounds.min.x)
                    faceBounds.min.x = v.x
                if(v.x > faceBounds.max.x)
                    faceBounds.max.x = v.x
                if(v.y < faceBounds.min.y)
                    faceBounds.min.y = v.y
                if(v.y > faceBounds.max.y)
                    faceBounds.max.y = v.y

                if(v.x < imgBounds.min.x)
                    imgBounds.min.x = v.x
                if(v.x > imgBounds.max.x)
                    imgBounds.max.x = v.x
                if(v.y < imgBounds.min.y)
                    imgBounds.min.y = v.y
                if(v.y > imgBounds.max.y)
                    imgBounds.max.y = v.y

            }

            //scale bounds to image resolution
            faceBounds.min.x = Math.floor(faceBounds.min.x * resolution)
            faceBounds.max.x = Math.floor(faceBounds.max.x * resolution)
            faceBounds.min.y = Math.floor(faceBounds.min.y * resolution)
            faceBounds.max.y = Math.floor(faceBounds.max.y * resolution)

            const dx = faceBounds.max.x - faceBounds.min.x + 1
            const dy = faceBounds.max.y - faceBounds.min.y + 1
            
            const leftWall = new Uint16Array(dy).fill(dx)
            const rightWall = new Uint16Array(dy)

            //swap v3 and v4 to avoid hour glass shape
            let temp = vrts[2]
            vrts[2] = vrts[3]
            vrts[3] = temp
            
            //compute left and right bounds for face
            for(let j = 0; j < 4; j++){

                const v1 = face.verticies[j]
                const v2 = face.verticies[(j+1) % 4]

                let x = Math.floor(v1.x * resolution) - faceBounds.min.x
                let y = Math.floor(v1.y * resolution) - faceBounds.min.y

                const x1 = Math.floor(v2.x * resolution) - faceBounds.min.x
                const y1 = Math.floor(v2.y * resolution) - faceBounds.min.y

                const dx = Math.abs(x1 - x)
                const dy = Math.abs(y1 - y)
                const sx = (x < x1) ? 1 : -1
                const sy = (y < y1) ? 1 : -1

                let err = dx - dy   

                //starting at v1, draw line to v2
                while (true) {

                    if(x < leftWall[y])

                        leftWall[y] = x

                    if(x > rightWall[y])

                        rightWall[y] = x    

                    if (x === x1 && y === y1) 
                
                        break

                    const err2 = 2 * err

                    if (err2 > -dy) {

                        err -= dy
                        x += sx

                    }

                    if (err2 < dx) {

                        err += dx
                        y += sy

                    }

                }

            }

            //draw face
            for(let y = 0; y <= dy; y++)
            for(let x = leftWall[y]; x <= rightWall[y]; x++)

                if(x >= 0 && x < resolution && y >= 0 && y < resolution){

                    const _x = x + faceBounds.min.x
                    const _y = y + faceBounds.min.y

                    const j = _y * resolution + _x

                    if(grid[j] === 0){

                        grid[j] = 1
                        drawn = true

                    }

                }

            
            if(drawn)

                processedFaces.push({

                    pos: face.pos,
                    col: face.col,
                    delta1: face.delta1, 
                    delta2: face.delta2, 
                    faceDir: face.faceDir,

                })

        }

        processedFaces.reverse()

        dx = (1 - imgBounds.max.x + imgBounds.min.x ) / 2 - imgBounds.min.x
        dy = (1 - imgBounds.max.y + imgBounds.min.y ) / 2 - imgBounds.min.y

    }

    //[ res | view matrix (12, only first two rows + last row needed) | dx(1) | dy(1) | pos (3) | dir (1) | delta1 (1) | delta2 (1) | col (3) | ... ]
    const m = viewMatrix.elements
    const preprocessed = [resolution, m[0],m[4],m[8],m[12],m[1],m[5],m[9],m[13],m[3],m[7],m[11],m[15], dx, dy]

    for(const face of processedFaces){

        preprocessed.push(face.pos.x, face.pos.y, face.pos.z)
        preprocessed.push(face.faceDir)
        preprocessed.push(face.delta1, face.delta2)
        preprocessed.push(...face.col)

    }

    return new Float32Array(preprocessed)

}

function createPNG(p, d){

    //[ res | view matrix (12, only first two rows + last row needed) | dx(1) | dy(1) | pos (3) | dir (1) | delta1 (1) | delta2 (1) | col (3) | ... ]

    const r = p[0]
    const vs = [{},{},{},{}]
    const [v1, v2, v3, v4] = vs

    d ||= new Uint8ClampedArray(p[0] ** 2 * 4)

    for(let i = 15; i < p.length; i+=9){
        
        const dir = p[i+3]
        const d1 = p[i+4]
        const d2 = p[i+5]

        //calculate verticies
        v1.x = p[i]
        v1.y = p[i+1]
        v1.z = p[i+2]

        v2.x = v1.x + (dir === 1 || dir === 2 ? d1 : 0)
        v2.y = v1.y + (dir === 0 ? d1 : 0)
        v2.z = v1.z 

        v3.x = v1.x + (dir === 1 || dir === 2 ? d1 : 0)
        v3.y = v1.y + (dir === 0 ? d1 : dir === 2 ? d2 : 0)
        v3.z = v1.z + (dir === 0 || dir === 1 ? d2 : 0)

        v4.x = v1.x
        v4.y = v1.y + (dir === 2 ? d2 : 0)
        v4.z = v1.z + (dir === 0 || dir === 1 ? d2 : 0)

        const proj = new Array(4)

        let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity

        //project verticies and compute bounds
        for(let j = 0; j < 4; j++){

            const v = vs[j]

            const w = v.x * p[9] + v.y * p[10] + v.z * p[11] + p[12]
            const x = ((v.x * p[1] + v.y * p[2] + v.z * p[3] + p[4]) / w + 1) / 2 + p[13]
            const y = 1 - (((v.x * p[5] + v.y * p[6] + v.z * p[7] + p[8]) / w + 1) / 2 + p[14])

            if(x < xMin) 
                xMin = x
            if(x > xMax) 
                xMax = x
            if(y < yMin) 
                yMin = y
            if(y > yMax) 
                yMax = y

            proj[j] = { x, y }
        
        }

        xMin = Math.floor(xMin * r)
        xMax = Math.floor(xMax * r)
        yMin = Math.floor(yMin * r)
        yMax = Math.floor(yMax * r)

        const dx = xMax - xMin + 1
        const dy = yMax - yMin + 1
        const leftWall = new Uint16Array(dy).fill(dx)
        const rightWall = new Uint16Array(dy)

        //get left and right bounds of projected face
        for(let j = 0; j < 4; j++){

            const v1 = proj[j]
            const v2 = proj[(j+1) % 4]

            let x = Math.floor(v1.x * r) - xMin
            let y = Math.floor(v1.y * r) - yMin

            const x1 = Math.floor(v2.x * r) - xMin
            const y1 = Math.floor(v2.y * r) - yMin

            const dx = Math.abs(x1 - x)
            const dy = Math.abs(y1 - y)
            const sx = (x < x1) ? 1 : -1
            const sy = (y < y1) ? 1 : -1

            let err = dx - dy

            //starting at v1, draw line to v2
            while (true) {

                if(x < leftWall[y])

                    leftWall[y] = x

                if(x > rightWall[y])

                    rightWall[y] = x    

                if (x === x1 && y === y1) 
            
                    break

                const err2 = 2 * err

                if (err2 > -dy) {

                    err -= dy
                    x += sx

                }

                if (err2 < dx) {

                    err += dx
                    y += sy

                }

            }

        }
        
        //draw face
        for(let y = 0; y <= dy; y++)
        for(let x = leftWall[y]; x <= rightWall[y]; x++)

            if(x >= 0 && x < r && y >= 0 && y < r){

                const j = ((y + yMin) * r + x + xMin) * 4

                d[j] = p[i+6]
                d[j+1] = p[i+7]
                d[j+2] = p[i+8]
                d[j+3] = 255

            }
        
    }

    return d

}


//converts mesh into svg rendered version of it. Returns svg data encoded in buffer to be processed on server function
function preprocessSVG(mesh){

    const camera = getCamera(mesh.geometry, 1)

    const pos = mesh.geometry.attributes.position.array
    const col = mesh.geometry.attributes.color.array
    const ind = mesh.geometry.index.array

    const viewMatrix = new Matrix4()
    const vArr = [new Vector4(), new Vector4(), new Vector4(), new Vector4()]
    const [v1, v2, v3, v4] = vArr

    const faces = []
    const grid = []
    
    let drawn

    const overDraw = ( p1, p2 ) => {

        let x = p2.x - p1.x, y = p2.y - p1.y
        const det = x * x + y * y
    
        if ( det === 0 ) 
        
            return
    
        const idet = RES / 2500 / Math.sqrt( det )
    
        x *= idet
        y *= idet
    
        p2.x += x
        p2.y += y
        p1.x -= x
        p1.y -= y
    
    }

    const drawLine = (p1, p2, ol) => {

        let [x0,x1,y0,y1] = [p1.x, p2.x, p1.y, p2.y].map(v => Math.floor(v))

        const dx = Math.abs(x1 - x0)
        const dy = Math.abs(y1 - y0)
        const sx = (x0 < x1) ? 1 : -1
        const sy = (y0 < y1) ? 1 : -1
        let err = dx - dy

        while (true) {
            // Set the point on the grid
            if (x0 >= 0 && x0 < RES && y0 >= 0 && y0 < RES){

                if(ol[y0] instanceof Array)

                    ol[y0].push(x0)
        
                else

                    ol[y0] = [x0]

            }
    
            if (x0 === x1 && y0 === y1) 
            
                break
            
            const e2 = 2 * err

            if (e2 > -dy) {

                err -= dy
                x0 += sx

            }

            if (e2 < dx) {

                err += dx
                y0 += sy

            }

        }

    }

    for(let i = 0; i < RES; i++)

        grid.push(new Uint8Array(RES))

    

    viewMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse )

    centerMesh(mesh, viewMatrix)

    for(let i = 0; i < ind.length; i+=6){

        for(let j = 0; j < 4; j++){

            const k = ind[i+j] * 3
            const v = vArr[j]

            //project point
            v.set(pos[k], pos[k+1], pos[k+2], 1).applyMatrix4(viewMatrix)

            //normalize
            v.x /= v.w
            v.y /= v.w
            v.z /= v.w
            
        }

        //back face culling
        if(( v3.x - v1.x ) * ( v2.y - v1.y ) - ( v3.y - v1.y ) * ( v2.x - v1.x ) >= 0)

            continue

        const k = ind[i] * 3

        faces.push({

            d: Math.max(v1.z + v2.z + v3.z + v4.z ), //(v1.z + v2.z + v3.z + v4.z ) / 4,
            c: col[k+2] | col[k+1] << 8 | col[k] << 16,
            v: [new Vector3(v1.x, v1.y, 0), new Vector3(v2.x, v2.y, 0), new Vector3(v4.x, v4.y, 0), new Vector3(v3.x, v3.y, 0)].map(v => {

                v.x = (v.x + 1) / 2 * RES
                v.y = (1 - (v.y + 1) / 2) * RES

                return v

            })

        })

    }

    faces.sort( (a, b) =>  b.d - a.d )
    

    // //remove fully covered faces
    for(let i = faces.length - 1; i >= 0; i--){
        
        const [p1, p2, p3, p4] = faces[i].v.map( v => v.clone())
        const ol = {}

        drawn = false

        drawLine(p1,p2,ol)
        drawLine(p2,p3,ol)
        drawLine(p3,p4,ol)
        drawLine(p4,p1,ol)

        //fill in poly
        for(const _y in ol){

            const y = parseInt(_y)
        
            if(y < 0 || y >= RES)

                continue

            const xVals = ol[y].sort((a, b) => a - b)

            let x0 = xVals[0], x1 = xVals[xVals.length - 1]

            x0 = x0 < 0 ? 0 : x0 >= RES ? RES - 1 : x0
            x1 = x1 < 0 ? 0 : x1 >= RES ? RES - 1 : x1

            for(let x = x0; x <= x1; x++)
                
                if(grid[y][x] === 0){

                    grid[y][x] = 1
                    drawn = true

                }

        }

        if(!drawn){

            faces.splice(i,1)

        }

    }


    //overdraw
    for(let i = 0; i < faces.length; i++){

        const [p1, p2, p3, p4] = faces[i].v
        
        overDraw(p1,p2)
        overDraw(p2,p3)
        overDraw(p3,p4)
        overDraw(p4,p1)

    }


    const dat = new Float32Array(faces.length * 9)

    for(let i = 0, j; i < faces.length; i++){

        const v = faces[i].v

        j = i * 9

        dat[j] = faces[i].c
        dat[j+1] = v[0].x
        dat[j+2] = v[0].y
        dat[j+3] = v[1].x
        dat[j+4] = v[1].y
        dat[j+5] = v[2].x
        dat[j+6] = v[2].y
        dat[j+7] = v[3].x
        dat[j+8] = v[3].y

    }

    return dat

}

function createSVG( d ){

    let svg = `<?xml version="1.0" encoding="utf-8"?><svg width="${RES}" height="${RES}" viewBox="0 0 ${RES} ${RES}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`

    for(let i = 0; i < d.length; i+=9){

        let hex = d[i].toString(16)

        hex = hex.length < 6 ? "0" + hex : hex

        svg += `<path fill="#${hex}" d="M ${d[i+1].toFixed(PRECISION)} ${d[i+2].toFixed(PRECISION)}`

        for(let j = 1; j < 4; j++)

            svg += `L ${d[i + j * 2 + 1].toFixed(PRECISION)} ${d[i + j * 2 + 2].toFixed(PRECISION)}`

        svg += `Z"/>`
        
    }

    return svg + "</svg>"

}

export{ buildImageUrl, preprocessPNG, createPNG, preprocessSVG, createSVG }