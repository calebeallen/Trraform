
import { getItemWithWorkerCache, apiRes } from "$lib/server/utils"
import { logApiErrorDiscord } from "$lib/server/discord"
import { cachePurgeFiles } from "$lib/server/utils"
import PlotId from "$lib/common/plotId"
import { trim, fromHex } from "viem"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";


export async function POST({ request, platform }){

    const { env } = platform
    const body = await request.json()
    const logs = body?.event?.data?.block?.logs ?? []

    await Promise.all(
        logs.filter(log => log.topics[1].toLowerCase() == ZERO_ADDRESS)
        .map(log => {

            const tokenId = fromHex(trim(log.topics[3]), "number")
            const plotId = new PlotId(tokenId)

            const p = setDefault(platform, plotId)
            p.catch(async e => await logApiErrorDiscord(env, "alchemy-webhook", logs, e))

            return p

        })
    )

    return apiRes({
        code: 200,
        msg: "Success"
    })

}

async function setDefault(platform, plotId){

    const { env } = platform
    const { PLOTS, IMAGES, TOKEN_METADATA } = env
    const plotIdStr = plotId.string()

    //get default image, plot data
    const defaultPlot = await ( await getItemWithWorkerCache(platform, "PLOTS", "default") ).arrayBuffer()
    const defaultImg = await ( await getItemWithWorkerCache(platform, "IMAGES", `default.png`) ).arrayBuffer()
    const metadata = JSON.stringify({
        "name": `Plot ${plotIdStr}`,
        "external_url": `https://trraform.com/${plotIdStr}`, 
        "image": plotId.getImgUrl()
    })

    await Promise.all([
        PLOTS.put(plotIdStr, defaultPlot, { httpMetadata: { contentType : "application/octet-stream" } }),
        IMAGES.put(`${plotIdStr}.png`, defaultImg, { httpMetadata: { contentType : `image/png` } }),
        TOKEN_METADATA.put(`${plotIdStr}.json`, metadata, { httpMetadata: { contentType : "application/json" } })
    ])

    await cachePurgeFiles(env, plotId.getUrls())

}