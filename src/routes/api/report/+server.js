
import PlotId from "$lib/common/plotId"
import { apiRes } from "$lib/server/utils"
import { decodePlotData } from "$lib/common/utils"
import { REPORT_PLOT_MSG_MINLEN, REPORT_PLOT_MSG_MAXLEN } from "$lib/common/constants"
import { logApiErrorDiscord } from "$lib/server/discord"

export async function POST({ request, platform }) {

    const { env } = platform
    const { DISCORD_PLOT_REPORTS_CHANNEL_ID, DISCORD_BOT_TOKEN, PLOTS } = env
    const payload = await request.json()
    let { plotId, message } = payload

    if(!message || message.length < REPORT_PLOT_MSG_MINLEN || message.length > REPORT_PLOT_MSG_MAXLEN)

        return apiRes({
            err: true,
            code: 400,
            msg: "Invalid report message"
        })

    try {

        plotId = PlotId.fromHexString(plotId)

        if(!plotId.verify)

            throw new Error("Invalid plot id")

    } catch (e) {

        return apiRes({
            err: true,
            code: 400,
            msg: "Invalid plot id"
        })

    }

    try {
        
        const plotIdStr = plotId.string()
        let plotData = await PLOTS.get(plotIdStr)

        // if(!plotData)

        //     return apiRes({
        //         err: true,
        //         code: 400,
        //         msg: "No plot data was found."
        //     })
        
        // plotData = await plotData.arrayBuffer()
        const { name, desc, link, linkLabel } = {} // decodePlotData(new Uint8Array(plotData))
        const text = `"${message}"\n\nName: ${name}\nDesc: ${desc}\nLink: ${link}\nLink Label: ${linkLabel}`
        const imgUrl = plotId.getImgUrl()

        await fetch(`https://discord.com/api/channels/${DISCORD_PLOT_REPORTS_CHANNEL_ID}/messages`, { 
            method: "POST", 
            headers: {
                "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: text,
                embeds: [
                    {
                        image: {
                            url: imgUrl,
                        }
                    }
                ],
                components: [
                    {
                        type: 1, // Action Row
                        components: [
                            {
                                type: 2,
                                style: 1,
                                label: "Reinstate", 
                                custom_id: `${plotIdStr}_reinstate`,
                            },
                            {
                                type: 2,
                                style: 4,
                                label: "Restrict",
                                custom_id: `${plotIdStr}_restrict`,
                            }
                        ]
                    }
                ]
            })
        })

        return apiRes({
            code: 200,
            msg: "Success"
        })

    } catch (e) {

        await logApiErrorDiscord(env, "Report", payload, e)

        return apiRes({
            err: true,
            code: 500,
            msg: "Internal error"
        })
        
    }

}

