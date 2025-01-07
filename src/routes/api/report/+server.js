
import PlotId from "$lib/common/plotId"

export async function POST({ request, platform }) {

    const { DISCORD_PLOT_REPORTS_CHANNEL_ID, DISCORD_BOT_TOKEN } = platform.env
    let { id, message } = await request.json()

    id = "0x1"
    message = "testing hello"

    const plotId = PlotId.fromHexString(id)
    const imgUrl = plotId.getImgUrl()

    const url = `https://discord.com/api/channels/${DISCORD_PLOT_REPORTS_CHANNEL_ID}/messages`;

    const headers = {
        "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json"
    }

    const body = JSON.stringify({
        content: message,
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
                        label: "Ignore", 
                        custom_id: "ignore",
                    },
                    {
                        type: 2,
                        style: 4,
                        label: "Restrict",
                        custom_id: "restrict",
                    }
                ]
            }
        ]
    })

    console.log(await fetch(url, { method: "POST", headers, body }))

    return new Response(null, { status: 200 })

}

