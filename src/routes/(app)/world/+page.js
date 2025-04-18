export const prerender = false;

import PlotId from "$lib/common/plotId"

export async function load({ url }) {

    try {

        const searchParams = url.searchParams
        const plotIdParam = searchParams.get("plotId")

        if (plotIdParam) {
        
            const plotId = PlotId.fromHexString(plotIdParam)

            if(!plotId.verify())

                throw null
        
            return {
                ogUrl: `https://trraform.com/world?plotId=${plotId.string()}`,
                ogTitle: `Trraform | Plot ${plotId.string()}`,
                ogImage: plotId.getImgUrl()
            }

        }

        return {}

    } catch(e) {

        console.log(e)

        return {}

    }

}