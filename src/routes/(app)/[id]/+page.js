export const prerender = false;

import PlotId from "$lib/common/plotId"

export async function load({params, fetch}) {

    try {

        const { id } = params
        const plotId = PlotId.fromHexString(id)

        if(plotId.id === 0 || !plotId.verify())

            throw null  

        // const res = await fetch(plotId.getUrl())
        
        // if(!res.ok)

        //     throw null
    
        return {
            ogUrl: `https://trraform.com/${plotId.string()}`,
            ogTitle: `Plot ${plotId.string()}`,
            ogImage: plotId.getImgUrl()
        }

    } catch {

        return {}

    }

}