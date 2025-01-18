export const prerender = false;

import PlotId from "$lib/common/plotId"
import Camera from "$lib/common/camera"

export async function load({ url }) {

    try {

        const searchParams = url.searchParams
        const camera = searchParams.get("camera")
        const plotIdParam = searchParams.get("plotId")

        if (camera) {

            const { x, y, z, phi, theta } = Camera.decodeCameraB64(camera)

            return {
                ogUrl: `https://trraform.com/world`,
                ogTitle: `Trraform | Camera Position`,
                ogDesc: `x: ${x}, y: ${y}, z: ${z}, phi: ${phi}, theta: ${theta}`
            }

        } else if (plotIdParam) {
        
            const plotId = PlotId.fromHexString(plotIdParam)

            if(!plotId.verify())

                throw null
        
            return {
                ogUrl: `https://trraform.com/world?plotId=${plotId.string()}`,
                ogTitle: `Trraform | Plot ${plotId.string()}`,
                ogImage: plotId.getImgUrl()
            }

        }

    } catch(e) {

        console.log(e)

        return {}

    }

}