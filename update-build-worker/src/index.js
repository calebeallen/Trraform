
import { createPNG } from "../../src/lib/common/buildImage"
import { PNG } from "pngjs/browser"
import PlotId from "../../src/lib/common/plotId"
import { decodePlotData, encodePlotData } from "../../src/lib/common/utils"
import { apiRes, cachePurgeFiles } from "../../src/lib/server/utils"

export default {

	async fetch(request, env) {

		if (request.method === "OPTIONS")
 
			return apiRes({ 
                code: 204, 
                headers: {
					'Access-Control-Allow-Origin': "http://localhost:5173",
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Credentials': 'true'
				}
            })
 
        else if (request.method !== "POST")
 
		    return apiRes({
                err: true,
                code: 405,
                msg: "Method not allowed"
            })

        const { PLOTS } = env //bindings
        
        let url, plotId, data, plotData, restrictionEndTime

        try {

            data = await request.formData()
            url = new URL( request.url )
            plotId = PlotId.fromHexString(url.searchParams.get('plotId'))
            plotData = data.get("plotData")

            if(!plotData)

                throw new Error("Missing plot data.")

        } catch (e) {

            return apiRes({
                err: true,
                code: 400,
                msg: "Bad request"
            })

        }

        try {

            plotData = decodePlotData( new Uint8Array( await plotData.arrayBuffer() ), plotId.depth(), true )
            plotData.rEnd = restrictionEndTime

            //update plot data
            await PLOTS.put(plotId.string(), encodePlotData(plotData), { httpMetadata: { contentType : "application/octet-stream" } })

            await cachePurgeFiles(env, [plotId.getUrl()])

            return apiRes({
                code: 200,
                msg: "Success"
            })

        } catch(e) {

            console.log(e)

            await logApiErrorDiscord(env, "update-plot", null, e)

            return apiRes({
                err: true,
                code: 500,
                msg: "An unknown error occurred."
            })
            
        }

    }

}