
import axios from "axios"
import { ALLOWED_ORIGINS, CACHE_PURGE_ORIGIN } from "$lib/common/constants"

function apiRes({ code = 200, msg = "", err = false, headers = { "Access-Control-Allow-Origin": ALLOWED_ORIGINS, "Content-Type": "application/json" } } = {}) {
   
    return new Response(code === 204 ? null : JSON.stringify({ 
        "error" : err,
        "code" : code,
        "message" : msg
    }), { status: code, headers })

}

async function cachePurgeFile(env, urls){

    const { CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN } = env

    await axios.post(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`, 
        {
            files: urls.map(url => ({ url, headers : { "Origin": CACHE_PURGE_ORIGIN } })) 
        },{
            headers : {
                "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
                "Content-Type": "application/json"
            }
        }
    ).catch(e => console.log(e.response.data.errors[0]))

}

function tokenMetaData(plotId){
    
    return JSON.stringify({
        "name": plotId.string(),
        "external_url": `https://trraform.com/${plotId.string()}`, 
        "image": `https://images.trraform.com/${plotId.string()}.png`, 
        "attributes": [{
            "trait_type": "Depth", 
            "value": plotId.depth()
        }]
    })

}

export { apiRes, cachePurgeFile, tokenMetaData }