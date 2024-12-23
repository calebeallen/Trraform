
import axios from "axios"
import { ALLOWED_ORIGINS } from "$lib/common/constants"

function apiRes({ code = 200, msg = "", err = false, headers = { "Access-Control-Allow-Origin": ALLOWED_ORIGINS, "Content-Type": "application/json" } } = {}) {
   
    return new Response(code === 204 ? null : JSON.stringify({ 
        "error" : err,
        "code" : code,
        "message" : msg
    }), { status: code, headers })

}

async function cachePurgeFile(urls, zoneId, apiToken){

    await axios.post(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, 
        {
            files: urls.map(url => ({ url, headers : { "Origin": "http://localhost:5173" } })) 
        },{
            headers : {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json"
            }
        }
    ).catch(e => console.log(e.response.data.errors[0]))

}

function bytesToBase64(bytes) {

	const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("")

	return btoa(binString);

}

function tokenMetaData(plotId, b64png){
    
    return JSON.stringify({
        "name": plotId.string(),
        "external_url": `https://trraform.com/${plotId.string()}`, 
        "image": `data:image/png;base64,${b64png}`, 
        "attributes": [{
            "trait_type": "Depth", 
            "value": plotId.depth()
        }]
    })

}



export { apiRes, sendTelegramMsg, deleteTelegramMsg, cachePurgeFile, tokenMetaData, bytesToBase64 }