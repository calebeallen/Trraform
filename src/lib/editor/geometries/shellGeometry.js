
import { BufferAttribute, BufferGeometry, Float32BufferAttribute, Uint8BufferAttribute } from "three"
import { backFace, bottomFace, frontFace, getVertexIndicies, leftFace, rightFace, topFace, vertexIndiciesToUintArr } from "$lib/common/utils";
import { ColorLibrary } from "$lib/common/colorLibrary"

export default class ShellGeometry extends BufferGeometry {

    constructor(blocks){

        super()

        const indicies = [], position = [], color = []

        let col
        let indCounter = 0

        for(const key in blocks){

            const a = key.split('.').map( i => parseInt(i) )
            const colorIndex = blocks[key]
                
            if(blocks[`${a[0]}.${a[1] + 1}.${a[2]}`] === undefined){

                position.push( ...topFace( a[0], a[1] + 1, a[2]) )
                indicies.push( ...getVertexIndicies(indCounter))
                indCounter += 4

                col = ColorLibrary.applyLight(colorIndex, 0)
                
                for(let i = 0; i < 4; i++)

                    color.push(...col)

            }
    
            if(blocks[`${a[0]}.${a[1] - 1}.${a[2]}`] === undefined){

                position.push( ...bottomFace( a[0], a[1], a[2] ) )
                indicies.push( ...getVertexIndicies(indCounter))
                indCounter += 4

                col = ColorLibrary.applyLight(colorIndex, 0)
                
                for(let i = 0; i < 4; i++)

                    color.push(...col)

            }

            if(blocks[`${a[0]}.${a[1]}.${a[2] + 1}`] === undefined){

                position.push( ...frontFace( a[0], a[1], a[2] + 1 ) )
                indicies.push( ...getVertexIndicies(indCounter))
                indCounter += 4

                col = ColorLibrary.applyLight(colorIndex, 1)
                
                for(let i = 0; i < 4; i++)

                    color.push(...col)

            }

            if(blocks[`${a[0]}.${a[1]}.${a[2] - 1}`] === undefined){
    
                position.push( ...backFace( a[0], a[1], a[2] ) )
                indicies.push( ...getVertexIndicies(indCounter))
                indCounter += 4

                col = ColorLibrary.applyLight(colorIndex, 1)
                
                for(let i = 0; i < 4; i++)

                    color.push(...col)

            }

            if(blocks[`${a[0] + 1}.${a[1]}.${a[2]}`] === undefined){

                position.push( ...rightFace( a[0] + 1, a[1], a[2] ) )
                indicies.push( ...getVertexIndicies(indCounter))
                indCounter += 4

                col = ColorLibrary.applyLight(colorIndex, 2)
                
                for(let i = 0; i < 4; i++)

                    color.push(...col)

            }

            if(blocks[`${a[0] - 1}.${a[1]}.${a[2]}`] === undefined){

                position.push( ...leftFace( a[0], a[1], a[2] ) )
                indicies.push( ...getVertexIndicies(indCounter))
                indCounter += 4

                col = ColorLibrary.applyLight(colorIndex, 2)
                
                for(let i = 0; i < 4; i++)

                    color.push(...col)

            }

        }

        this.setAttribute("position", new Float32BufferAttribute( position, 3 ))
        this.setAttribute("color", new Uint8BufferAttribute( color, 3 ))
        this.setIndex(new BufferAttribute(vertexIndiciesToUintArr(indicies), 1))
        this.attributes.color.normalized = true

    }

}