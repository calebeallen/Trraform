
import { BufferAttribute, BufferGeometry, Float32BufferAttribute, LineSegments, Mesh, MeshBasicMaterial, Vector3 } from "three"
import { I2P, P2I, getFaceIndex, topFace, bottomFace, frontFace, backFace, rightFace, leftFace, getVertexIndicies, disposeMesh, expand, condense } from "$lib/common/utils" 
import { ColorLibrary } from "$lib/common/colorLibrary"
import { PLOT_COUNT } from "$lib/common/constants"
import { PLOTS_PLACED, REFS, SELECTED } from "$lib/editor/store"
import { GridGeometry } from "$lib/editor/geometries/gridGeometry"
import { COLOR_INDEX } from "./store"

const basicMaterial = new MeshBasicMaterial({ vertexColors: true })
const dx = [0,0,0,0,-1,1]
const dy = [-1,1,0,0,0,0]
const dz = [0,0,-1,1,0,0]
const dx1 = [0,0,0,0,0,1]
const dy1 = [0,1,0,0,0,0]
const dz1 = [0,0,0,1,0,0]

export default class Build {

    constructor(condensed){

        PLOTS_PLACED.set(new Array(PLOT_COUNT).fill(false))

        this.needsUpate = []
        this.plots = []
        this.plotIndicies = new Array(PLOT_COUNT).fill(-1)
        this.selectedCount = 0

        const plotGeom = new GridGeometry(2,1)
        const plotMat = new MeshBasicMaterial({ color: 0xffffff })

        plotGeom.rotateX(45)

        for(let i = 0; i < PLOT_COUNT; i++){

            const plot = new LineSegments(plotGeom, plotMat)
            
            plot.scale.set(0.3,0.3,0.3)

            this.plots.push(plot)

        }

        const transMat = new MeshBasicMaterial( { vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false } )

        const s = REFS.buildSize
        const faceCount = (s ** 2 * (s + 1)) * 3
        const buflen = faceCount * 12
        const indLen = faceCount * 6
        const colorBuffer = new Uint8Array(buflen)
        const indexBuffer = new Uint32Array(buflen)

        for(let i = 0, j = 0; i < indLen; i+=6, j+=4){

            const arr = getVertexIndicies(j)
            indexBuffer.set(arr, i)

        }

        this.opaque = new BufferGeometry()
        this.opaque.setAttribute( 'position', new Float32BufferAttribute( buflen, 3 ) )
        this.opaque.setAttribute( 'color', new BufferAttribute( colorBuffer, 3 ) )
        this.opaque.setIndex( new BufferAttribute( indexBuffer, 1 ) )
        this.opaque.attributes.color.normalized = true

        this.transparent = new BufferGeometry()
        this.transparent.setAttribute( 'position', new Float32BufferAttribute( buflen, 3 ) )
        this.transparent.setAttribute( 'color', new BufferAttribute( colorBuffer, 3 ) )
        this.transparent.setIndex( new BufferAttribute( indexBuffer, 1 ) )
        this.transparent.attributes.color.normalized = true

        this.opaqueMesh = new Mesh( this.opaque, basicMaterial ) 
        this.transMesh = new Mesh( this.transparent, transMat )
    
        this.opaqueMesh.frustumCulled = false
        this.opaqueMesh.name = "opaque-mesh"

        this.transMesh.frustumCulled = false
        this.transMesh.name = "transparent-mesh"

        this.saveTimeout = null

        const s3 = s ** 3

        this.blocks = new Array(s3)

        for(let i = 0; i < s3; i++)

            this.blocks[i] = [0,0]

        if(condensed){

            const expanded = expand(condensed)

            for(let i = 0; i < expanded.length; i++)

                if(expanded[i] !== 0)

                    this.modifyByIndex(i, expanded[i])

            this.update()

        }

        REFS.scene1.add( this.opaqueMesh )
        REFS.scene1.add( this.transMesh )

    }

    dispose(){

        REFS.scene1.remove(this.opaqueMesh)
        REFS.scene1.remove(this.transMesh)

        this.plots.forEach(plot => {

            REFS.scene1.remove(plot)
            disposeMesh(plot)

        })

        disposeMesh(this.opaqueMesh)
        disposeMesh(this.transMesh)

    }

    updatePlotRotation(){

        for(let i = 0; i < this.plots.length; i++)

            this.plots[i].quaternion.copy(REFS.camera.quaternion)

    }

    modify( pos, col = 0, sel = false ){

        const ind = P2I(pos, REFS.buildSize)

        if(ind === null)

            return

        this.modifyByIndex(ind, col, sel)

    }

    modifyByIndex( ind, col = 0, sel = false ){

        const blk = this.blocks[ind]

        if(blk[1] === 1)

            this.selectedCount --

        if(sel)

            this.selectedCount ++

        //if plot already placed here
        if(blk[0] <= PLOT_COUNT && blk[0] !== 0){

            const plotInd = blk[0] - 1

            REFS.scene1.remove(this.plots[plotInd])

            this.plotIndicies[plotInd] = -1

            //set plot in array to null
            PLOTS_PLACED.update( arr => {
                
                arr[plotInd] = false
            
                return arr
                
            })

        }

        //if plot being placed
        if(col < 25 && col !== 0){

            const plotInd = col - 1

            PLOTS_PLACED.update( arr => {

                //if plot already placed somewhere, remove it (no need to update)
                if(this.plotIndicies[plotInd] > -1)

                    this.blocks[this.plotIndicies[plotInd]] = [0,0]

                this.plotIndicies[plotInd] = ind

                //set to new index
                arr[plotInd] = true

                //update position of plot
                const plot = this.plots[plotInd]

                plot.position.copy(new Vector3(...I2P(ind, REFS.buildSize))).addScalar(0.5)

                REFS.scene1.add(plot)

                // for(let i = 0; i < arr.length; i++)

                //     if(arr[i] === false){

                //         COLOR_INDEX.set(i + 1)
                        
                //         break

                //     }


                return arr

            })

        }

        this.needsUpate.push([ind, blk[1]])

        blk[0] = col
        blk[1] = col < 25 ? 0 : sel ? 1 : 2

    }

    update(){

        let minOpaqueIndex = Infinity, maxOpaqueIndex = 0, minTransparentIndex = Infinity, maxTransparentIndex = 0

        const setIndexBounds = (index, transparent = false) => {

            if (transparent) {
                if(index < minTransparentIndex)
                    minTransparentIndex = index
                if(index > maxTransparentIndex)
                    maxTransparentIndex = index
            } else {
                if(index < minOpaqueIndex)
                    minOpaqueIndex = index
                if(index > maxOpaqueIndex)
                    maxOpaqueIndex = index
            }

        }

        SELECTED.set(this.selectedCount > 0)

        const s = REFS.buildSize
        const v = new Vector3()

        for(const [updateIndex, currentType] of this.needsUpate){

            const pos = I2P( updateIndex, s )
            const block = this.blocks[updateIndex]
            const [x,y,z] = pos

            for(let i = 0; i < 6; i++){

                let color, face = null, alpha

                // compute new face
                v.set(x + dx[i], y + dy[i], z + dz[i])

                const compareIndex = P2I(v, s)
                const compareBlock = compareIndex === null ? [0,0] : this.blocks[compareIndex]

                if(block[1] !== compareBlock[1]){

                    //det = true if compare block has opacity less than block 
                    const compare = compareBlock[1] < block[1]
                    alpha = Math.max(compareBlock[1], block[1])
                    color = ColorLibrary.applyLight( compare ? block[0] : compareBlock[0], Math.floor( i / 2 ) )

                    switch(i){

                        case 0: 

                            face = compare ? bottomFace( x, y, z ) : topFace( x, y, z )
                            break

                        case 1:
                    
                            face = compare ? topFace( x, y + 1, z) : bottomFace( x, y + 1, z )
                            break

                        case 2:
                
                            face = compare ? backFace( x, y, z ) : frontFace( x, y, z )
                            break
                        
                        case 3:

                            face = compare ? frontFace( x, y, z + 1 ) : backFace( x, y, z + 1 )
                            break
            
                        case 4: 

                            face = compare ? leftFace( x, y, z ) : rightFace( x, y, z )
                            break

                        case 5:

                            face = compare ? rightFace( x + 1, y, z ) : leftFace( x + 1, y, z )
                            break

                    }

                }

                const [x1,y1,z1] = [(x + dx1[i]), (y + dy1[i]), (z + dz1[i])]
                const bufferIndex = getFaceIndex(x1, y1, z1, s, Math.floor(i / 2))
                
                //delete transparent face if there was (either previous face was transparent, or face of compared block was transparent)
                if( currentType === 1 || compareBlock[1] === 1 ){

                    setIndexBounds(bufferIndex, true)

                    for(let k = 0; k < 12; k++)

                        this.transparent.attributes.position.array[bufferIndex + k] = this.transparent.attributes.color.array[bufferIndex + k] = 0
                    
                }

                //delete opaque face if there was one (either previous face was opaque, or face of compared block was opaque)
                if( currentType === 2 || compareBlock[1] === 2 ){

                    setIndexBounds(bufferIndex)

                    for(let k = 0; k < 12; k++)

                        this.opaque.attributes.position.array[bufferIndex + k] = this.opaque.attributes.color.array[bufferIndex + k] = 0
                    
                }

                //if a new face needs to be added, add it. Otherwise, face remains deleted
                if(face){

                    //if face is opaque
                    if(alpha == 2){

                        setIndexBounds(bufferIndex)

                        for(let k = 0; k < 12; k++){

                            this.opaque.attributes.position.array[bufferIndex + k] = face[k]
                            this.opaque.attributes.color.array[bufferIndex + k] = color[k % 3]

                        }

                    //if face is transparent
                    } else {

                        setIndexBounds(bufferIndex, true)
                        
                        for(let k = 0; k < 12; k++){

                            this.transparent.attributes.position.array[bufferIndex + k] = face[k]
                            this.transparent.attributes.color.array[bufferIndex + k] = color[k % 3]

                        }

                    }

                }

            }
            
        }

        if(minOpaqueIndex != Infinity){

            const start = minOpaqueIndex
            const count = maxOpaqueIndex - minOpaqueIndex + 12

            this.opaque.attributes.position.clearUpdateRanges()
            this.opaque.attributes.position.addUpdateRange(start, count)
            this.opaque.attributes.position.needsUpdate = true
            this.opaque.attributes.color.clearUpdateRanges()
            this.opaque.attributes.color.addUpdateRange(start, count)
            this.opaque.attributes.color.needsUpdate = true

        }

        if(minTransparentIndex != Infinity){

            const start = minTransparentIndex
            const count = maxTransparentIndex - minTransparentIndex + 12

            this.transparent.attributes.position.clearUpdateRanges()
            this.transparent.attributes.position.addUpdateRange(start, count)
            this.transparent.attributes.position.needsUpdate = true
            this.transparent.attributes.color.clearUpdateRanges()
            this.transparent.attributes.color.addUpdateRange(start, count)
            this.transparent.attributes.color.needsUpdate = true

        }

        this.needsUpate = []

        if(this.selectedCount <= 0)
            //if nothing selected, remove transparent mesh
            REFS.scene1.remove(this.transMesh)
        else 
            REFS.scene1.add(this.transMesh)
        

        clearTimeout(this.saveTimeout)

        this.saveTimeout = setTimeout( () => localStorage.setItem("editorSave", condense(this.blocks.map(block => block[0]), REFS.buildSize)), 1500)

    }

}