
import axios from "axios"

async function sendTelegramMsg(chatId, token, text, photoUrl = null) {

    let req

    if (photoUrl) {

        req = axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, {
            chat_id : chatId,
            photo: `${photoUrl}?v=${new Date().getTime()}`,
            caption: text
        })

    } else {

        req = axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id : chatId, text })

    }

    await req

}

async function deleteTelegramMsg(chatId, token, msgId) {

    await axios.post(`https://api.telegram.org/bot${token}/deleteMessage`, { chat_id : chatId, message_id: msgId })
    
}

export { sendTelegramMsg, deleteTelegramMsg }