<script>

    import { goto } from "$app/navigation"
    import { createEventDispatcher } from "svelte"
    import Modal from "$lib/common/components/modal.svelte"
    import WalletConnection from "$lib/main/walletConnection";
    import { onDestroy, onMount } from "svelte";
    import { D0_MINT_PRICE, TEMP_LOCK_MINT_PRICE, MAX_DEPTH } from "$lib/common/constants";
    import LogoAnimated from "$lib/common/components/logoAnimated.svelte";
    import { fly } from "svelte/transition";
    import { formatEther, parseEther } from "viem";
    import { loadScreenOpacity, insideOf, myPlots, notification } from "$lib/main/store"
    import { pushNotification } from "$lib/common/utils"
    import MyPlot from "$lib/main/plot/myPlot";
    import Plot from "$lib/main/plot/plot"

    const dispatch = createEventDispatcher()

    export let plot
    let plotId
    let plotIdStr = ""
    let address
    let depth
    let isPlotAvailablePromise
    let mintPricePromise
    let mintPriceWei
    let mintLockChecked = false
    let isAvailable = false
    let interval

    onMount(() => {

        plotId = plot.id
        plotIdStr = plotId.string()
        depth = plotId.depth()
        address = WalletConnection.getCurrentAddress().substring(0,12) + "..."
        interval = setInterval(refresh, 15000)
        refresh()

    })

    onDestroy(() => {

        clearInterval(interval)

    })

    function refresh(){

        mintPricePromise = getSmp()
        isPlotAvailablePromise = getPlotAvailability()

    }

    async function getSmp(){

        const parentPlotId = plotId.getParent(plotId)

        if(parentPlotId.id == 0){
        
            mintPriceWei = parseEther(D0_MINT_PRICE.toString())
            return D0_MINT_PRICE

        }

        const smpWei = mintPriceWei = await WalletConnection.getSmp(parentPlotId)
        return formatEther(smpWei)

    }

    async function getPlotAvailability(){

        isAvailable = false
        const { available, status } = await WalletConnection.getPlotAvailability(plotId)
        isAvailable = available

        if(!available)

            clearInterval(interval)
        
        return status

    }

    async function mint(){

        try {

            $loadScreenOpacity = 50

            const hash = await WalletConnection.mint(plotId, mintLockChecked, mintPriceWei)

            pushNotification(notification, `Your transaction is processing.`, "This may take a minute, please do not close this window.")

            await WalletConnection.txSuccess(hash)

            $myPlots.unshift(new MyPlot(plotId, true))
        
            plot.minted = true

            if (depth < MAX_DEPTH)

                plot.createChildPlots(...Plot.defaultChildPlots(plot.buildSize))
                
            pushNotification(notification, `Plot ${plotIdStr} minted!`, 'Go to the "My Plots" tab to edit your new plot.', () => goto("/myplots"))
            dispatch("success", plot)

        } catch(e) {

            pushNotification(notification, "Minting failed", "This transaction could not be completed on chain.")
            
        } finally {

            $loadScreenOpacity = 0

        }

    
    }

</script>


<Modal class="max-w-sm" header="Mint" on:close>
    <div class="space-y-2">
        <div class="flex items-center justify-between content-container">
            <div>
                <div class="font-semibold ">Plot {plotIdStr}</div>  
                <div class="text-xs text-zinc-300">To address: {address}</div> 
            </div>
            {#await isPlotAvailablePromise}
                <div class="w-6 h-6">
                    <LogoAnimated/> 
                </div>
            {:then status} 
                {#if isAvailable}
                    <div transition:fly={{ y: 10 }} class="px-1.5 py-px text-xs text-green-300 font-semibold bg-green-900 rounded-full select-none">{status}</div>
                {:else}
                    <div transition:fly={{ y: 10 }} class="px-1.5 py-px text-xs text-zinc-300 font-semibold bg-zinc-700 rounded-full select-none">{status}</div>
                {/if}
            {/await} 
        </div>
        {#if depth < 2}
            <div class="content-container">
                <div class="flex items-baseline justify-between gap-2">
                    <div>
                        <span class="text-sm font-semibold">Mint lock</span>
                        <p class="text-xs text-zinc-300">Mint lock allows you to block other users from minting this plot's subplots for <b class="text-xs text-white">one hour</b>. During this hour, you will have the ability to mint subplots for a <b class="text-xs text-white">set price of {TEMP_LOCK_MINT_PRICE} ETH</b>. Once mint lock expires, all subplots left unminted will be available to anyone.<b class="text-xs text-white"> You cannot turn on mint lock after minting the plot!</b> This option is free but will increase gas cost.</p>
                    </div>
                    <div class="inline-flex items-center">
                        <label class="relative flex items-center cursor-pointer">
                            <input bind:checked={mintLockChecked} type="checkbox" class="w-4 h-4 transition-all rounded shadow appearance-none cursor-pointer outline-1 outline peer hover:shadow-md outline-zinc-700 bg-zinc-800 checked:outline-blue-600 checked:bg-blue-600" id="check" />
                            <span class="absolute text-white transform -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none peer-checked:opacity-100 top-1/2 left-1/2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" stroke-width="1">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                            </span>
                        </label>
                    </div> 
                </div>
            </div>
        {/if}
        <div class="flex-1 h-px bg-zinc-600"></div>
        <div class="flex items-baseline justify-between">
            <div class="font-semibold">
                <div class="text-sm">Total</div>
                <div class="text-xs text-zinc-300">*excluding gas fee</div>
            </div>
            {#await mintPricePromise}
                <div class="w-32 h-3 rounded-full bg-zinc-700 animate-pulse"></div>
            {:then mintPrice} 
                <span class="text-sm">{mintPrice} ETH</span>
            {/await}
        </div>
        {#await isPlotAvailablePromise}
            <div class="w-full rounded-lg h-7 bg-zinc-700 animate-pulse"></div>
        {:then _} 
            {#if isAvailable}
                <button class="w-full button0" on:click={mint}>Mint</button>
            {/if}
        {/await} 
    </div>
</Modal>

<style lang="postcss">

    .content-container{

        @apply w-full p-3 rounded-xl bg-zinc-900 outline outline-1 outline-zinc-700

    }

</style>