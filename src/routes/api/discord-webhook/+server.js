
import { IMAGE_FILE_EXT } from "$lib/common/constants"
import { handleDiscordInteraction } from "$lib/server/discord"
import { getItemWithWorkerCache, cachePurgeFiles } from "$lib/server/utils"
import { decodePlotData, encodePlotData } from "$lib/common/utils"
import PlotId from "$lib/common/plotId"

export async function POST({request, platform}) {
    
    return await handleDiscordInteraction(platform.env, request, async data => {

		const { env } = platform
		const { RESTRICTION, IMAGES, PLOTS } = env
		let [ plotId, action ] = data.data.custom_id.split("_")
		plotId = PlotId.fromHexString(plotId)
		const plotIdStr = plotId.string()

		//get default plot data
		let plotData = await ( await getItemWithWorkerCache(platform, "PLOTS", "default") ).arrayBuffer()
		plotData = decodePlotData(new Uint8Array(plotData))   

		//get current restriction data
		let restriction = await RESTRICTION.get(plotIdStr)
		restriction = restriction ? JSON.parse(restriction) : {}
		let rCount = restriction?.count || 0

		//update restriction
		if (action === "restrict") {

			const WEEK = 7 * 24 * 60 * 60 * 1000
			const rEnd = plotData.rEnd = Math.floor(Date.now() + WEEK * Math.pow(2, rCount))

			await RESTRICTION.put(plotIdStr, JSON.stringify({ count: rCount + 1, end: rEnd }))

		} else if (action === "reinstate" && rCount > 0) {

			await RESTRICTION.put(plotIdStr, JSON.stringify({ count: Math.max(rCount - 1, 0), end: 0 }))

		}

		//update plot data and image
		const defaultImg = await ( await getItemWithWorkerCache(platform, "IMAGES", `default.${IMAGE_FILE_EXT}`) ).arrayBuffer()
		await Promise.all([
			IMAGES.put(`${plotIdStr}.${IMAGE_FILE_EXT}`, defaultImg, { httpMetadata: { contentType : `image/${IMAGE_FILE_EXT}` } }),
			PLOTS.put(plotIdStr, encodePlotData(plotData), { httpMetadata: { contentType : "application/octet-stream" } }),
			cachePurgeFiles(env, plotId.getUrl())
		])

        return new Response(JSON.stringify({
            type: 4,
            data: { content: `<@${data.member.user.id}> ${action}ed plot ${plotIdStr}.` }
        }), { status: 200, headers : { "Content-Type" : "application/json" } })

    })

}   