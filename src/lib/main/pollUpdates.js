

import { API_ORIGIN } from "../common/constants";
import { pushNotification } from "$lib/common/utils"
import { user as _user, newPlots, refs, showNextStepsModal, notification, insideOf, showUserWidget } from "$lib/main/store"
import { confetti } from "./decoration";
import { get } from "svelte/store";
import PlotId from "../common/plotId";

const RETRY_SECONDS = 5;
const MAX_RETRIES = 10;

export async function pollUpdates(anticipatedChanges, tries = 0) {

    if (tries >= MAX_RETRIES) 
        return

    try {

        const res = await fetch(`${API_ORIGIN}/user`, {
            headers: { 
                "Authorization": localStorage.getItem("auth_token") 
            }
        })

        if (!res.ok) 
            throw new Error("Failed to poll changes")

        const { data: user } = await res.json()



        console.log(anticipatedChanges, user)

        // if user data contains the new plot ids, then update was successful
        if(anticipatedChanges.plotIds !== null){

            let isUpdated = false

            // assume that if one was found, all update was successful
            user.plotIds = user.plotIds.map(plotId => {

                const obj = { plotId, isNew: false }
                if(anticipatedChanges.plotIds.has(plotId))
                    isUpdated = obj.isNew = true

                return obj

            })

            if(isUpdated){

                newPlots.update(amt => amt + anticipatedChanges.plotIds.size)

                // confetti on all new plots
                const plotIds = anticipatedChanges.plotIds
                setTimeout(() => {

                    for(const id of plotIds){

                        const plotId = PlotId.fromHexString(id)
                        const plot = refs.rootPlot.findPlotById(plotId)
                        if(plot)
                            confetti(plot.pos, plot.parent.blockSize)

                    }

                }, 1000)

                // show whats next modal if anticipated changes.length is equal to user.plotsIds.length (meaning they had no plots before)
                if(anticipatedChanges.plotIds.size === user.plotIds.length){
                    setTimeout(() => showNextStepsModal.set(true), 3000)
                }

                pushNotification(notification, "Plots received", "Click your profile to view your plots.")

                anticipatedChanges.plotIds = null
                _user.set(user) // update user store to new data
                showUserWidget.set(true)
                insideOf.update(_=>_)

            }

        }

        if(anticipatedChanges.subscription){

            const curUser = get(_user)
            if(!curUser.subActive && anticipatedChanges.subscription){

                pushNotification(notification, "Subscription active", "Thanks for supporting Trraform!")
                
                anticipatedChanges.subscription = false
                curUser.subActive = true
                _user.set(curUser)

            }

        }

    } catch (error) {
        console.error("Polling error:", error)
        return
    }

    if(anticipatedChanges.plotIds !== null || anticipatedChanges.subscription)
        setTimeout(() => pollUpdates(anticipatedChanges, tries + 1), RETRY_SECONDS * 1000)

}



