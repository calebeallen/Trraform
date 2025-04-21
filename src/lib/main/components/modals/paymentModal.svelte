
<script>

    import { onDestroy, onMount } from "svelte";
    import { paymentSession, stripe, loadScreenOpacity, cart, notification, modalsShowing } from "$lib/main/store"
    import { API_ORIGIN } from "$lib/common/constants"
    import { page } from '$app/stores';
    import { pushNotification } from "$lib/common/utils"
    import Modal from "../../../common/components/modal.svelte";
    import { handleStripeIntent } from "$lib/main/handleStripeIntent"
    let elements = null
    let total = ""

    const appearance = {
        theme: 'flat',
        variables: { 
            colorPrimary: '#a1a1aa',
            colorBackground: '#27272a',
            colorText: '#a1a1aa',
            colorDanger: '#df1b41',
            fontFamily: 'Arial',
            spacingUnit: '2.5px',
            borderRadius: '12px'
        }
    }
    const layout = {
        type: 'tabs',
        defaultCollapsed: false,
    }

    let session = {}
    let clientSecret = null

    onMount(() => {

        $modalsShowing++
        session = $paymentSession

        if(session.method === "pay")
            initPayment()
        else if(session.method === "sub")
            initSubscription()

    })
    onDestroy(() => $modalsShowing--)

    function initPayment(){

        total = (session.total / 100).toFixed(2)

        const options = {
            mode: 'payment',
            currency: 'usd',
            amount: session.total,
            appearance
        }

        elements = $stripe.elements(options)

        const paymentElement = elements.create("payment", { layout })
        paymentElement.mount("#payment-element")

    }

    async function initSubscription(){

        $loadScreenOpacity = 50

        try {

            const res = await fetch(`${API_ORIGIN}/payment/subscription/create`, {
                method: "POST",
                headers: {
                    "Authorization": localStorage.getItem("auth_token")
                }
            })

            const { data, message } = await res.json()

            if(!res.ok)
                throw new Error(message)

            clientSecret = data.clientSecret
            elements = $stripe.elements({ clientSecret, appearance })

            const paymentElement = elements.create("payment", { layout });
            paymentElement.mount("#payment-element")

        } catch {

            $paymentSession = null
            pushNotification(notification, "Something went wrong", "We're looking into this, please try again later.")

        }

        $loadScreenOpacity = 0

    }

    async function createIntent(){

        try {

            // Trigger form validation and wallet collection
            const { error: submitError } = await elements.submit()
            if (submitError) 
                throw new Error(submitError)

            // create payment intent
            const res = await fetch(`${API_ORIGIN}/payment/intent`, {
                method: "POST",
                headers: {
                    "Authorization": localStorage.getItem("auth_token"),
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    plotIds: session.plotIds
                })
            })

            const { data, message } = await res.json()

            if(!res.ok){

                // if plots were already claimed/locked, mark them as such in the cart and return
                if(data?.conflicts){

                    const { conflicts } = data

                    for(const id of conflicts)
                        $cart[id].isClaimed = true
                
                    $cart = $cart
                    $paymentSession = null
                    pushNotification(notification, "Review cart", "One or more plots in your cart are unavailable.")

                }
                
                throw new Error(message)

            }

            clientSecret = data.clientSecret

            console.log(clientSecret)

        } catch(e) {
            return { error: e }
        }

        return { error: null }

    }

    async function submit(){

        $loadScreenOpacity = 50

        if(session.method === "pay"){

            const { error } = await createIntent()
            if(error){
                $loadScreenOpacity = 0 
                return
            }

        } else if(session.method === "sub") {

            const { error: submitError } = await elements.submit()
            if (submitError) 
                throw new Error(submitError)
            
        }

        const redirect = new URL($page.url.href)
        redirect.searchParams.set("payment_intent_client_secret", clientSecret)

        const { error } = await $stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: {
                return_url: redirect.toString(),
            },
            redirect: "if_required"
        })

        if (error) 
            pushNotification(notification, "Payment error", error.message)
        else {
            const success = await handleStripeIntent(clientSecret)
            if(success)
                $paymentSession = null
        }

        $loadScreenOpacity = 0 

    }


</script>

<Modal header="Payment" class="max-w-lg" on:close={() => $paymentSession = null}>
    <div class="relative mt-3 space-y-4">
        <form on:submit|preventDefault={submit} id="payment-form">
            <div class="p-3 rounded-xl outline-zinc-700 outline outline-1 bg-zinc-900">
                <div id="payment-element"></div>
            </div>
            {#if $paymentSession?.method == "pay"}
                <button type="submit" class="w-full mt-4 button0" id="submit">Pay ${total}</button>
            {:else}
                <button type="submit" class="w-full mt-4 button0" id="submit">Subscribe $3.99/month</button>
            {/if}
        </form>
    </div>
</Modal>