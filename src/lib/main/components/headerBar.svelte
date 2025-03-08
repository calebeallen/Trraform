
<script>

    import { fly } from "svelte/transition";
    import { goto } from "$app/navigation"
    import { dbConnection, notification, isMobileBrowser } from "$lib/main/store";
    import PlotId from "$lib/common/plotId"
    import DbConnection from "$lib/main/dbConnection"
    import { pushNotification } from "$lib/common/utils";
    import { walletConnection } from "$lib/main/store"
    import { createEventDispatcher } from "svelte";
    import { showConnectWalletModal } from "../store";

    const dispatch = createEventDispatcher()

    export let showSettings = false
    export let showMyPlots = false
    
    let plotSearchValue = "", showSearchResults = false, searchResult, searchContainer, searchResultsContainer
    let selectedDepth = 0, showDepthDropdown = false, depthDropdownOptions = ["depth 0", "depth 1", "depth 2"], depthDropdownContainer, dropdownButtonContainer
    let walletConnected = false, walletAddress, walletIcon
    let disconnectAnimationInterval = null, disconnectAnimationt = 0

    $:{

        plotSearchValue
        setShowResults()
       
    }

    function setShowResults(){

        showSearchResults = false

        if(plotSearchValue == "")

            return

        let plotId

        try { plotId = PlotId.fromHexString(plotSearchValue) }
        catch { return }

        if(!plotId.verify())

            return

        searchResult = `Plot ${plotId.string()}`
        showSearchResults = true

    }

    function search(){

        let plotId
        
        try{ plotId = PlotId.fromHexString(plotSearchValue)}
        catch{ return }

        goto(`/world?plotId=${plotId.string()}`)

        showSearchResults = false

    }

    async function findOpenPlot(){

        if($dbConnection === null)

            $dbConnection = new DbConnection()

        const plotId = await $dbConnection.getAvailablePlot(selectedDepth)

        if(plotId === null){

            pushNotification(notification, "No plots found", `No available plots found at depth ${selectedDepth}.`)
            return

        }

        goto(`/world?plotId=${plotId.string()}`)

    }


    function disconnectMousedown(){
        
        disconnectAnimationt = 0
        disconnectAnimationInterval = setInterval(() => {

            disconnectAnimationt += 0.01

            if(disconnectAnimationt >= 1){

                clearInterval(disconnectAnimationInterval)
                disconnectAnimationInterval = null

                $walletConnection.disconnect()
                .then(() => $walletConnection = null)
                
            }

        }, 10)

    }

    function mousedown(e){

        if(searchResultsContainer && !searchResultsContainer.contains(e.target) && !searchContainer.contains(e.target))

            showSearchResults = false

        if(depthDropdownContainer && !depthDropdownContainer.contains(e.target) && !dropdownButtonContainer.contains(e.target))

            showDepthDropdown = false

    }

    function mouseup(){

        clearInterval(disconnectAnimationInterval)
        disconnectAnimationInterval = null 
        disconnectAnimationt = 0

    }
    
    $:if($walletConnection === null){

        walletConnected = false

    } else {

        walletIcon = $walletConnection.connector.icon
        walletAddress = $walletConnection.address
        walletConnected = true

    }


</script>

<svelte:window on:mousedown={mousedown} on:mouseup={mouseup}/>

<div class="flex items-center gap-1 p-1 text-xs pointer-events-auto sm:gap-2 sm:p-2 bg-zinc-900 outline-1 outline outline-zinc-800 sm:rounded-2xl rounded-xl sm:text-sm">
    <div bind:this={searchContainer} class="relative flex items-center gap-1 p-1 bg-transparent">
        <img class="w-4 h-4 pointer-events-none select-none" src="/search.svg" alt="search">
        <form class="inline-flex p-0 m-0" on:submit|preventDefault={search}>
            <input bind:value={plotSearchValue} class="bg-transparent appearance-none focus:outline-none placeholder-zinc-400 placeholder:select-none" type="text" placeholder="Search plot id">
            <button tabindex="-1" class="hidden" type="submit"></button>
        </form>
        {#if showSearchResults}
            <div bind:this={searchResultsContainer} transition:fly={{ y: -5, duration: 150 }} class="right-0 translate-y-full left-5 -bottom-3.5 options-container">
                <button tabindex="-1" on:click={search} class="option bg-zinc-900 p-1.5 text-left">{searchResult}</button>
            </div>
        {/if}
    </div>
    <div class="w-px h-6 bg-zinc-700"></div>
    <div class="relative hidden sm:block">
        <div class="flex items-center transition-colors bg-blue-700 rounded-lg hover:bg-blue-600 outline-blue-600 outline outline-1">
            <button on:click={findOpenPlot} class="py-1 px-1.5 pr-0 font-semibold truncate select-none" tabindex="-1">Find open plot (depth {selectedDepth})</button>
            <button bind:this={dropdownButtonContainer} on:click={() => showDepthDropdown = !showDepthDropdown} class="p-1" tabindex="-1">
                <img class="w-4 h-4 pointer-events-none select-none" src="/dropdown.svg" alt="down arrow">
            </button>
        </div>
        {#if showDepthDropdown}
            <div bind:this={depthDropdownContainer} transition:fly={{ y: -5, duration: 150 }} class="translate-y-full right-4 -bottom-3.5 options-container">
                {#each depthDropdownOptions as option, i }
                    <button on:click={() => {
                        showDepthDropdown = false
                        selectedDepth = i
                    }} tabindex="-1" class="py-1.5 px-3 text-center option {selectedDepth == i ? "bg-zinc-800" : "bg-zinc-900"}">
                        <span class="select-none">{option}</span>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
    {#if !$isMobileBrowser}      
        {#if !walletConnected}
            <button on:click={() => $showConnectWalletModal = true} class="flex gap-1 p-1.5 items-center text-zinc-400 hover:bg-zinc-800 rounded-lg sm:rounded-xl transition-colors focus:outline-none focus:bg-zinc-800">
                <img class="w-3 pointer-events-none select-none aspect-square sm:w-4" src="/power.svg" alt="">
                <div>Connect wallet</div>
            </button>
        {:else}
            <button on:mousedown={disconnectMousedown} class="relative flex gap-1 p-1.5 items-center text-zinc-400 group focus:outline-none">
                <img class="w-3 pointer-events-none select-none aspect-square sm:w-4" src={walletIcon} alt="">
                <div class="truncate select-none max-w-20">{walletAddress}</div>
                <div class="absolute top-0 left-0 flex items-center justify-center w-full h-full overflow-hidden transition-opacity delay-100 bg-black rounded-lg opacity-0 sm:rounded-xl bg-opacity-80 group-hover:opacity-100">
                    <div class="absolute top-0 left-0 z-0 w-full h-full -translate-x-1/2 bg-red-500 opacity-40" style="transform: translateX(calc((1 - {disconnectAnimationt}) * -100%));"></div>
                    <div class="absolute text-red-400 select-none">Disconnect</div>
                </div>
            </button>
            <button on:click={() => showMyPlots = true} class="transition-opacity opacity-50 w-7 h-7 hover:opacity-80 focus:outline-none focus:opacity-80">
                <img class="pointer-events-none select-none" src="/plot1.svg" alt="">
            </button>
        {/if}
    {/if}
    <button on:click={() => showSettings = true} class="transition-opacity opacity-50 w-7 h-7 hover:opacity-80 focus:outline-none focus:opacity-80">
        <img class="pointer-events-none select-none" src="/settings.svg" alt="">
    </button>
</div>


<style lang="postcss">

    .options-container{

        @apply absolute flex flex-col items-stretch overflow-hidden rounded-lg select-none;

    }

    .option{

        @apply hover:bg-zinc-800 w-full transition-colors;

    }

</style>

