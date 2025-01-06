
import { apiRes, cachePurgeFile, deleteTelegramMsg, sendTelegramMsg, tokenMetaData } from "@packages/global/apiUtils"
import { decodePlotData, encodePlotData } from "@packages/global/functions"
import { defaultPNG } from "@packages/global/defaults"
import PlotId from "@packages/global/plotId"

const WEEK = 7 * 24 * 60 * 60 * 1000

export async function POST({ request, platform }){

        const { CHAT_ID, REPORT_PLOT_BOT_TOKEN, TELEGRAM_SECRET_TOKEN, PLOTS, TOKEN_METADATA, RESTRICTION, CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN } = env
        const { message } = await request.json()

        //authenticate request
        if(request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== TELEGRAM_SECRET_TOKEN || message.chat.id != CHAT_ID)

            throw new Error("Unauthorized")

        try {
            
            //check for valid formatting
            const splitMsg = message.text.trim().split(" ")
            const reply = message.reply_to_message
            
            if(!reply && splitMsg.length < 2)

                throw new Error("Invalid format, use format /<command> <plotId> or reply to a report with a command")

            //get command
            const _id = reply ? reply.text.split("\n")[0] : splitMsg[1]
            const plotId = PlotId.fromHexString(_id)
            const plotIdStr = plotId.string()
            const command = splitMsg[0]

            //handle ignore command (delete the message)
            if(command === "/ignore" && reply){

                await deleteTelegramMsg(CHAT_ID, REPORT_PLOT_BOT_TOKEN, reply.message_id)
                return apiRes({ msg: "Success" })

            }

            //handle invalid commands
            if(command !== "/remove" && command !== "/revoke")

                throw new Error("Invalid Command")

            //get current plot data
            const plotObj = await PLOTS.get(plotIdStr)

            if(!plotObj)

                throw new Error("Plot not found")

            let plotData = decodePlotData(new Uint8Array(await plotObj.arrayBuffer()))   

            //get current restriction data
            let restriction = await RESTRICTION.get(plotIdStr)

            if(restriction)

                restriction = JSON.parse(restriction)

            let rCount = restriction?.count || 0

            //update plot data
            if (command === "/remove") {

                plotData.name = plotData.desc = plotData.link = plotData.linkLabel = ""
                plotData.buildData = null

                const rEnd = plotData.rEnd = Math.floor(Date.now() + WEEK * Math.pow(2, rCount))

                //update restriction, metadata
                await RESTRICTION.put(plotIdStr, JSON.stringify({ count: rCount + 1, end: rEnd }))
                await TOKEN_METADATA.put(`${plotIdStr}.json`, tokenMetaData(plotId, defaultPNG))

            } else if (command === "/revoke" && restriction) {

                //update restriction
                plotData.rEnd = 0
                await RESTRICTION.put(plotIdStr, JSON.stringify({ count: Math.max(rCount - 1, 0), end: 0 }))

            }

            //update plot data
            await PLOTS.put(plotIdStr, encodePlotData(plotData), { httpMetadata: { contentType : "application/octet-stream" } });
            await cachePurgeFile([plotId.getUrl()], CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN)

            if(reply)

                await deleteTelegramMsg(CHAT_ID, REPORT_PLOT_BOT_TOKEN, reply.message_id)

            const successMsg = {
                "/remove" : `Removed plot ${plotIdStr}`,
                "/revoke" : `Revoked plot ${plotIdStr} restrictions`
            }
            
            await sendTelegramMsg(CHAT_ID, REPORT_PLOT_BOT_TOKEN, successMsg[command])
            return apiRes({ msg: "Success" })

        } catch (e) {

            await sendTelegramMsg(CHAT_ID, REPORT_PLOT_BOT_TOKEN, e.message)

            return apiRes({ //all errors need 200 status code for telegram or else bot will stall
                err: true,
                msg: e.message 
            })

        }
 
}
