
import { BufferGeometry, Float32BufferAttribute } from "three";

class GridGeometry extends BufferGeometry{

    constructor( size ){

        super()

        const arr = []
        const s2 = size / 2

        for(let i = 0; i <= size; i++){

            arr.push( -s2, 0, i - s2, s2, 0, i - s2 )
            arr.push( i - s2, 0, -s2, i - s2, 0, s2 )

        }

        this.setAttribute( 'position', new Float32BufferAttribute( arr, 3 ) )

    }

}

export { GridGeometry }