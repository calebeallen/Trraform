
<script>

    import { fly } from "svelte/transition"
    import { goto } from "$app/navigation"
    import { showSettingsModal, newPlots, showAuthModal, user, showUserWidget } from "$lib/main/store"
    import PlotId from "$lib/common/plotId"
    import { pushNotification } from "$lib/common/utils"
    
    let plotSearchValue = "", showSearchResults = false, searchResult, searchContainer, searchResultsContainer
    let disconnectAnimationInterval = null, disconnectAnimationt = 0

    $:{
        
        plotSearchValue //don't delete! not a mistake!
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

        searchResult = `Plot 0x${plotId.string()}`
        showSearchResults = true

    }

    function search(){

        let plotId
        
        try{ plotId = PlotId.fromHexString(plotSearchValue)}
        catch{ return }

        goto(`/world?plotId=${plotId.string()}`)

        showSearchResults = false

    }

    function mousedown(e){

        if(searchResultsContainer && !searchResultsContainer.contains(e.target) && !searchContainer.contains(e.target))
            showSearchResults = false

    }

    function mouseup(){

        clearInterval(disconnectAnimationInterval)
        disconnectAnimationInterval = null 
        disconnectAnimationt = 0

    }
    

</script>

<svelte:window on:mousedown={mousedown} on:mouseup={mouseup}/>

<div class="relative flex items-center gap-1 p-1 text-xs pointer-events-auto sm:gap-2 sm:p-2 bg-zinc-900 outline-1 outline outline-zinc-800 sm:rounded-2xl rounded-xl sm:text-sm">
    <div bind:this={searchContainer} class="relative flex items-center gap-1 p-1 bg-transparent">
        <img class="w-4 h-4 pointer-events-none select-none opacity-70" src="/search.svg" alt="search">
        <form class="inline-flex p-0 m-0" on:submit|preventDefault={search}>
            <input  bind:value={plotSearchValue} class="w-full bg-transparent appearance-none focus:outline-none placeholder-zinc-400 placeholder:select-none" type="text" placeholder="Search plot id">
            <button tabindex="-1" class="hidden" type="submit"></button>
        </form>
        {#if showSearchResults}
            <div bind:this={searchResultsContainer} transition:fly={{ y: -5, duration: 150 }} class="right-0 translate-y-full left-5 -bottom-3.5 options-container">
                <button tabindex="-1" on:click={search} class="option bg-zinc-900 p-1.5 text-left">{searchResult}</button>
            </div>
        {/if}
    </div>
    <div class="w-px h-6 bg-zinc-700"></div>
    {#if !$user}
        <button class="px-6 button0" on:click={() => $showAuthModal = true}>Login</button>
    {:else}
        <button on:click={() => $showUserWidget = !$showUserWidget} class="{ $showUserWidget ? "bg-zinc-800" : "" } flex gap-1 items-center text-zinc-400 text-xs sm:text-sm py-1 pl-2 pr-3 hover:bg-zinc-800 transition-colors rounded-lg">
            <img class="w-3.5 opacity-60 aspect-square" src="/user.svg" alt="">
            <div>{$user?.username}</div>
        </button>
    {/if}
    <button on:click={() => $showSettingsModal = true} class="transition-opacity opacity-50 w-7 shrink-0 aspect-square hover:opacity-80 focus:outline-none">
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

