
<script>

    import LogoAnimated from "../../../common/components/logoAnimated.svelte";
    import { fly } from 'svelte/transition';
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher()

    export let connectedId
    export let connectingId

    export let id
    export let name
    export let icon
    export let isLastConnected

</script>

<div class="relative">
    <button on:click={() => dispatch("click", {id})} class="flex items-center justify-between w-full p-2 transition-colors rounded-xl bg-zinc-900 outline outline-1 outline-zinc-700 hover:bg-opacity-60">
        <div class="flex items-center gap-2">
            <img src={icon} alt="Wallet icon" class="w-8 h-8 rounded"/>
            <div class="font-semibold text-left">{name}</div> 
        </div>
        <div class="mr-2">
            {#if connectedId === id} 
                <div transition:fly={{y:10}} class="px-1.5 py-px text-xs text-green-300 font-semibold bg-green-900 rounded-full">Connected</div>
            {:else if connectingId === id}
                <div class="w-6 h-6">
                    <LogoAnimated/> 
                </div>
            {:else if isLastConnected}
                <div class="px-1.5 py-px text-xs text-zinc-300 font-semibold bg-zinc-700 rounded-full">Last Connected</div>
            {/if}
        </div>
    </button>
    {#if connectingId}
        <div class="absolute left-0 top-0 w-full h-full bg-opacity-30 rounded-xl {connectingId === id ? "bg-transparent" : "bg-black"}"></div>
    {/if}
</div>