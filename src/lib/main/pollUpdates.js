import { get } from "svelte/store";
import { API_ORIGIN } from "../common/constants";
import { user, newPlots } from "./store";

const RETRY_SECONDS = 5;
const MAX_RETRIES = 5;

export async function pollUpdates(tries = 0) {

    if (tries >= MAX_RETRIES) 
        return

    try {

        const res = await fetch(`${API_ORIGIN}/user`, {
            headers: { 
                Authorization: localStorage.getItem("auth_token") 
            }
        })

        if (!res.ok) 
            throw new Error("Failed to poll changes")

        const { data } = await res.json()
        const currentUserData = get(user)
        const currentPlotIds = new Set(currentUserData.plotIds.map(e => e.plotId))
        let hasUpdates = false

        data.plotIds = data.plotIds.map(plotId => {

            const isNew = !currentPlotIds.has(plotId)
            if (isNew){
                hasUpdates = true
                newPlots.update(i => i + 1)
            }
            
            return { plotId, isNew }

        })

        if (currentUserData.subscribed !== data.subscribed)
            hasUpdates = true

        if (hasUpdates) {
            user.set(data)
            return
        }

    } catch (error) {
        console.error("Polling error:", error)
        return
    }

    setTimeout(() => pollUpdates(tries + 1), RETRY_SECONDS * 1000)

}
