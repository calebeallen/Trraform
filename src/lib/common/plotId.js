import {
    D0_PLOT_COUNT,     
    PLOT_COUNT,
    IMAGES_BUCKET_URL
} from "$lib/common/constants";
  
// Convert these masks to BigInt
const D0_BIT_MASK = 0xFFFFFFn  // 24 bits
const DN_BIT_MASK = 0xFFFn    // 12 bits

export default class PlotId {

    static fromHexString(hexStr) {

        // Safely parse the hex string as a BigInt
        let id
        try {

            // Remove leading "0x" if present
            const sanitized = hexStr.trim().toLowerCase().replace(/^0x/, "")
            id = BigInt(`0x${sanitized}`)

        } catch {
            throw new Error("Invalid plot id (not parseable as BigInt)")
        }
    
        // Check range: must be > 0 and < 2**32
        if (id === 0n || id >= (1n << 32n))
            throw new Error("Invalid plot id (out of range)")
    
        return new PlotId(id)

    }
  
    static depth(id) {

        // Shift off the lower 24 bits first
        id = id >> 24n
    
        let depth = 0
        while (id > 0n) {

            depth++
            id = id >> 12n

        }

        return depth

    }
  
    static verify(id) {

        try {

            const depth = this.depth(id);
    
            // 1) Verify the D0 (depth 0) portion
            let idCopy = id & 0xFFFFFFn
            if (idCopy <= 0n || idCopy > BigInt(D0_PLOT_COUNT))
                return false
            
            // 2) Verify deeper segments
            idCopy = id >> 24n
            for (let i = 0; i < depth; i++) {

                const dnid = idCopy & 0xFFFn
                if (dnid <= 0n || dnid > BigInt(PLOT_COUNT))
                    return false;
                
                idCopy = idCopy >> 12n

            }

            return true

        } catch {

            return false;
            
        }

    }
  
    constructor(id) {

        // If id not provided, use 0n
        this.id = id ? BigInt(id) : 0n;

    }
  
    getImgUrl() {

        return `${IMAGES_BUCKET_URL}/${this.string()}.png`

    }

    equals(plotId) {

        // Compare BigInts directly
        return plotId?.id === this.id

    }
  
    clone() {

        return new PlotId(this.id)

    }
  
    string(hexPrefix = true) {

        // Convert BigInt to lowercase hex
        let str = this.id.toString(16).toLowerCase()

        // Ensure even-length hex (so something like 0x0F doesn't lose the leading '0')
        if (str.length % 2 !== 0)
            str = `0${str}`;
        
        return hexPrefix ? `0x${str}` : str
    }
  
    bigInt() {

        return this.id

    }
  
    verify() {

        return PlotId.verify(this.id)

    }
  
    depth() {

        return PlotId.depth(this.id)

    }
  
    getParent() {

        const depth = this.depth()
        if (depth === 0) 
            return new PlotId(0n)
        
        // Mask out the last 12 bits that define the current child's ID
        const mask = (1n << BigInt(24 + 12 * (depth - 1))) - 1n
        return new PlotId(this.id & mask)

    }
  
    split() {

        let tmp = this.id
        const segments = [tmp & D0_BIT_MASK] // depth 0 portion
        tmp = tmp >> 24n
    
        while (tmp > 0n) {
            segments.push(tmp & DN_BIT_MASK)
            tmp = tmp >> 12n
        }


        return segments.map(a => Number(a))

    }
  
    mergeChild(localId) {

      const localBig = BigInt(localId)

      if (this.id === 0n)
        return new PlotId(localBig)
      
      // Place new child ID in higher bits
      const shiftAmount = BigInt(24 + 12 * this.depth())
      return new PlotId(this.id | (localBig << shiftAmount))

    }
  
    getLocal() {

        const depth = this.depth();
        if (depth === 0) 
            return new PlotId(this.id)
        
        // Shift off all but the last child ID
        const shiftAmount = BigInt(24 + 12 * (depth - 1))
        return new PlotId(this.id >> shiftAmount)

    }

}
