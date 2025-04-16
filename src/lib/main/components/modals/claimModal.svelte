
<script>

    import Modal from "$lib/common/components/modal.svelte"
    import { API_ORIGIN } from "$lib/common/constants"
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { insideOf } from "$lib/main/store"
    import { modalsShowing, loadScreenOpacity, notification, pendingOrder, user, showSubscriptionModal } from "$lib/main/store"
    import { pollUpdates } from "$lib/main/pollUpdates"
    import { pushNotification } from "$lib/common/utils"
    import SmokeBg from "../subscription/smokeBg.svelte";
    import Promo2 from "../subscription/promo2.svelte";

    let conflict = false

    const dispatch = createEventDispatcher()

    onMount(() => $modalsShowing++)
    onDestroy(() => $modalsShowing--)

    async function claim(){

        const plotId = $insideOf.id.string()

        $loadScreenOpacity = 50

        try {

            const res = await fetch(`${API_ORIGIN}/plot/claim-with-credit`, {
                method: "POST",
                headers: {
                    "Authorization": localStorage.getItem("auth_token"),
                    "Content-type": "application/json"
                },
                body: JSON.stringify({ plotId })
            })

            const { data } = await res.json()

            console.log(data)

            if(data?.conflict){
                
                conflict = true
                return
            }

            else if(!res.ok)
                throw new Error()

            $pendingOrder.add(plotId)
            pollUpdates({
                subscription: false,
                plotIds: new Set([plotId])
            })
            pushNotification(notification, "Plot claimed!", "It make take a minute to appear.")
            dispatch("close")

        } catch {
            pushNotification(notification, "Something went wrong", "We're looking into this, please try again later.")
        } finally {
            $loadScreenOpacity = 0
        }

    }

</script>


<Modal header="Claim plot?" class="max-w-sm" on:close>
    <div class="relative mt-3 space-y-4">
        {#if !$user?.subActive}
            <Promo2/>
        {/if}
        <div class="flex justify-between w-full p-3 bg-zinc-900 outline-zinc-700 outline-1 outline rounded-2xl">
            <div>
                <div class="flex gap-1 font-semibold">
                    <div>Plot 0x1123</div>
                    {#if $user?.subActive}
                        <img class="w-3.5 aspect-square" src="/verified.svg" alt="">
                    {/if}
                </div>
                <div class="text-sm text-zinc-400 mt-0.5">Depth 0</div>
            </div>
            <img class="w-10 pointer-events-none select-none aspect-square" src="/plot1.svg" alt="">
        </div>
        {#if conflict}
            <div class="text-xs text-red-500">Plot unavailable, it may have already been claimed.</div>
        {:else}
            <button on:click={claim} class="w-full button0">Confirm</button>
        {/if}
    </div>
</Modal>