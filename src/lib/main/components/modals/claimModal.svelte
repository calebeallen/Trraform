
<script>

    import Modal from "$lib/common/components/modal.svelte"
    import Promo from "../promo.svelte";
    import { API_ORIGIN } from "$lib/common/constants"
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { insideOf } from "$lib/main/store"
    import { modalsShowing, loadScreenOpacity, notification, pendingOrder } from "$lib/main/store"
    import { pollUpdates } from "$lib/main/pollUpdates"
    import { pushNotification } from "$lib/common/utils"

    const dispatch = createEventDispatcher()

    onMount(() => $modalsShowing++)
    onDestroy(() => $modalsShowing--)

    async function claim(){

        const plotId = $insideOf.id.string()

        const res = await fetch(`${API_ORIGIN}/plot/claim-with-credit`, {
            method: "POST",
            headers: {
                "Authorization": localStorage.getItem("auth_token"),
                "Content-type": "application/json"
            },
            body: JSON.stringify({ plotId })
        })
        if(!res.ok)
            return

        $pendingOrder.add(plotId)
        pollUpdates()
        pushNotification(notification, "Plot claimed!", "It make take a minute to appear.")
        dispatch("close")
       
    }

</script>


<Modal header="Claim plot" class="max-w-sm" on:close>
    <div class="relative mt-3 space-y-4">
        <Promo/>
        <div class="w-full p-3 bg-zinc-900 outline-zinc-700 outline-1 outline rounded-2xl">
            <div class="font-semibold">Plot 0x1123</div>
            <div class="text-sm text-zinc-400 mt-0.5">Depth 0</div>
        </div>
        <button on:click={claim} class="w-full button0">Claim</button>
    </div>
</Modal>