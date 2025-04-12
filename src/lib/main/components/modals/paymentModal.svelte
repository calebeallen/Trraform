
<script>

    import { onMount } from "svelte";
    import { paymentSession, stripe, loadScreenOpacity, cart, notification } from "$lib/main/store"
    import { API_ORIGIN } from "$lib/common/constants"
    import { page } from '$app/stores';
    import { pushNotification } from "$lib/common/utils"
    import Modal from "../../../common/components/modal.svelte";
    import { pollUpdates } from "$lib/main/pollUpdates"

    let elements = null

    onMount(() => {
        
        const options = {
            mode: 'payment',
            currency: 'usd',
            amount: $paymentSession.total,
            appearance: {
                theme: 'flat',
                variables: { 
                    colorPrimary: '#a1a1aa',
                    colorBackground: '#27272a',
                    colorText: '#a1a1aa',
                    colorDanger: '#df1b41',
                    fontFamily: 'Arial',
                    spacingUnit: '3px',
                    borderRadius: '8px'
                }
            }
        }

        elements = $stripe.elements(options)
        const paymentElement = elements.create("payment", {
            layout: {
                type: 'tabs',
                defaultCollapsed: false,
            }
        })

        paymentElement.mount("#payment-element")

    })

    async function submit(){

        $loadScreenOpacity = 50

        let clientSecret

        try{

            // Trigger form validation and wallet collection
            const { error: submitError } = await elements.submit();
            if (submitError) 
                throw new Error(submitError)


            // create payment intent
            const res = await fetch(`${API_ORIGIN}/payment/create-intent`, {
                method: "POST",
                headers: {
                    "Authorization": localStorage.getItem("auth_token"),
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    plotIds: $paymentSession.plotIds
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
                    pushNotification(notification, "Something went wrong", "One or more plots in your cart are unavailable, please review your cart.")
                    return

                } else
                    throw new Error(message)

            }

            clientSecret = data.clientSecret

            const {error} = await $stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: $page.url.href,
                },
                redirect: "if_required",
            })

            if(error)
                throw new Error(error)

            $cart = {}
            pushNotification(notification, "Plots claimed!", "It may take a minute for them to appear.")
            pollUpdates()

        } catch(e) {
            console.log(e)
        } finally {
            $loadScreenOpacity = 0 
        }

    }



</script>

<Modal header="Payment" class="max-w-screen-sm" on:close={() => $paymentSession = null}>
    <div class="relative mt-3 space-y-4">
        <form on:submit|preventDefault={submit} id="payment-form">
            <div class="p-4 bg-zinc-900 outline-zinc-700 outline outline-1 rounded-2xl">
                <div id="payment-element">
                <!-- Mount the Payment Element here -->
                </div>

            </div>
            <button type="submit" class="w-full mt-4 button0" id="submit">Pay $4.99</button>
        </form>
    </div>
</Modal>