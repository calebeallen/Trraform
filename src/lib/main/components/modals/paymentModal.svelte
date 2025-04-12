
<script>

    import { onMount } from "svelte";
    import { paymentSession, stripe, loadScreenOpacity, cart, notification, refs, justClaimed } from "$lib/main/store"
    import { API_ORIGIN } from "$lib/common/constants"
    import { page } from '$app/stores';
    import { pushNotification } from "$lib/common/utils"
    import Modal from "../../../common/components/modal.svelte";
    import { pollUpdates } from "$lib/main/pollUpdates"
    import { confetti } from "$lib/main/decoration"
    import PlotId from "$lib/common/plotId"

    let elements = null
    let total = ""

    onMount(() => {

        total = ($paymentSession.total / 100).toFixed(2)
        
        const options = {
            mode: 'payment',
            currency: 'usd',
            amount: $paymentSession.total,
            appearance: {
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
        }

        elements = $stripe.elements(options)
        const paymentElement = elements.create("payment", {
            layout: {
                type: 'accordion',
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
                    pushNotification(notification, "Something went wrong", "One or more plots in your cart are unavailable.")
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

            pushNotification(notification, "Plots claimed!", "It may take a minute for them to appear.")
            pollUpdates()
            
            //confetti on all plots
            const plotIds = []
            for(const plotId in $cart){
                $justClaimed.add(plotId)
                plotIds.push(PlotId.fromHexString(plotId))
            }

            setTimeout(() => {

                for(const id of plotIds){

                    const plot = refs.rootPlot.findPlotById(id)
                    if(plot)
                        confetti(plot.pos, plot.parent.blockSize)

                }
    
            }, 500)

            $justClaimed = $justClaimed
            $cart = {}
            localStorage.setItem("cart", JSON.stringify({}))
            return

        } catch(e) {
            console.log(e)
        } finally {
            $paymentSession = null
            $loadScreenOpacity = 0 
        }

    }



</script>

<Modal header="Payment" class="max-w-lg" on:close={() => $paymentSession = null}>
    <div class="relative mt-3 space-y-4">
        <form on:submit|preventDefault={submit} id="payment-form">
                <div id="payment-element">
                <!-- Mount the Payment Element here -->
                </div>

            <button type="submit" class="w-full mt-4 button0" id="submit">Pay ${total}</button>
        </form>
    </div>
</Modal>