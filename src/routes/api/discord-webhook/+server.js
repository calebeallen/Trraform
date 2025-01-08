
import { IMAGE_FILE_EXT } from "$lib/common/constants"
import { handleDiscordInteraction } from "$lib/server/discord"
import { getItemWithWorkerCache } from "$lib/server/utils"
import { decodePlotData, encodePlotData } from "$lib/common/utils"
import PlotId from "$lib/common/plotId"

export async function POST({request, platform}) {
    
    return await handleDiscordInteraction(platform.env, request, async data => {

		const { env } = platform
		const { RESTRICTION, IMAGES, PLOTS } = env
		let [ plotId, action ] = data.data.custom_id.split("_")
		plotId = PlotId.fromHexString(plotId)
		const plotIdStr = plotId.string()

		//get current plot data
		let plotData = await PLOTS.get(plotIdStr)
		plotData = await plotData.arrayBuffer()
		plotData = decodePlotData(new Uint8Array(plotData))   

		//get current restriction data
		let restriction = await RESTRICTION.get(plotIdStr)
		restriction = restriction ? JSON.parse(restriction) : {}
		let rCount = restriction?.count || 0
		
		const purgeUrls = [plotId.getUrl()]

		//update plot data
		if (action === "restrict") {

			plotData.name = plotData.desc = plotData.link = plotData.linkLabel = ""
			plotData.buildData = null

			const WEEK = 7 * 24 * 60 * 60 * 1000
			const rEnd = plotData.rEnd = Math.floor(Date.now() + WEEK * Math.pow(2, rCount))

			//update restriction, plot image
			await RESTRICTION.put(plotIdStr, JSON.stringify({ count: rCount + 1, end: rEnd }))
			const defaultImg = await ( await getItemWithWorkerCache(platform, "IMAGES", `default.${IMAGE_FILE_EXT}`) ).arrayBuffer()
			await IMAGES.put(`${plotIdStr}.${IMAGE_FILE_EXT}`, defaultImg, { httpMetadata: { contentType : `image/${IMAGE_FILE_EXT}` } })
			purgeUrls.push(plotId.getImgUrl())

		} else if (action === "reinstate" && rCount > 0) {

			//update restriction
			plotData.rEnd = 0
			await RESTRICTION.put(plotIdStr, JSON.stringify({ count: Math.max(rCount - 1, 0), end: 0 }))

		}

		//update plot data
		await PLOTS.put(plotIdStr, encodePlotData(plotData), { httpMetadata: { contentType : "application/octet-stream" } })
		await cachePurgeFiles(env, purgeUrls)

        return new Response(JSON.stringify({
            type: 4,
            data: { content: `<@${data.member.user.id}> ${action}ed plot ${plotIdStr}.` }
        }), { status: 200, headers : { "Content-Type" : "application/json" } })

    })

}   