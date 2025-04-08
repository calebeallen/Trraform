
<script>

    import Modal from "$lib/common/components/modal.svelte"
    import Promo from "../promo.svelte";

    async function claim(){

        const

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
        <button class="w-full button0">Claim</button>
    </div>
</Modal>
