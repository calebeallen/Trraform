import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Group, LinearSRGBColorSpace, Mesh, MeshBasicMaterial, Vector3, Texture, ClampToEdgeWrapping, Matrix3 } from "three"
import { ColorLibrary } from "$lib/common/colorLibrary"
import { PLOT_COUNT } from "$lib/common/constants"
import { CONVERTING, FACES_CONVERTED, REFS, TOTAL_CONVERT } from "$lib/editor/store"
import KdTree from "$lib/editor/structures/kdTree"

const TEXTURE_RES = 256

export default class GLBConverter {

    static workers = []
    static currentWorker = 0

    static colorKdTree = (() => {

        const inds = []

        for(let i = PLOT_COUNT + 1; i < ColorLibrary.colors.length; i++)

            inds.push(i)

        return new KdTree( ColorLibrary.colors.slice(PLOT_COUNT + 1), inds )

    })() 

    static offscreen = null
    static osCtx = null

    constructor(){

        this.chunks = []

        if(GLBConverter.workers.length === 0){

            for(let i = 0; i < navigator.hardwareConcurrency; i++){

                let resolveLoaded

                const worker = new Worker( new URL('./glbWorker', import.meta.url), { type: "module" } )
                const loaded = new Promise( res => resolveLoaded = res )

                worker.onmessage = e => {

                    if(e.data === "loaded")

                        resolveLoaded()

                }

                GLBConverter.workers.push({ worker, loaded })
            
            }

        }
    
        if(GLBConverter.offscreen === null){

            GLBConverter.offscreen = new OffscreenCanvas( TEXTURE_RES, TEXTURE_RES )

            GLBConverter.osCtx = GLBConverter.offscreen.getContext( '2d', { willReadFrequently: true } )

        }

    }

    dispose(){

        this.chunks = null

    }

    loadImagePlane( file ){

        TOTAL_CONVERT.set(0)

        return new Promise(( resolve, reject ) => {

            const image = new Image()
            image.src = URL.createObjectURL(file)

            image.onload = () => {
                //extract and resize textures
                const { width, height } = image
                const osCanvas = new OffscreenCanvas( width, height )
                const osCtx = osCanvas.getContext( '2d', { willReadFrequently: true } )
                osCtx.drawImage( image, 0, 0, width, height )

                 // Scale mesh to match image aspect ratio
                 const aspectRatio = width / height

                // Create plane geometry with UV coordinates
                const geometry = new BufferGeometry()
                const vertices = new Float32Array([
                    1 * aspectRatio, -1, 0,  // top right
                    -1 * aspectRatio, -1, 0,  // top left
                    -1 * aspectRatio,  1, 0,  // bottom left
                     1 * aspectRatio,  1, 0,  // bottom right
                ].map(x => x * REFS.buildSize / 2))
                const uvs = new Float32Array([
                    0, 0,  // bottom left
                    1, 0,  // bottom right
                    1, 1,  // top right
                    0, 1,   // top left
                ])
                const indices = new Uint16Array([0, 1, 2, 0, 2, 3])

                geometry.setAttribute('position', new BufferAttribute(vertices, 3))
                geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
                geometry.setIndex(new BufferAttribute(indices, 1))

                // Create texture
                const texture = new Texture(image)
                texture.needsUpdate = true

                // Create material with the texture
                const material = new MeshBasicMaterial({
                    map: texture,
                    side: DoubleSide,
                    transparent: true
                })

                // Create mesh and add to group
                const mesh = new Mesh(geometry, material)
                

                const uvMatrix = new Matrix3()
                uvMatrix[0] = -1
                uvMatrix[4] = -1
                uvMatrix[8] = -1

                const imgData = osCtx.getImageData(0, 0, width, height)
                const pixels = new Uint8ClampedArray(imgData.data)
                for (let y = 0; y < height/2; y++) {
                    for (let x = 0; x < width; x++) {
                        const topIdx = (y * width + x) * 4
                        const bottomIdx = ((height - 1 - y) * width + x) * 4
                        for (let i = 0; i < 4; i++) {
                            const temp = pixels[topIdx + i]
                            pixels[topIdx + i] = pixels[bottomIdx + i]
                            pixels[bottomIdx + i] = temp
                        }
                    }
                }

                //create chunk with all     necessary data
                this.chunks.push({
                    type: 'texture',
                    position: copyTypedArray(vertices),
                    indicies: copyTypedArray(indices),
                    uv: copyTypedArray(uvs),
                    texture: pixels,
                    width: width,
                    height: height,
                    wrapS: ClampToEdgeWrapping,
                    wrapT: ClampToEdgeWrapping,
                    uvMatrix: Array.from(uvMatrix.elements)
                })

                TOTAL_CONVERT.update(x => x + indices.length / 3)

                this.mesh = mesh
                this.max = new Vector3(REFS.buildSize / 2, REFS.buildSize / 2, REFS.buildSize / 2)
                this.min = this.max.clone().multiplyScalar(-1)
                resolve()
            }

        })

    }

    load( file ){

        return new Promise(( resolve, reject ) => {
            
            this.mesh = new Group()
            this.min = new Vector3( Infinity, Infinity, Infinity )
            this.max = this.min.clone().multiplyScalar(-1)
            TOTAL_CONVERT.set(0)

            const processMesh = mesh => {

                const geom = mesh.geometry

                //create new geometry to get rid of unwanted properties of old one
                const newGeom = new BufferGeometry()

                let material

                mesh.updateMatrixWorld()

                //if geometry exist (ie, geom is mesh and not group or object3D), create chunk
                if(geom !== undefined){

                    //because most geometry attributes share buffers (between meshes), they need to be copied to allow for parallel processing
                    //original buffers can be scrapped once copies made
                    const indicies = geom.index === undefined ? null : copyTypedArray(geom.index.array)
                    const position = copyTypedArray(geom.attributes.position.array)
                    const color = geom.attributes.color === undefined ? null : copyTypedArray(geom.attributes.color.array)

                    //apply parent transformation to verticies
                    
                    for(let i = 0; i < position.length; i += 3){

                        const v = new Vector3()
                        v.set( position[i], position[i + 1], position[i + 2] )
                        v.applyMatrix4( mesh.matrixWorld )
                        this.max.max(v)
                        this.min.min(v)

                        position[i] = v.x
                        position[i + 1] = v.y
                        position[i + 2] = v.z

                    }

                    const chunk = { position }

                    newGeom.setAttribute( "position", new BufferAttribute( position, 3 ) )

                    if(indicies){

                        //add copied indicies to chunk
                        chunk.indicies = indicies

                        newGeom.setIndex( geom.index )

                        TOTAL_CONVERT.update(x => x + indicies.length / 3)

                    } else

                        TOTAL_CONVERT.update(x => x + position.length / 9)

                    const map = mesh.material.map
                    
                    //categorize chunk
                    if (map) {

                        const uvid = `uv${map.channel || ""}`
                        const uv = geom.attributes[uvid]
                        const uvArr = copyTypedArray( geom.attributes[uvid].array)

                        const { width, height } = map.source.data
                        map.colorSpace = LinearSRGBColorSpace
                        map.updateMatrix()

                        //extract and resize textures
                        const osCanvas = new OffscreenCanvas( width, height )
                        const osCtx = osCanvas.getContext( '2d', { willReadFrequently: true } )
                        osCtx.drawImage( map.source.data, 0, 0, width, height )
                        
                        chunk.type = 'texture'
                        chunk.uv = uvArr
                        chunk.uvMatrix = Array.from(map.matrix.elements)
                        chunk.texture = osCtx.getImageData( 0, 0, width, height ).data
                        chunk.wrapS = map.wrapS
                        chunk.wrapT = map.wrapT
                        chunk.width = width
                        chunk.height = height

                        newGeom.setAttribute( uvid, uv )

                        material = new MeshBasicMaterial( { map, side: DoubleSide, transparent: true } )

                    } else if (mesh.material.color) {

                        chunk.type = 'material'
                        chunk.color = mesh.material.color

                        material = new MeshBasicMaterial( { color: mesh.material.color, side: DoubleSide, transparent: true } )

                    } else if (color) {

                        chunk.type = 'vrt-colors'
                        chunk.color = color

                        newGeom.setAttribute( "color", geom.attributes.color )

                        material = new MeshBasicMaterial( { vertexColors: true, side: DoubleSide, transparent: true  } )

                    } else {

                        chunk.type = 'material'
                        chunk.color = new Color(0xffffff)

                        material = new MeshBasicMaterial( { color: chunk.color, side: DoubleSide, transparent: true  } )

                    }

                    this.chunks.push(chunk)

                    //create mesh from modified attributes
                    this.mesh.add( new Mesh( newGeom, material ) )

                }

                for(let i = 0; i < mesh.children.length; i++)

                    processMesh( mesh.children[i] )

            }

            //create chunks
            const fr = new FileReader()
            const loader = new GLTFLoader()

            fr.onload = async () => {

                const { scene } = await loader.parseAsync(fr.result)

                processMesh(scene)

                const dimensions = this.max.clone().sub(this.min)
                const scale = REFS.buildSize / Math.max(dimensions.x, dimensions.y, dimensions.z)
                const offset = dimensions.divideScalar(2).add(this.min)

                for( let i = 0; i < this.chunks.length; i++ ){

                    const p = this.chunks[i].position

                    //center mesh around origin, apply default scale
                    for( let j = 0; j < p.length; j += 3 ){

                        p[j] = ( p[j] - offset.x ) * scale
                        p[j + 1] = ( p[j + 1] - offset.y ) * scale
                        p[j + 2] = ( p[j + 2] - offset.z ) * scale
                
                    }

                }

                //clone position buffers after all tranformations applied
                for(let i = 0; i < this.mesh.children.length; i++){

                    const child = this.mesh.children[i]

                    child.geometry.setAttribute( "position", new BufferAttribute( copyTypedArray(child.geometry.attributes.position.array), 3 ) )

                }

                resolve()

            }

            fr.readAsArrayBuffer(file)

        })
        
    }

    /* Converts vertex and texture data into blocks. Returns an array of each block's position and color */
    convert( matrix4 ){

        return new Promise( async resolve => {

            CONVERTING.set(true)
            FACES_CONVERTED.set(0)

            let completedProcesses = 0

            const build = {}

            for(const { worker, loaded } of GLBConverter.workers){

                await loaded

                worker.onmessage = (e) => {

                    const p = e.data.position
                    const c = e.data.color

                    const chunk = e.data.chunk

                    //return buffers back to their chunks for the next process
                    this.chunks[chunk.index].position = chunk.position

                    if(chunk.indicies)

                        this.chunks[chunk.index].indicies = chunk.indicies

                    if(chunk.type === "texture"){

                        this.chunks[chunk.index].uv = chunk.uv
                        this.chunks[chunk.index].texture = chunk.texture
                        
                    }else if(chunk.type === "vrt-colors")

                        this.chunks[chunk.index].color = chunk.color


                    //add processed blocks to build
                    for(let i = 0; i < p.length; i+=3){

                        const str = `${p[i]}.${p[i+1]}.${p[i+2]}`

                        const block = build[str]

                        if(block){

                            block.col[0] += c[i]
                            block.col[1] += c[i+1]
                            block.col[2] += c[i+2]
                            block.n++

                        }else{

                            build[str] = {

                                col: [c[i], c[i+1], c[i+2]],
                                n: 1

                            }

                        }

                    }

                    completedProcesses++

                    if( completedProcesses === this.chunks.length ){

                        const blocks = []

                        for(const key in build){

                            const col = build[key].col
                            const n = build[key].n

                            //take average of colors at this block
                            col[0] /= n
                            col[1] /= n
                            col[2] /= n

                            blocks.push([GLBConverter.colorKdTree.findClosest(col).data, new Vector3(...key.split(".").map(x => parseFloat(x)))])

                        }

                        CONVERTING.set(false)

                        resolve(blocks)

                    }

                    //update ui
                    FACES_CONVERTED.update( x => x + e.data.faceCount )

                }

            }

            for(let i = 0; i < this.chunks.length; i++){

                const chunk = this.chunks[i]

                chunk.matrix = matrix4
                chunk.index = i

                //build transferable array
                const transferable = [ chunk.position.buffer ]

                if(chunk.indicies)

                    transferable.push(chunk.indicies.buffer)

                if(chunk.type === "texture"){

                    transferable.push( chunk.texture.buffer, chunk.uv.buffer )

                }else if(chunk.type === "vrt-colors")

                    transferable.push( chunk.color.buffer )

                GLBConverter.workers[GLBConverter.currentWorker].worker.postMessage( chunk, transferable )

                GLBConverter.currentWorker ++
                GLBConverter.currentWorker %= GLBConverter.workers.length
                
            }

        })

    }

}

function copyTypedArray( typedArray ){

    const buffer = new ArrayBuffer(typedArray.byteLength)

    let copy

    if(typedArray instanceof Uint8Array)

        copy = new Uint8Array(buffer)

    else if(typedArray instanceof Uint16Array)

        copy = new Uint16Array(buffer)

    else if(typedArray instanceof Uint32Array)

        copy = new Uint32Array(buffer)

    else if(typedArray instanceof Float32Array)

        copy = new Float32Array(buffer)

    else if(typedArray instanceof Float64Array)

        copy = new Float64Array(buffer)

    else if(typedArray instanceof Uint8ClampedArray)

        copy = new Uint8ClampedArray(buffer)

    copy.set(typedArray)

    return copy

}