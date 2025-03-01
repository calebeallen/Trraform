
<script>

    import { walletConnection } from "$lib/main/store"

    let walletConnected = false
    

</script>

<div class="flex items-center gap-2 p-2 bg-zinc-900 outline-1 outline outline-zinc-800 rounded-2xl">
    {#if walletConnected}
        <button class="flex gap-1 py-1 px-1.5 items-center text-sm text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors">
            <img class="w-4 h-4" src="/power.svg" alt="">
            <span>Connect wallet</span>
        </button>
    {:else}
        <button class="flex gap-1 py-1 px-1.5 items-center text-sm text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors">
            <img class="w-4 h-4" src="/coinbase.svg" alt="">
            <span>0x112323...</span>
        </button>
        <button class="transition-opacity opacity-50 w-7 h-7 hover:opacity-80">
            <img src="/plot1.svg" alt="">
        </button>
    {/if}
    <button class="transition-opacity opacity-50 w-7 h-7 hover:opacity-80">
        <img src="/settings.svg" alt="">
    </button>
</div>