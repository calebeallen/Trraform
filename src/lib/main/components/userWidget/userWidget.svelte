

<script>
    
    import { fly } from "svelte/transition";
    import PlotList from "./plotList.svelte";
    import EditPlot from "./editPlot.svelte";
    import { user, showUserWidget, myPlots, showChangeUsernameModal, notification, newPlots } from "$lib/main/store"
    import { pushNotification } from "$lib/common/utils"
    import { goto } from "$app/navigation"
    import { API_ORIGIN } from "$lib/common/constants"
    import { onMount } from "svelte";

    let selectedDepth = 0, showDepthDropdown = false, depthDropdownOptions = ["depth 0", "depth 1", "depth 2"], depthDropdownContainer, dropdownButtonContainer
    let showUserOptions, userOptionsContainer, userOptionsButton
    let editingPlot = null
    let disableFindOpenPlot = false

    onMount(() => $newPlots = 0)

    function mousedown(e){

        if(depthDropdownContainer && !depthDropdownContainer.contains(e.target) && !dropdownButtonContainer.contains(e.target))
            showDepthDropdown = false

        if(userOptionsContainer && !userOptionsContainer.contains(e.target) && !userOptionsButton.contains(e.target))
            showUserOptions = false


    }

    async function findOpenPlot(){

        disableFindOpenPlot = true

        const res = await fetch(`${API_ORIGIN}/plot/open?depth=${selectedDepth}`, {
            method: "GET",
            headers: {
                "Authorization": localStorage.getItem("auth_token"),
                "Content-type": "application/json"
            }
        })

        disableFindOpenPlot = false

        if(!res.ok){
            pushNotification(notification, "No plots found", `No open plots found at depth ${selectedDepth}`)
            return
        }

        const { data } = await res.json()

        goto(`/world?plotId=${data.plotId}`)

    }

    function cancelSubscription(){

        showUserOptions = false


    }

    function logout(){

        showUserOptions = false
        localStorage.setItem("auth_token", null)
        $showUserWidget = false
        $myPlots = []
        $user = null

    }

</script>

<svelte:window on:mousedown={mousedown}/>


<div class="flex flex-col h-full p-4 pointer-events-auto max-h-max bg-zinc-900 rounded-2xl outline-zinc-800 outline outline-1">
    <!-- header -->
    <div class="flex items-center justify-between gap-3 pb-4 text-xs border-b sm:text-sm border-zinc-800">
        <div class="relative flex items-center gap-0.5 ml-1">        
            <div class="text-sm font-semibold truncate shrink sm:text-base">{$user?.username}</div>
            {#if $user?.subscribed}
                <img class="w-3.5 aspect-square" src="/verified.svg" alt="">
            {/if}
            <button bind:this={userOptionsButton} on:click={() => showUserOptions = !showUserOptions} class="h-full">
                <img class="w-4 sm:w-5 aspect-square" src="/dots.svg" alt="">
            </button>
            {#if showUserOptions}
                <div bind:this={userOptionsContainer} transition:fly={{ y: -5, duration: 150 }} class="right-0 w-max expanded-options-container -bottom-2 bg-zinc-950">
                    <button on:click={() => {
                        $showChangeUsernameModal = true
                        showUserOptions = false
                    }} tabindex="-1" class="expanded-option">
                        <span class="select-none">Change username</span>
                    </button>
                    {#if $user?.subscribed}
                        <button on:click={cancelSubscription} tabindex="-1" class="expanded-option">
                            <span class="select-none">Cancel subscription</span>
                        </button>
                    {/if}
                    <button on:click={logout} tabindex="-1" class="expanded-option">
                        <span class="text-red-500 select-none">Log out</span>
                    </button>
                </div>
            {/if}
        </div>
        <!-- find open plots -->
        <div class="relative">
            <div class="flex items-center transition-colors bg-blue-700 rounded-lg hover:bg-blue-600 outline-blue-600 outline outline-1 {disableFindOpenPlot ? "opacity-70 pointer-events-none" : ""}">
                <button on:click={findOpenPlot} class="py-1 px-1.5 pr-0 font-semibold truncate select-none" tabindex="-1">Find open plot (depth {selectedDepth})</button>
                <button bind:this={dropdownButtonContainer} on:click={() => showDepthDropdown = !showDepthDropdown} class="p-1" tabindex="-1">
                    <img class="w-4 h-4 pointer-events-none select-none" src="/dropdown.svg" alt="down arrow">
                </button>
            </div>
            {#if showDepthDropdown}
                <div bind:this={depthDropdownContainer} transition:fly={{ y: -5, duration: 150 }} class="expanded-options-container right-4 -bottom-2">
                    {#each depthDropdownOptions as option, i }
                        <button on:click={() => {
                            showDepthDropdown = false
                            selectedDepth = i
                        }} tabindex="-1" class="expanded-option {selectedDepth == i ? "bg-zinc-900" : "bg-zinc-950"}">
                            <span class="select-none">{option}</span>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
    <!-- plots list -->
    {#if $user}
        {#if editingPlot === null}
            <PlotList bind:editingPlot/>
        {:else}
            <EditPlot bind:editingPlot/>
        {/if}
    {/if}
</div>

<style lang="postcss">

    .expanded-options-container{

        @apply z-10 absolute flex flex-col items-stretch overflow-hidden rounded-lg select-none translate-y-full text-sm;

    }

    .expanded-option{

        @apply hover:bg-zinc-900 transition-colors py-1.5 px-3 text-center;

    }

</style>