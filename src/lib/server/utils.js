
import { ALLOWED_ORIGINS, CACHE_PURGE_ORIGIN } from "$lib/common/constants"

function apiRes({ code = 200, msg = "", err = false, headers = { "Access-Control-Allow-Origin": ALLOWED_ORIGINS, "Content-Type": "application/json" } } = {}) {
   
    return new Response(code === 204 ? null : JSON.stringify({ 
        "error" : err,
        "code" : code,
        "message" : msg
    }), { status: code, headers })

}

async function cachePurgeFiles(env, urls){

    const { CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN } = env

    await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`, {
        method: "POST",
        body: JSON.stringify({
            files: urls.map(url => ({ url, headers : { "Origin": CACHE_PURGE_ORIGIN } })) 
        }),
        headers : {
            "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
            "Content-Type": "application/json"
        }
    })
    .catch(e => console.log(e))

}

async function getItemWithWorkerCache(platform, bindingName, item){

    const { caches, context, env } = platform
    const binding = env[bindingName]
    const cache = caches.default
    const key = new Request(`item://${bindingName}/${item}`)

    let response = await cache.match(key);

    if (response)

        return response

    const object = await binding.get(item)

    if(!object)

        return null

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)

    response = new Response(object.body, { headers })

    context.waitUntil(cache.put(key, response.clone()))

    return response

}

export { apiRes, cachePurgeFiles, getItemWithWorkerCache }