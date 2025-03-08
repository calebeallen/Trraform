
<script>

    import { fly } from "svelte/transition";
    import { goto } from "$app/navigation"
    import { dbConnection, notification } from "$lib/main/store";
    import PlotId from "$lib/common/plotId"
    import DbConnection from "$lib/main/dbConnection"
    import { pushNotification } from "$lib/common/utils";

    let plotSearchValue = "", showSearchResults = false, searchResult, searchContainer, searchResultsContainer
    let selectedDepth = 0, showDepthDropdown = false, depthDropdownOptions = ["depth 0", "depth 1", "depth 2"], depthDropdownContainer, dropdownButtonContainer

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

    function mousedown(e){

        if(searchResultsContainer && !searchResultsContainer.contains(e.target) && !searchContainer.contains(e.target))

            showSearchResults = false

        if(depthDropdownContainer && !depthDropdownContainer.contains(e.target) && !dropdownButtonContainer.contains(e.target))

            showDepthDropdown = false

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

</script>

<svelte:window on:mousedown={mousedown}/>

<div class="flex items-center gap-2 p-2 bg-zinc-900 outline-1 outline outline-zinc-800 rounded-2xl">
    <div class="relative">
        <div bind:this={searchContainer} class="flex items-center gap-1 p-1 bg-transparent">
            <img class="w-4 h-4 pointer-events-none select-none" src="/search.svg" alt="search">
            <form class="inline-flex p-0 m-0" on:submit|preventDefault={search}>
                <input bind:value={plotSearchValue} class="w-full text-sm bg-transparent appearance-none max-w-44 focus:outline-none placeholder-zinc-400 placeholder:select-none" type="text" placeholder="Search plot id">
                <button tabindex="-1" class="hidden" type="submit"></button>
            </form>
            {#if showSearchResults}
                <div bind:this={searchResultsContainer} transition:fly={{ y: -5, duration: 150 }} class="right-0 translate-y-full left-5 -bottom-3 options-container">
                    <button tabindex="-1" on:click={search} class="option bg-zinc-900 p-1.5 text-left">{searchResult}</button>
                </div>
            {/if}
        </div>
    </div>
    <div class="w-px h-6 bg-zinc-700"></div>
    <div class="relative">
        <div class="flex items-center transition-colors bg-blue-700 rounded-lg hover:bg-blue-600 outline-blue-600 outline outline-1">
            <button on:click={findOpenPlot} class="py-1 px-1.5 pr-0 text-sm font-semibold" tabindex="-1">Find available (depth {selectedDepth})</button>
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
</div>


<style lang="postcss">

    .options-container{

        @apply absolute flex flex-col items-stretch overflow-hidden rounded-lg;

    }

    .option{

        @apply hover:bg-zinc-800 text-sm w-full transition-colors;

    }

</style>

