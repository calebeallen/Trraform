
import { getItemWithWorkerCache, apiRes } from "$lib/server/utils"
import { logApiErrorDiscord } from "$lib/server/discord"
import { cachePurgeFiles } from "$lib/server/utils"
import { PLOT_COUNT, MAX_DEPTH } from "$lib/common/constants"
import PlotId from "$lib/common/plotId"
import { trim, fromHex } from "viem"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";

export async function POST({ request, platform }){

    const { env } = platform
    const { AVAILABLE_PLOTS } = env

    const body = await request.json()
    const logs = body?.event?.data?.block?.logs ?? []

    try {

        const createDefaultEntries = []
        const dbUpdates = []
        const dbInserts = []

        for(const log of logs){

            //filter out non-mint events
            if(log.topics[1].toLowerCase() != ZERO_ADDRESS)

                continue
            
            const tokenId = fromHex(trim(log.topics[3]), "number")
            const plotId = new PlotId(tokenId)

            //create metadata and set to default plot data
            createDefaultEntries.push(setDefault(platform, plotId))

            //update db entry for this plot. Set available to false.
            dbUpdates.push(plotId.id)

            //create db entries for child plots for tracking availability
            if(plotId.depth() < MAX_DEPTH)
                
                for(let i = 1; i <= PLOT_COUNT; i++){

                    const childPlotId = plotId.mergeChild(i)
                    const childDepth = childPlotId.depth()
                    dbInserts.push(`(${childPlotId.id},${childDepth})`)

                }
            
        }

        //batch updates
        const dbUpdateBatches = getBatches(dbUpdates, 1000)

        for(const batch of dbUpdateBatches)

            await AVAILABLE_PLOTS.prepare(`UPDATE AvailablePlots SET available = 0 WHERE plotId IN (${batch.join(",")});`).run()

        //batch inserts
        const dbInsertBatches = getBatches(dbInserts, 1000)

        for(const batch of dbInsertBatches)
        
            await AVAILABLE_PLOTS.prepare(`INSERT INTO AvailablePlots (plotId,depth) VALUES ${batch.join(",")};`).run()

        //wait for default entry creation to finish
        await Promise.all(createDefaultEntries)

    } catch (e) {

        await logApiErrorDiscord(env, "alchemy-webhook", logs, e)
        return apiRes({
            err: true,
            code: 200, //must return 200 or else alchemy will retry request
            msg: "Internal error"
        })

    }

    return apiRes({
        code: 200,
        msg: "Success"
    })

}

function getBatches(arr, batchSize) {

    const result = []

    for (let i = 0; i < arr.length; i += batchSize) 

        result.push(arr.slice(i, i + batchSize))
    
    return result

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

    await cachePurgeFiles(env, [plotId.getUrl()])

}