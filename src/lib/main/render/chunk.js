
import { BoxGeometry, BufferAttribute, BufferGeometry, Color, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, Quaternion, Sphere, Vector3 } from "three"
import Task from "../task/task"
import { root, material } from "./engine"
import { refs } from "../store"

const boxGeom = new BoxGeometry(1,1,1)
const boxMat = new MeshBasicMaterial({color: 0xffffff})

class BaseChunk {

    constructor(layer, parent, mapIdx){

        this.id = `l${layer}_${mapIdx.toString(16)}`
        this.parent = parent
        this.childrenLoaded = new Set()
        this.sections = null

        this.mesh = null
        this.isLoaded = false
        this._loading = null
        this.faceCount = 0
        
        const childIndices = root.chunkMaps[layer][mapIdx]

        if(layer == 0) {
            
            for(const childIdx of childIndices)
                new BaseChunk(layer + 1, this, childIdx)

        } else if (layer == 1) { // create depth 0 standard chunks (base case)

            for(const childIdx of childIndices){

                const chunk = new Chunk(`l${layer + 1}_${childIdx.toString(16)}`, this)
                const plotIndices = root.chunkMaps[2][childIdx]

                // populate chunks with plots
                for(let i = 0; i < plotIndices.length; i++){
                    const plot = root.plot.children[plotIndices[i]]
                    chunk.plots.push(plot)
                    plot.chunk = chunk
                }

            }

        }

    }

    // for child plot to call
    cullSection(childChunk, cull = true){

        const section = this.sections[childChunk.id]

        if(!section)
            return
        
        const { range, matrices } = section

        if(cull) {

            const m4 = new Matrix4()
            m4.scale(new Vector3())

            for(let i = range[0]; i < range[1]; i++)
                this.mesh.setMatrixAt(i, m4)

            root.renderedFaces -= (range[0] - range[1]) * 12

        } else {
            
            for(let i = range[0], j = 0; i < range[1]; i++, j++)

                this.mesh.setMatrixAt(i, matrices[j])

            root.renderedFaces += (range[0] - range[1]) * 12

        }

        this.mesh.instanceMatrix.needsUpdate = true

    }

    load(){

        if(this._loading === null)

            this._loading = new Promise(async resolve => {

                // load parent chain and unload low detail section
                if(this.parent !== null)
                    await this.parent.load()

                // // get mesh data from r2 for this.id
                // // create child id => section vertex ranges map
                const task = new Task("get_chunk", { chunkId: this.id })
                const data = await task.run()

                let totalBoxes = 0
                for(const id in data){

                    const len = data[id].length / 36
                    totalBoxes += len
            
                }
                
                const mesh = new InstancedMesh(boxGeom, boxMat, totalBoxes)    
                const quat = new Quaternion()
                const color = new Color()
                const sections = {}

                let i = 0
                for(const id in data){

                    const f32 = new Float32Array(data[id].buffer)
                    const range = [i, i + f32.length / 9]
                    const matrices = []

                    for(let j = 0; j < f32.length; j += 9, i++){

                        const m4 = new Matrix4()
                        const min = new Vector3(f32[j], f32[j+1], f32[j+2])
                        const max = new Vector3(f32[j+3], f32[j+4], f32[j+5])
                        const randOffset = new Vector3().random().divideScalar(100) //to prevent z fighting
                        const center = min.clone().add(max).divideScalar(2).add(randOffset)
                        const scale = max.clone().sub(min)

                        m4.compose(center, quat, scale)
                        mesh.setMatrixAt(i, m4.clone())

                        color.setRGB(f32[j+6],f32[j+7],f32[j+8])
                        mesh.setColorAt(i, color)
                        matrices.push(m4)

                    }

                    sections[id] = { range, matrices }

                }

                this.faceCount = totalBoxes * 12
                root.renderedFaces += this.faceCount
                
                this.sections = sections
                this.mesh = mesh
                refs.scene.add(mesh)
                if(this.parent !== null)
                    this.parent.cullSection(this, true)

                this.isLoaded = true
                resolve()

            })

        return this._loading

    }

    unload(){

        if(!this.isLoaded)
            return true

        if(this.childrenLoaded.size > 0)
            return false

        if(this.parent !== null){
            this.parent.childrenLoaded.delete(this.id)
            if(this.parent instanceof BaseChunk)
                this.parent.cullSection(this, false)
        }

        refs.scene.remove(this.mesh)
        root.renderedFaces -= this.faceCount
        this.mesh = null
        this._loading = null
        this.isLoaded = false
        this.faceCount = 0
        this.sections = null

        if(this.parent !== null && this.parent.id !== "l0_0")
            this.parent.unload()

        return true

    }

}

class Chunk {

    constructor(id, parent){

        this.id = id
        this.parent = parent
    
        this.mesh = null
        this.plots = []
        this.childrenLoaded = new Set()
        this._loading = null

    }

    load(){

        if(this._loading === null)

            this._loading = new Promise(async resolve => {

                await this.parent.load()

                // get chunk data from r2
                const getTask = new Task("get_chunk", { chunkId: this.id }) 
                const chunkData = await getTask.run()

                // process plots in parallel
                await Promise.all(this.plots.map(plot => {
                    const plotData = chunkData[plot.id.string()] ?? null
                    return plot.load(plotData)
                }))

                const packaged = { position : [], color : [], index: [], min : [], max : [], scale : [] }
                
                // package data to be merged
                for(const plot of this.plots){

                    if(plot.geometryData == null)
                        continue

                    const geomData = plot.geometryData

                    packaged.position.push(geomData.position)
                    packaged.color.push(geomData.color)
                    packaged.index.push(geomData.index)

                    //compute bounds relative to world
                    const scale = plot.blockSize
                    const center = new Vector3(...geomData.center)
                    const centerDiff = new Vector3(...geomData.dp)
                    const min = center.clone().sub(centerDiff)
                    const max = center.clone().add(centerDiff)

                    min.multiplyScalar(scale).add(plot.pos)
                    max.multiplyScalar(scale).add(plot.pos)

                    packaged.min.push(min.toArray())
                    packaged.max.push(max.toArray())
                    packaged.scale.push(scale)

                }

                // merge build geometries
                const mergeTask = new Task( "merge_geometries", { geometryData : packaged } )
                const merged = await mergeTask.run()

                this.faceCount = merged.index.length / 3
                root.renderedFaces += this.faceCount

                // create mesh
                const geometry = new BufferGeometry()
                geometry.setAttribute("position", new BufferAttribute(merged.position, 3))
                geometry.setAttribute("color", new BufferAttribute(merged.color, 3))
                geometry.setIndex(new BufferAttribute(merged.index, 1))
                geometry.attributes.color.normalized = true
                geometry.attributes.position.onUpload(() => geometry.attributes.position.array = null)
                geometry.attributes.color.onUpload(() => geometry.attributes.color.array = null)
                geometry.index.onUpload(() => geometry.index.array = null)
                geometry.boundingSphere = new Sphere(new Vector3(), Math.hypot(...merged.dp))

                const mesh = new Mesh(geometry, material)
                const pos = new Vector3().fromArray(merged.center)
                const s = merged.scale
                mesh.position.copy(pos)
                mesh.scale.set(s,s,s)
                mesh.updateMatrix()
                mesh.matrixWorld.copy(mesh.matrix)
                mesh.matrixAutoUpdate = mesh.matrixWorldAutoUpdate = false

                this.mesh = mesh
                refs.scene.add(mesh)

                this.parent.childrenLoaded.add(this.id)
            
                if(this.parent instanceof BaseChunk)
                    this.parent.cullSection(this, true)

                this.isLoaded = true
                resolve()

            })

        return this._loading

    }

    async unload(){

        if(!this.isLoaded)
            return true

        if(this.childrenLoaded.size > 0)
            return false

        this.parent.childrenLoaded.delete(this.id)

        for(const plot of this.plots)
            await plot.safeClear()

        if(this.parent instanceof BaseChunk)
            this.parent.cullSection(this, false)
        
        refs.scene.remove(this.mesh)
        root.renderedFaces -= this.faceCount

        this.mesh = null
        this._loading = null
        this.isLoaded = false
        this.faceCount = 0

        if(this.parent instanceof BaseChunk)
            this.parent.unload()

        return true

    }

}

export { BaseChunk, Chunk }