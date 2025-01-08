
import nacl from "tweetnacl";

async function logApiErrorDiscord(env, apiName, payload, error){

    const { DISCORD_API_ERRORS_CHANNEL_ID, DISCORD_BOT_TOKEN } = env
    
    const errorStack = error.stack ? error.stack : error.toString()
    const content = `================================================================\n\nError in **${apiName}** on **${new Date().toString()}**:\n\n\`\`\`js\n${errorStack}\n\`\`\`\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n================================================================`
    
    await fetch(`https://discord.com/api/channels/${DISCORD_API_ERRORS_CHANNEL_ID}/messages`, { 
        method: "POST", 
        headers: {
            "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
    })

}

async function handleDiscordInteraction(env, request, callback){

    const { DISCORD_PUBLIC_KEY } = env
    const signature = request.headers.get("X-Signature-Ed25519") || ""
    const timestamp = request.headers.get("X-Signature-Timestamp") || ""
    const rawBody = await request.text()

    const encoder = new TextEncoder()
    const signatureUint8 = hexToUint8Array(signature)
    const publicKeyUint8 = hexToUint8Array(DISCORD_PUBLIC_KEY)
    const timestampUint8 = encoder.encode(timestamp)
    const bodyUint8 = encoder.encode(rawBody)

    const message = new Uint8Array(timestampUint8.length + bodyUint8.length)
    message.set(timestampUint8, 0)
    message.set(bodyUint8, timestampUint8.length)

    const isValid = nacl.sign.detached.verify(message, signatureUint8, publicKeyUint8)

    if (!isValid) 

        return new Response("Invalid request signature", { status: 401 })

    const data = JSON.parse(rawBody)

    if (data.type === 1) 

        return new Response(JSON.stringify({ type: 1 }), { headers: { "Content-Type": "application/json" } })
    
    return await callback(data)


}

function hexToUint8Array(hexString) {

    if (hexString.length % 2 !== 0) 

        throw new Error("Invalid hex string length.")
    
    const arrayBuffer = new Uint8Array(hexString.length / 2)

    for (let i = 0; i < hexString.length; i += 2)

        arrayBuffer[i / 2] = parseInt(hexString.substr(i, 2), 16)

    return arrayBuffer

}

export { logApiErrorDiscord, handleDiscordInteraction }