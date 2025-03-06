
<script>

    import Modal from "$lib/common/components/modal.svelte"
    import Tip from "$lib/common/components/tip.svelte";
    import { onDestroy, onMount } from "svelte";
    import { fly } from "svelte/transition";
    import WalletConnection from "../_walletConnection";
    import { formatEther } from "viem";
    import { lock } from "ethers";
    import { walletConnection } from "$lib/main/store"
    import { showConnectWalletModal } from "../store";
    import { MAX_BUILD_SIZES } from "$lib/common/constants";

    export let plot
    let header = ""
    let plotIdStr
    let depth
    let buildSize
    let refreshInterval
    let refreshingAvailability = false, refreshingQuote = false
    let quote = 0
    let availability = "Loading"
    let paymentMethod = "USDC"
    let isParentOwner = false

    let paymentMethodsContainer, expandPaymentMethodsButton
    let royaltiesExpanded = false, paymentMethodsExpanded = false

    onMount(async () => {

        plotIdStr = plot.id.string()
        depth = plot.id.depth()
        buildSize = MAX_BUILD_SIZES[depth]
        
        if($walletConnection !== null && depth > 0){

            const owner = await WalletConnection.getOwnerOf(plot.id)
            isParentOwner = owner === $walletConnection.address

        }

        refreshInterval = setInterval(refresh, 10000)

        refresh()

    })

    onDestroy(() => clearInterval(refreshInterval))

    function refresh(){

        const refreshAvailability = async () => {

            refreshingAvailability = true

            const owner = await WalletConnection.getOwnerOf(plot.id)
            if(owner !== null){

                availability = "Claimed"

            } else if (depth > 0) {

                const parentId = plot.id.getParent()
                const lockedDuration = await WalletConnection.getTempLock(parentId)

                if(lockedDuration >= 0 && !isParentOwner) 

                    availability = "Locked"

                else

                    availability = "Available"

            } else 

                availability = "Available"
            
            refreshingAvailability = false

        }

        const refreshPOLQuote = async () => {

            refreshingQuote = true

            const quoteInt = await WalletConnection.getQuotePOL(isParentOwner)
            let quoteVal = Number(formatEther(quoteInt))
            quoteVal *= 1.03
            quote = quoteVal.toFixed(3)

            refreshingQuote = false
        
        }

        if(availability === "Available" || availability === "Loading")

            refreshAvailability()

        if (paymentMethod === "POL") {

            refreshPOLQuote()
           
        } else

            quote = WalletConnection.getQuoteUSDC(isParentOwner)


    }

    function mousedown(e){

        if(paymentMethodsContainer && !expandPaymentMethodsButton.contains(e.target) && !paymentMethodsContainer.contains(e.target))

            paymentMethodsExpanded = false

    }

    function claim(){

        if($walletConnection === null){

            $showConnectWalletModal = true
            return

        }

    }

</script>

<svelte:window on:mousedown={mousedown}/>

<Modal class="max-w-md" header="Make it Yours" on:close>
    <div class="flex flex-col gap-2 mt-2">
        <div class="flex flex-col gap-2 content-container">
            <div class="flex items-baseline justify-between w-full">
                <div class="flex items-center w-full gap-2">
                    <div class="font-semibold">Plot {plotIdStr}</div>  
                    <div class="{refreshingAvailability ? "opacity-50" : ""} {availability === "Available" ? "text-blue-300 bg-blue-900" : "text-zinc-400 bg-zinc-700"} transition-opacity px-1.5 py-px text-xs font-semibold rounded-full select-none">{availability}</div>
                </div>
                <div class="font-bold">$10</div>
            </div>
            <div class="text-sm text-zinc-300">{buildSize}x{buildSize}x{buildSize} maximum build volume</div>
            {#if depth < 2}
                <div class="text-sm text-zinc-300">Claim subplots for <b class="text-white">40% off</b></div>
                <button on:click={() => royaltiesExpanded = !royaltiesExpanded} class="w-full p-2 mt-1 transition-colors bg-yellow-700 rounded-lg outline-yellow-600 hover:bg-yellow-600 outline-1 outline">
                    <div class="flex items-center justify-between">
                        <div class="text-sm font-extrabold">Royalties (up to $144)</div>
                        <img class="w-4 h-4 {royaltiesExpanded ? "rotate-180" : ""} transition-transform" src="/dropdown.svg" alt="">
                    </div>
                    <div class="transition-all text-left text-sm overflow-hidden w-full {royaltiesExpanded ? "h-32" : "h-0"}">
                        <div class="mt-0.5">We split the sale of subplots with you. 60% royalties (payed in USDC) are sent to your wallet when one of this plot's 24 subplots are claimed.</div>
                        <div class="mt-1"><b class="font-semibold">Limitations:</b> This is a one-time benefit that applies to the initial sale of a subplot. Royalties are not available to depth 2 plots.</div>
                    </div>
                </button>
            {/if}
        </div>
        {#if depth < 2}
            <div class="content-container">
                <div class="flex items-baseline justify-between gap-2">
                    <div>
                        <span class="font-semibold">Temporarily lock subplots</span>
                        <div class="mt-1 text-sm text-zinc-300">Block all wallets besides your own from claiming subplots for <b>1 hour</b>. This option is free, but can only be turned on <b>once, before you claim the plot</b>.</div>
                    </div>
                    <div class="inline-flex items-center">
                        <label class="relative flex items-center cursor-pointer">
                            <input type="checkbox" class="w-4 h-4 transition-all rounded shadow appearance-none cursor-pointer outline-1 outline peer hover:shadow-md outline-zinc-700 bg-zinc-800 checked:outline-blue-600 checked:bg-blue-700" id="check" />
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
        <div class="w-full h-px bg-zinc-700"></div>
        <div class="flex items-center justify-between">
            <div class="font-semibold">Payment method</div>
            <div class="relative">
                <button bind:this={expandPaymentMethodsButton} on:click={() => paymentMethodsExpanded = !paymentMethodsExpanded} class="flex items-center gap-1.5 p-1.5 text-sm rounded-lg bg-zinc-900 outline outline-1 outline-zinc-700">
                    {#if paymentMethod === "USDC"}
                        <img class="w-5 h-5 rounded-full" src="/usdcLogo.png" alt="">
                        <div class="text-sm font-semibold">USDC</div>
                        <img class="w-4 h-4" src="/dropdown.svg" alt="">
                    {:else if paymentMethod === "POL"}
                        <img class="w-5 h-5 rounded-full" src="/polygonLogoBg.png" alt="">
                        <div class="text-sm font-semibold">POL</div>
                        <img class="w-4 h-4" src="/dropdown.svg" alt="">
                    {/if}
                </button>
                {#if paymentMethodsExpanded}
                    <div bind:this={paymentMethodsContainer} transition:fly={{ y: -5, duration: 100}} class="absolute left-0 right-0 z-10 overflow-hidden translate-y-full rounded-lg -bottom-1 bg-zinc-900">
                        <button on:click={() => {
                            paymentMethod = "USDC"
                            paymentMethodsExpanded = false
                            refresh()
                        }} class="flex w-full gap-1.5 p-1.5 hover:bg-zinc-800 bg-opacity-50 transition-colors items-center">
                            <img class="w-5 h-5 rounded-full" src="/usdcLogo.png" alt="">
                            <div class="text-sm font-semibold">USDC</div>
                        </button>
                        <button on:click={() => {
                            paymentMethod = "POL"
                            paymentMethodsExpanded = false
                            refresh()
                        }} class="flex w-full gap-1.5 p-1.5 hover:bg-zinc-800 bg-opacity-50 transition-colors items-center">
                            <img class="w-5 h-5 rounded-full" src="/polygonLogoBg.png" alt="">
                            <div class="text-sm font-semibold">POL</div>
                        </button>
                    </div>
                {/if}
            </div>
        </div>
        <div class="flex items-center justify-between">
            <div class="font-semibold">
                <div>Subtotal</div>
                <div class="text-xs text-zinc-300">*Does not include gas fee</div>
            </div>
            <div class="flex items-baseline gap-1">
                {#if paymentMethod === "POL"}
                <Tip class="bottom-0 right-4" text="POL payments are converted to USDC under the hood with Uniswap's v3 protocol. The price shown here is inflated by 3% to account for slippage and pool fees needed for the swap. Any POL not used will be automatically refunded."/>
                {/if}
                <div class="font-semibold transition-opacity {refreshingQuote ? "opacity-50" : ""}">{quote}</div>
                <div class="text-xs text-zinc-300">{paymentMethod}</div>
            </div>
        </div>
        <button on:click={claim} class="p-1 mt-1 font-semibold text-center transition-colors bg-blue-700 rounded-lg outline outline-1 outline-blue-600 hover:bg-blue-600">Claim</button>
    </div> 
</Modal>

<style lang="postcss">

    .content-container{

        @apply w-full p-3 rounded-xl bg-zinc-900 outline outline-1 outline-zinc-700

    }

</style>