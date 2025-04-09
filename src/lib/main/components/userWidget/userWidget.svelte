

<script>
    
    import { fly } from "svelte/transition";
    import PlotList from "./plotList.svelte";
    import EditPlot from "./editPlot.svelte";
    import { user, showUserWidget } from "$lib/main/store"

    let selectedDepth = 0, showDepthDropdown = false, depthDropdownOptions = ["depth 0", "depth 1", "depth 2"], depthDropdownContainer, dropdownButtonContainer
    let showUserOptions, userOptionsContainer, userOptionsButton
    let editingPlot = null

    function mousedown(e){

        if(depthDropdownContainer && !depthDropdownContainer.contains(e.target) && !dropdownButtonContainer.contains(e.target))
            showDepthDropdown = false

        if(userOptionsContainer && !userOptionsContainer.contains(e.target) && !userOptionsButton.contains(e.target))
            showUserOptions = false


    }

    function changeUsername(){

        showUserOptions = false


    }

    function cancelSubscription(){

        showUserOptions = false


    }

    function logout(){

        showUserOptions = false
        localStorage.setItem("auth_token", null)
        $showUserWidget = false
        $user = null

    }

</script>

<svelte:window on:mousedown={mousedown}/>


<div class="flex flex-col h-full p-4 max-h-max bg-zinc-900 rounded-2xl outline-zinc-800 outline outline-1 pointer-events-auto">
    <!-- header -->
    <div class="flex items-center justify-between gap-3 p-2 text-xs bg-zinc-800 outline-zinc-700 outline outline-1 rounded-xl sm:text-sm">
        <div class="relative flex items-center gap-0.5 ml-1">        
            <div class="font-semibold truncate shrink">CalebAllen318</div>
            <button bind:this={userOptionsButton} on:click={() => showUserOptions = !showUserOptions} class="h-full">
                <img class="w-4 sm:w-5 aspect-square" src="/dots.svg" alt="">
            </button>
            {#if showUserOptions}
                <div bind:this={userOptionsContainer} transition:fly={{ y: -5, duration: 150 }} class="right-0 w-max expanded-options-container -bottom-2 bg-zinc-950">
                    <button on:click={changeUsername} tabindex="-1" class="expanded-option">
                        <span class="select-none">Change username</span>
                    </button>
                    <button on:click={cancelSubscription} tabindex="-1" class="expanded-option">
                        <span class="select-none">Cancel subscription</span>
                    </button>
                    <button on:click={logout} tabindex="-1" class="expanded-option">
                        <span class="text-red-500 select-none">Log out</span>
                    </button>
                </div>
            {/if}
        </div>
        <!-- find open plots -->
        <div class="relative">
            <div class="flex items-center transition-colors bg-blue-700 rounded-lg hover:bg-blue-600 outline-blue-600 outline outline-1">
                <button class="py-1 px-1.5 pr-0 font-semibold truncate select-none" tabindex="-1">Find open plot (depth {selectedDepth})</button>
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
    {#if editingPlot === null}
        <PlotList bind:editingPlot/>
    {:else}
        <EditPlot bind:editingPlot/>
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