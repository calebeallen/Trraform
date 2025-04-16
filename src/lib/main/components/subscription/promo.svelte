
<script>

    import SmokeBg from "./smokeBg.svelte";
    import { showSubscriptionModal } from "$lib/main/store"

</script>

<button on:click={() => $showSubscriptionModal = true} class="block w-full p-3 mb-2 ml-auto overflow-hidden text-left transition-colors bg-black pointer-events-auto max-w-96 rounded-2xl hover:bg-zinc-900 outline outline-1 outline-zinc-800">
    <div class="relative pointer-events-none">
        <SmokeBg/>
        <div class="relative flex items-center justify-between gap-1">
            <div>  
                <div class="font-extrabold"><b>"i just need space rn.."</b></div>
                <div class="mt-1 text-sm font-semibold"><b>Support Trraform</b> and get <b>8x greater </b> build space, <b>6 extra plots</b>, verifed badges, and more!</div>
            </div>
        <img class="h-20 rounded " src="/space.png" alt="">
        </div>
    </div>
</button>