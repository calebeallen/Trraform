
import { handleDiscordInteraction } from "$lib/server/discord"

export async function POST({request, platform}) {
    
    return await handleDiscordInteraction(platform.env, request, async data => {

        return new Response(JSON.stringify({
            "type": 4,
            "data": {
              "content": `<@${data.member.user.id}> ${data.data.custom_id}`
            }
          }), { status: 200, headers : { "Content-Type" : "application/json" } })

    })

}   