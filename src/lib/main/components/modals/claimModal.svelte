
<script>

    import Modal from "$lib/common/components/modal.svelte"
    import Promo from "../promo.svelte";
    import { API_ORIGIN } from "$lib/common/constants"
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { insideOf } from "$lib/main/store"
    import { modalsShowing } from "$lib/main/store"

    const dispatch = createEventDispatcher()

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

</script>


<Modal header="Claim plot" class="max-w-sm" on:close>
    <div class="relative mt-3 space-y-4">
        <Promo/>
        <div class="w-full p-3 bg-zinc-900 outline-zinc-700 outline-1 outline rounded-2xl">
            <div class="font-semibold">Plot 0x1123</div>
            <div class="text-sm text-zinc-400 mt-0.5">Depth 0</div>
        </div>
        <div class="text-sm">You have <b>2</b> plot credits available!</div>
        <button on:click={claim} class="w-full button0">Claim</button>
    </div>
</Modal>
