

import { sendTelegramMsg } from '$lib/server/telegram'
import { decodePlotData } from '$lib/common/utils'
import { IMAGES_BUCKET_URL } from "$lib/common/constants"

export async function POST({ request, platform }) {
    
    const { REPORT_PLOT_BOT_TOKEN, CHAT_ID, PLOTS, OPENAI_API_KEY, OPENAI_ORG_ID, OPENAI_PROJ_ID } = platform.env
    const { plotId, reportMsg } = await request.json()

    try {

        if(!plotId)

            throw new Error("plotId not provided.")

        if(!reportMsg)

            throw new Error("reportMsg not provided.")
            
        //verify message length
        if(msg.length < REPORT_PLOT_MSG_MINLEN || msg.length > REPORT_PLOT_MSG_MAXLEN)

            throw new Error(`Plot report messsage must be between ${REPORT_PLOT_MSG_MINLEN} and ${REPORT_PLOT_MSG_MAXLEN} characters.`)

    } catch (e) {

        return apiRes({
            err: true,
            code: 400,
            msg: e.message
        })

    }

    try {


        //filter spam with gpt
        // if(!(await gptFilter(OPENAI_API_KEY, OPENAI_ORG_ID, OPENAI_PROJ_ID, "Is this report highly serious?", msg)))

        //     return apiRes({
        //         code: 200,
        //         msg: "Success"
        //     })

        //send telegram message
        let plotData = await PLOTS.get(plotId)

        if(!plotData)

            return apiRes({
                err: true,
                code: 400,
                msg: "No data exist for plot."
            })

        plotData = await plotData.arrayBuffer()
        const { name, desc, link, linkLabel } = decodePlotData(new Uint8Array(plotData))

        const text = `${plotId}\nReport Msg: "${msg}"\nName: ${name}\nDesc: ${desc}\nLink: ${link}\nLink Label: ${linkLabel}`

        await sendTelegramMsg(
            CHAT_ID, 
            REPORT_PLOT_BOT_TOKEN, 
            text, 
            `${IMAGES_BUCKET_URL}/${plotId}.png`
        )

        return apiRes({
            code: 200,
            msg: "Success"
        })

    } catch (e) {

        return apiRes({
            err: true,
            code: 500,
            msg: "Unknown error"
        })

    }


}