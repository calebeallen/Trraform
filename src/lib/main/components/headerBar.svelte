
<script>

    import { fly } from "svelte/transition"
    import { goto } from "$app/navigation"
    import { showSettingsModal, newPlots, showAuthModal, user, showUserWidget, showCartWidget, cart } from "$lib/main/store"
    import PlotId from "$lib/common/plotId"
    import { pushNotification } from "$lib/common/utils"
    
    let plotSearchValue = "", showSearchResults = false, searchResult, searchContainer, searchResultsContainer
    let disconnectAnimationInterval = null, disconnectAnimationt = 0

    let cartItemCount = 0

    $: {
        cartItemCount = Object.keys($cart ?? {}).length
    }

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
        <img class="w-4 h-4 opacity-50 pointer-events-none select-none" src="/search.svg" alt="search">
        <form class="inline-flex p-0 m-0" on:submit|preventDefault={search}>
            <input  bind:value={plotSearchValue} class="w-full bg-transparent appearance-none focus:outline-none placeholder-zinc-400 placeholder:select-none" type="text" placeholder="Search plot id">
            <button tabindex="-1" class="hidden" type="submit"></button>
        </form>
        {#if showSearchResults}
            <div bind:this={searchResultsContainer} transition:fly={{ y: -5, duration: 150 }} class="right-0 translate-y-full left-5 -bottom-3.5 absolute flex flex-col items-stretch overflow-hidden rounded-lg select-none">
                <button tabindex="-1" on:click={search} class="hover:bg-zinc-800 w-full transition-colors bg-zinc-900 p-1.5 text-left">{searchResult}</button>
            </div>
        {/if}
    </div>
    <div class="w-px h-6 bg-zinc-700"></div>
    {#if !$user}
        <button class="px-6 button0" on:click={() => $showAuthModal = true}>Login</button>
    {:else}
        <button on:click={() => {
            $showUserWidget = !$showUserWidget
            $showCartWidget = false
        }} class="{ $showUserWidget ? "bg-zinc-800" : "" } flex items-center text-zinc-400 text-xs sm:text-sm option">
            <img class="option-icon" src="/user.svg" alt="">
            <div class="items-center hidden gap-1 px-1 sm:flex">
                <div>{$user?.username}</div>
                {#if $user.subActive}
                    <img class="w-3.5 aspect-square" src="/verified.svg" alt="" style=" display: inline;">
                {/if}
            </div>
            {#if $newPlots}
                <div class="alert">
                    <div>{$newPlots}</div>
                </div>
            {/if}
        </button>
        <button on:click={() => {
            $showCartWidget = !$showCartWidget
            $showUserWidget = false
        }} class="option { $showCartWidget ? "bg-zinc-800" : "" } ">
            <img class="option-icon" src="/cart.svg" alt="">
            {#if cartItemCount}
                <div class="alert">
                    <div>{cartItemCount}</div>
                </div>
            {/if}
        </button>
    {/if}
    <button on:click={() => $showSettingsModal = true} class="option">
        <img class="option-icon" src="/gear.svg" alt="">
    </button>
</div>


<style lang="postcss">

    .option{

        @apply relative p-1 hover:bg-zinc-800 transition-colors rounded-lg focus:outline-none shrink-0 grow-0;

    }

    .option-icon{
        @apply w-4 sm:w-5 aspect-square opacity-50 pointer-events-none select-none;
    }

    .alert{
        @apply absolute -right-1 -top-1 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-600 text-[7pt] text-white font-semibold; 
    }

</style>

