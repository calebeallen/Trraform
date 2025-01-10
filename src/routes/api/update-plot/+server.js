
import { createPNG } from "$lib/common/buildImage"
import { PNG } from "pngjs/browser"
import PlotId from "$lib/common/plotId"
import { decodePlotData, encodePlotData } from "$lib/common/utils"
import { apiRes, cachePurgeFiles } from "$lib/server/utils"
import { CONTRACT_ADDRESS } from "$lib/common/constants"
import { mainnet, sepolia } from "viem/chains"
import { createPublicClient, http, recoverMessageAddress, parseAbi } from "viem"
import { logApiErrorDiscord } from "$lib/server/discord"

export async function POST({ request, platform }) {
    
    const { env } = platform
    const { RESTRICTION, PLOTS, IMAGES } = env //bindings
    const ABI = parseAbi([
        "function ownerOf(uint256 tokenId) public view returns (address)"
    ])

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

    /* authenticate request */
    try {

        //verify signature
        let signedMsg = data.get("signedMessage")

        if(!signedMsg)

            throw new Error("Missing signature")

        const { message, timestamp, signature } = JSON.parse(await signedMsg.text())
        const dt = Date.now() - timestamp 
        if( dt < 0 || dt > 600_000) //signature only valid for 10 mins

            throw new Error("Invalid timestamp")

        const address = await recoverMessageAddress( { 
            message: `${message}${new Date(timestamp).toISOString()}`,
            signature  
        })
        const pubCli = createPublicClient({
            chain: sepolia,
            transport: http()
        }) 	

        //get token owner from contract
        const tokenOwner = await pubCli.readContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: "ownerOf",
            args: [plotId.bigInt()]
        })
        
        //signer must have the same address as token owner
        if(address.toLowerCase() !== tokenOwner.toLowerCase())

            throw new Error("Unauthorized signer")

    } catch(e) {

        return apiRes({
            err: true,
            code: 401,
            msg: "Unauthorized"
        })

    }

    /* block updates to restricted plots */
    try {

        let restriction = await RESTRICTION.get(plotId.string())
        restriction = restriction ? JSON.parse(restriction) : {}
        restrictionEndTime = restriction?.end || 0
        
        if(Date.now() < restrictionEndTime)

            throw new Error("Cannot update restricted plot.")

    } catch (e) {

        return apiRes({
            err: true,
            code: 400,
            msg: e.message
        })

    }

    try {

        plotData = decodePlotData( new Uint8Array( await plotData.arrayBuffer() ), plotId.depth(), true )
        plotData.rEnd = restrictionEndTime

        //update plot data
        await PLOTS.put(plotId.string(), encodePlotData(plotData), { httpMetadata: { contentType : "application/octet-stream" } })

        //update image
        const pPngData = data.get("png")

        if(pPngData !== null){

            const preprocessed = new Float32Array(await pPngData.arrayBuffer())
            const size = preprocessed[0]
            const png = new PNG({ width: size, height: size, filterType: -1 })
            createPNG(preprocessed, png.data)

            const pngBuffer = PNG.sync.write(png)
            
            await IMAGES.put(`${plotId.string()}.png`, pngBuffer.buffer, { httpMetadata: { contentType : "image/png" } })

        }

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