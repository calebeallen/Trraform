
import { D0_PLOT_COUNT, PLOT_COUNT, PLOT_DATA_BUCKET_URL, IMAGES_BUCKET_URL} from "$lib/common/constants"

const D0_BIT_MASK = 0xFFFF
const DN_BIT_MASK = 0xFF

export default class PlotId {

    static fromHexString(hexStr){

        const id = parseInt(hexStr, 16)

        if(isNaN(id) || id === 0 || id >= 2**32)

            throw new Error("Invalid plot id")

        return new PlotId(id)

    }

    static depth(id){

        id >>>= 16

        let depth = 0

        while(id > 0){

            depth++

            id >>>= 8

        }

        return depth

    }

    static verify(id){

        try {

            const depth = this.depth(id)

            //verify depth 0 plot id
            let idCopy = id & 0xffff

            if(idCopy <= 0 || idCopy > D0_PLOT_COUNT)

                return false

            idCopy = id >> 16

            for(let i = 0; i < depth; i++){

                const dnid = idCopy & 0xff
                
                if(dnid <= 0 || dnid > PLOT_COUNT)

                    return false

                idCopy >>= 8

            }

            return true

        } catch {

            return false

        }

    }

    constructor(id){

        this.id = id || 0

    }

    getImgUrl(){

        return `${IMAGES_BUCKET_URL}/${this.string()}.png`

    }

    getUrl(){

        return `${PLOT_DATA_BUCKET_URL}/${this.string()}`

    }

    getUrls(){

        return [
            this.getUrl(),
            this.getImgUrl()
        ]

    }

    async fetch(){

        try {

            const res = await fetch(this.getUrl())

            // const res = await fetch(`${PLOT_DATA_BUCKET_URL}/${this.id === 0 ? "0x00" : "0x01"}`) 
            
            if(!res.ok)

                return null

            return await ( await res.blob() ).arrayBuffer()

        } catch(e) {

            console.log(e)
            return null

        }   

    }

    equals(plotId){

        return plotId?.id === this.id

    }

    clone(){

        return new PlotId(this.id)

    }

    string(hexPrefix = true){

        let str = this.id.toString(16).toLowerCase()

        if (str.length % 2 !== 0)

            str = `0${str}`

        return hexPrefix ? `0x${str}` : str

    }

    bigInt(){

        return BigInt(this.id)

    }

    verify(){

        return PlotId.verify(this.id)

    }

    depth(){

        return PlotId.depth(this.id)

    }

    getParent(){

        const depth = this.depth()

        if(depth == 0)

            return new PlotId(0)

        return new PlotId( this.id & ( ( 1 << ( 16 + 8 * (depth - 1) )) - 1 ) )

    }

    split(){

        let id = this.id

        const split = [id & D0_BIT_MASK]

        id >>= 16

        while(id > 0){

            split.push(id & DN_BIT_MASK)

            id >>= 8

        }   

        return split

    }

    mergeChild(localId){

        return new PlotId(this.id === 0 ? localId : this.id | ( localId << (16 + 8 * this.depth()) ))

    }

    getLocal(){

        const depth = this.depth()

        if(depth === 0)

            return new PlotId(this.id)

        return new PlotId(this.id >> (16 + 8 * (depth - 1)))

    }

}