
import { root } from "./engine"

class BaseChunk {

    constructor(layer, parent, mapIdx){

        this.id = `L${layer}_${mapIdx}`
        this.parent = parent
        this.children = []
        this.childrenLoaded = new Set()
        this.childIdToSectionRange = null

        this.mesh = null
        this.isLoaded = false
        
        
        const childIndices = root.chunkMaps[layer][mapIdx]

        if(layer == 0) {
            
            for(const childIdx of childIndices)
                this.children.push(new BaseChunk(layer + 1, this, childIdx))

        } else if (layer == 1) { // create depth 0 standard chunks (base case)

            for(const childIdx of childIndices){

                const chunk = new Chunk(`L${layer + 1}_${childIdx}`, this)
                const plotIndices = root.chunkMaps[2][childIdx]

                // populate chunks with plots
                for(let i = 0; i < plotIndices.length; i++){
                    const plot = root.plot.children[plotIndices[i]]
                    chunk.plots.push(plot)
                    plot.chunk = chunk
                }
                
                this.children.push(chunk)

            }

        }

    }

    // for child plot to call
    cullSection(childChunk, cull = true){

        if(cull)
            this.childrenLoaded.add(childChunk.id)
        else
            this.childrenLoaded.remove(childChunk.id)


    }

    // for removing the 
    async load(){

        // load parent chain and unload low detail section
        if(this.parent !== null){
            await this.parent.load()
            this.parent.cullSection(this, true)
        }
        
        // get mesh data from r2 for this.id
        // create child id => section vertex ranges map

        this.isLoaded = true

    }

    unload(){

        if(this.childrenLoaded.size !== 0)
            throw new Error("Cannot upload chunk that has children loaded.")

        // load low detail section again
        if(this.parent !== null)
            this.parent.cullSection(this, false)

        // clear mesh
        // create child id => section vertex ranges map


        this.isLoaded = false

    }

}

class Chunk {

    constructor(id, parent){

        this.id = id
        this.parent = parent
    
        this.mesh = null
        this.children = []
        this.plots = []

    }

    load(){

        if(this.parent)

    }


    unload(){



    }

}

export { BaseChunk, Chunk }