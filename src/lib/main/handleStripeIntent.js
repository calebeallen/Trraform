
import { pushNotification } from "$lib/common/utils"
import { stripe as _stripe, user as _user, notification, cart, pendingOrder } from "$lib/main/store"
import { get } from "svelte/store";
import { pollUpdates } from "./pollUpdates";
import { API_ORIGIN } from "../common/constants";

export async function handleStripeIntent(clientSecret){

    const stripe = get(_stripe)
    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret)

    let details

    //get metadata
    try {

        const res = await fetch(`${API_ORIGIN}/payment/intent/details?intent-id=${paymentIntent.id}`, {
            headers: {
                "Authorization": localStorage.getItem("auth_token"),
                "Content-type": "application/json"
            }
        })

        if(!res.ok)
            throw new Error("Error getting payment details")

        const { data } = await res.json()
        details = data

    } catch(e) {

        console.error(e)
        return false

    }
    
    switch (paymentIntent.status) {

        case 'succeeded':
        case 'processing':

            const anticipatedChanges = {
                subscription: false,
                plotIds: null
            } 

            pushNotification(notification, `Payment ${paymentIntent.status}`, "It may take a few minutes for updates to show.")

            if(details.type === "plot-purchase"){

                // clear cart and flag the purchased plots in pending so that the user doesn't place
                // a duplicate order between polling intervals
                const newPlotIds = new Set(details.plotIds)
                
                cart.set({})
                pendingOrder.set(newPlotIds)
                localStorage.setItem("cart", JSON.stringify({}))
                anticipatedChanges.plotIds = newPlotIds

            } else if (details.type === "sub")

                anticipatedChanges.subscription = true

            pollUpdates(anticipatedChanges)
            return true
    
        case 'requires_payment_method':

            pushNotification(notification, "Payment failed", "Please try a different payment method.")
            break
    
        default:

            pushNotification(notification, "Something went wrong", "We're looking into this, please try again later.")
            break

    }

    return false

}
