
import { Box3, Raycaster, Vector2, Vector3 } from "three"
import { getFaceIndex } from "$lib/common/utils"
import { GRID_Y_POS } from "$lib/editor/store"
import { get } from "svelte/store"

const dx = [0,0,0,0,-1,1]
const dy = [-1,1,0,0,0,0]
const dz = [0,0,-1,1,0,0]
const dx1 = [0,0,0,0,0,1]
const dy1 = [0,1,0,0,0,0]
const dz1 = [0,0,0,1,0,0]


export default class Octree {

    constructor( size, posAttr, indAttr, camera ){

        this.size = size
        this.posBuffer = posAttr
        this.indBuffer = indAttr
        this.camera = camera

        this.vect2 = new Vector2()

        this.depth = Math.ceil(Math.log2(size)) + 1
        this.depthSize = 2 ** (this.depth - 1 )

        this.box = new Box3()
        this.V1 = new Vector3()
        this.V2 = new Vector3()
        this.V3 = new Vector3()
        this.V4 = new Vector3()
        this.V5 = new Vector3()
        this.V6 = new Vector3()
        
        this.target = new Vector3()

        this.raycaster = new Raycaster()

    }

    raycast( x, y ){

        const intersections = []

        //set ray from mouse position
        this.vect2.set( x, y )
        this.raycaster.setFromCamera( this.vect2, this.camera )

        //check for grid intersections
        const gridY = get(GRID_Y_POS)
        this.V1.set( 0, gridY, 0 )
        this.V2.set( 0, gridY, this.size )
        this.V3.set( this.size, gridY, 0 )

        if( this.raycaster.ray.intersectTriangle( this.V1, this.V2, this.V3, true, this.target ) )

            intersections.push( [ this.target.distanceToSquared( this.camera.position ), this.target.clone(), 0 ] )

        //only check other half of grid if intersection wasn't already found
        else{

            this.V1.set( this.size, gridY, this.size )
            this.V2.set( this.size, gridY, 0 )
            this.V3.set( 0, gridY, this.size )

            if( this.raycaster.ray.intersectTriangle( this.V1, this.V2, this.V3, true, this.target ) )

                intersections.push( [ this.target.distanceToSquared( this.camera.position ), this.target.clone(), 0 ] )

        }

        //check for octree intersection
        const octreeResult = this.search( 0, 0, 0, this.depthSize, this.depth )

        if(octreeResult)

            intersections.push( octreeResult )

        //if no intersections were found, return null
        if(intersections.length == 0)

            return null

        //sort intersections by distance
        intersections.sort( ( a, b ) => a[0] - b[0] )

        //return intersection closest to camera
        return {

            dist: Math.sqrt(intersections[0][0]),
            point: intersections[0][1],
            face: intersections[0][2]

        }

    }

    search( _x, _y, _z, size, depth ){

        const intersections = []

        const s2 = size / 2

        //copy node position to V1
        this.V1.set( _x, _y, _z )

        for(let y = 0; y < 2; y++)
        for(let z = 0; z < 2; z++)
        for(let x = 0; x < 2; x++){

            //get child node min world position
            this.V2.set( x, y, z ).multiplyScalar( s2 ).add( this.V1 )

            if(this.V2.x > this.size || this.V2.y > this.size || this.V2.z > this.size){

                continue

            }

            if(depth > 2){

                const s4 = s2 / 2
                
                //get child node world max position
                this.V3.set( x, y, z ).addScalar( 1 ).multiplyScalar( s2 ).add( this.V1 )

                this.box.set( this.V2, this.V3 )

                //test for ray interesection with node, save result
                if(this.raycaster.ray.intersectsBox( this.box ))

                    intersections.push( [ this.V2.addScalar( s4 ).distanceToSquared( this.camera.position ), this.V2.x - s4, this.V2.y - s4, this.V2.z - s4 ] )
                
            } else {

                const intersection = this.faceTest( this.V2.x, this.V2.y, this.V2.z )

                if(intersection)

                    intersections.push(intersection)

            }

        }

        //sort intersections by distance from camera. This way the closest intersections will be found before futher ones
        intersections.sort( ( a, b ) => a[0] - b[0] )

        //if at bottom layer and no intersections found, return null, otherwise return intersection closest to camera
        if(depth == 2)

            return intersections.length == 0 ? null : intersections[0]

        //if not at bottom layer, call recursivly check for more intersections, return if intersection found
        for(let i = 0; i < intersections.length; i++){

            const a = intersections[i]
            
            const intersection = this.search(a[1], a[2], a[3], s2, depth - 1)

            if(intersection) 

                return intersection

        }

        return null
    
    }

    faceTest( x, y, z ){

        let ind1, ind2, ind3
        
        //for each face
        for(let i = 0; i < 6; i++){

            const normal = new Vector3(dx[i], dy[i], dz[i])
            const s = this.size
            let faceIndex = getFaceIndex(x + dx1[i], y + dy1[i], z + dz1[i], s, Math.floor(i / 2)) / 2 //convert to position in index buffer

            //test raycast against each half (triangle) of face
            for(let j = 0; j < 2; j++, faceIndex += 3){

                ind1 = this.indBuffer[faceIndex] * 3
                ind2 = this.indBuffer[faceIndex + 1] * 3
                ind3 = this.indBuffer[faceIndex + 2] * 3

                //set triangle from buffer
                this.V4.set(this.posBuffer[ind1], this.posBuffer[ind1 + 1], this.posBuffer[ind1 + 2])
                this.V5.set(this.posBuffer[ind2], this.posBuffer[ind2 + 1], this.posBuffer[ind2 + 2])
                this.V6.set(this.posBuffer[ind3], this.posBuffer[ind3 + 1], this.posBuffer[ind3 + 2])

                //calculate normal of face based on the data in the position buffer
                const realNormal = this.V5.clone().sub( this.V4 ).cross( this.V6.clone().sub( this.V4 ) )

                //check if the real normal matches what the normal should be for the face, if it doesn't match,
                //the face does not belong to this block and is part of an adjacent block.
                if(!realNormal.equals(normal))

                    break

                //check for and return intersection
                if(this.raycaster.ray.intersectTriangle( this.V4, this.V5, this.V6, true, this.target ))

                    return [ this.target.distanceToSquared( this.camera.position ), this.target.clone(), normal ]

            }

        }

    }

}