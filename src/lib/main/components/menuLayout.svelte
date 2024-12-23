
<script>

    import { walletAddress } from "../store"
    import { createEventDispatcher } from "svelte"

    const dispatchEvent = createEventDispatcher()

    export let heading = ""

</script>

<div class="flex flex-col w-full h-full max-w-screen-md px-2 mx-auto">
    <div class="flex flex-row items-center justify-between gap-6 py-2 border-b">
        <span class="text-xl font-bold">{heading}</span>
            {#if $walletAddress}
                <div class="flex flex-row items-center justify-center w-20 max-w-sm gap-1 grow">
                    <div class="relative w-3 h-3 shrink-0 group">
                        <span class="absolute p-1 text-xs font-semibold transition-opacity delay-100 -translate-y-1/2 rounded-lg opacity-0 top-1/2 right-4 whitespace-nowrap bg-zinc-900 group-hover:opacity-100">Wallet Connected</span>
                        <span class="absolute w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
                        <span class="absolute w-3 h-3 bg-blue-500 rounded-full"></span>
                    </div>
                    <div class="text-sm truncate max-w-32">{$walletAddress}</div>
                </div>
            {/if}
        <button on:click={() => dispatchEvent("back")} class="w-20 button0">Back</button>
    </div>
    <slot/>
</div>
