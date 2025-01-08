
import { handleDiscordInteraction } from "$lib/server/discord"
import { decodePlotData, encodePlotData } from "$lib/common/utils"

export async function POST({request, platform}) {
    
    return await handleDiscordInteraction(platform.env, request, async data => {

		const { env } = platform
		const { RESTRICTION, IMAGES, PLOTS } = env
		let [ plotId, action ] = data.data.custom_id.split("_")

		//get current plot data
		let plotData = await PLOTS.get(plotId)
		plotData = await plotData.arrayBuffer()
		plotData = decodePlotData(new Uint8Array(plotData))   

		//get current restriction data
		let restriction = await RESTRICTION.get(plotId)
		restriction = restriction ? JSON.parse(restriction) : {}
		let rCount = restriction?.count || 0

		//update plot data
		if (action === "restrict") {

			plotData.name = plotData.desc = plotData.link = plotData.linkLabel = ""
			plotData.buildData = null

			const WEEK = 7 * 24 * 60 * 60 * 1000
			const rEnd = plotData.rEnd = Math.floor(Date.now() + WEEK * Math.pow(2, rCount))

			//update restriction, plot image
			await RESTRICTION.put(plotId, JSON.stringify({ count: rCount + 1, end: rEnd }))
			const defaultImg = await (await IMAGES.get("default.png")).arrayBuffer()
			await IMAGES.put(`${plotId}.png`, defaultImg, { httpMetadata: { contentType : "image/png" } })


		} else if (action === "reinstate" && rCount > 0) {

			//update restriction
			plotData.rEnd = 0
			await RESTRICTION.put(plotId, JSON.stringify({ count: Math.max(rCount - 1, 0), end: 0 }))

		}

		//update plot data
		await PLOTS.put(plotId, encodePlotData(plotData), { httpMetadata: { contentType : "application/octet-stream" } });

        return new Response(JSON.stringify({
            type: 4,
            data: { content: `<@${data.member.user.id}> ${action}ed plot ${plotId}.` }
        }), { status: 200, headers : { "Content-Type" : "application/json" } })

    })

}   