
<script>

    import Modal from "$lib/common/components/modal.svelte"
    import Promo from "../promo.svelte";
    import { API_ORIGIN } from "$lib/common/constants"
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { insideOf } from "$lib/main/store"
    import { modalsShowing, loadScreenOpacity, stripe } from "$lib/main/store"


    const dispatch = createEventDispatcher()
    let showPayment = false

    onMount(() => $modalsShowing++)
    onDestroy(() => $modalsShowing--)

    async function claim(){

        const plotId = $insideOf.id.string()

        const res = await fetch(`${API_ORIGIN}/plot/claim-with-credit`, {
            method: "POST",
            headers: {
                Authorization: localStorage.getItem("auth_token")
            },
            body: JSON.stringify({
                plotId: plotId
            })
        })
        if(!res.ok)
            return

        dispatch("close")

    }

    async function stripeTest(params) {

        $loadScreenOpacity = 50
        let clientSecret = ""
        try{

            const res = await fetch(`${API_ORIGIN}/plot/init-paid-claim`, {
                method: "POST",
                headers: {
                    "Authorization": localStorage.getItem("auth_token"),
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    plotId: $insideOf.id.string()
                })
            })

            const { data, message } = await res.json()

            if(!res.ok)
                throw new Error(message)

            console.log(data)
            clientSecret = data.clientSecret

        }catch(e){
            console.error(e)
        }finally{
            $loadScreenOpacity = 0
        }

        showPayment = true

        const options = {
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
            },
            clientSecret
        }
        const elements = $stripe.elements(options)
        const paymentElement = elements.create("payment", {
            layout: {
                type: 'tabs',
                defaultCollapsed: false,
            }
        });
        setTimeout(() => paymentElement.mount("#payment-element"), 1)

    }

</script>


<Modal header="Claim plot" class="max-w-sm" on:close>
    <div class="relative mt-3 space-y-4">
        <Promo/>
        <div class="w-full p-3 bg-zinc-900 outline-zinc-700 outline-1 outline rounded-2xl">
            <div class="font-semibold">Plot 0x1123</div>
            <div class="text-sm text-zinc-400 mt-0.5">Depth 0</div>
        </div>
        <div class="text-sm">You have <b>2</b> plot credits available!</div>
        <button on:click={stripeTest} class="w-full button0">Claim</button>
    </div>
</Modal>

{#if showPayment }
    
<Modal header="Payment" class="max-w-md" on:close={() => showPayment = false}>
    <div class="relative mt-3 space-y-4">
       
            <form id="payment-form">
                <div class="p-4 bg-zinc-900 outline-zinc-700 outline outline-1 rounded-2xl">
                    <div id="payment-element">
                    <!-- Mount the Payment Element here -->
                    </div>

            </div>
                <button class="w-full mt-4 button0" id="submit">Pay $4.99</button>
            </form>
    </div>
</Modal>

{/if}