
import { Vector3 } from "three"
import { PLOT_COUNT } from "./constants"

const HPB = 8 // amount of hues per base color
const HUES = HPB * 6
const GRID_SIZE = 25

class ColorLibrary{

    static light = (() => {

        const angles = [44,45,46]
        const light = angles.map(x => Math.cos(x * Math.PI / 180))
        const magn = Math.hypot(...light)
        const normalized = light.map(x => x / magn)
        const intensity = normalized[1]
        return normalized.map(x => x / intensity)

    })()

    static colors = (() => {

        const arr = new Array(PLOT_COUNT + 1).fill(null)

        const black = [0,0,0]
        const white = [1,1,1]

        const interpolateColor = (t, c1, c2) => {

            const col = []

            for(let i = 0; i < 3; i++)

                col[i] = (1 - t) * c1[i] + t * c2[i]

            return col

        }

        const gs2 = GRID_SIZE * GRID_SIZE

        for(let i = 0; i < gs2; i++)

            arr.push(interpolateColor( i / gs2, white, black))

        for(let i = 0, c1i = 0, c2i = 0; i < 6; i++){

            const c1 = [0,0,0]
            const c2 = [0,0,0]

            c1[c1i % 3] = 1
            c2[c2i % 3] = 1

            if( i % 2 ){

                c1i++
                c1[c1i % 3] = 1

            }else{

                c2i++
                c2[c2i % 3] = 1

            }

            for(let h = 0; h < HPB; h++){

                const col = interpolateColor(h / HPB, c1, c2)

                for(let s = 0; s < GRID_SIZE; s++)
                for(let r = 0; r < GRID_SIZE; r++){

                    const x = (r + 1) / (GRID_SIZE + 2), y = s / GRID_SIZE

                    arr.push(interpolateColor(y,  interpolateColor(x, col, white), interpolateColor(x, black, black)))

                }

            }

        }
        
        return arr

    })()

    static applyLight(ci, normal){

        if(ci <= PLOT_COUNT)

            return null

        return this.applyLightRGB(this.colors[ci], normal)

    }
    
    static applyLightRGB(rgb, normal){

        const scale = this.light[normal]
        const scaled = new Uint8ClampedArray(3)

        for(let i = 0; i < 3; i++)

            scaled[i] = rgb[i] * scale * 255

        return scaled

    }

    static getAsVector(colorIndex){

        const c = this.colors[colorIndex]

        return new Vector3(...c).multiplyScalar(255).floor()

    }
    
    static rgbString(color){

        const [r,g,b] = this.colors[color].map(c => Math.round(c * 255).toString(16).padStart(2, '0'))
        return `#${r}${g}${b}`

    }

    static applyLightStr(color, normal){

        const [r,g,b] = Array.from(this.applyLightRGB(this.colors[color], normal)).map(c => c.toString(16).padStart(2, '0'))
        return `#${r}${g}${b}`

    }

}

export { ColorLibrary, HUES, GRID_SIZE }