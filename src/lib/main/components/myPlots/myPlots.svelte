

<script>

    import { createEventDispatcher, onMount } from "svelte";
    import { fade } from "svelte/transition";
    import PlotsList from "$lib/main/components/myPlots/plotsList.svelte";
    import EditPlot from "$lib/main/components/myPlots/editPlot.svelte";
    import { walletConnection } from "$lib/main/store";

    let editingPlot = null
    let walletAddress = ""

    const dispatch = createEventDispatcher()

    onMount(() => {

        walletAddress = $walletConnection.address

    })
    
    function back(){

        if(editingPlot !== null)

            editingPlot = null

        else 

            dispatch("close")

    }

</script>


<div transition:fade class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30">
    <div class="w-full h-full max-w-screen-lg px-2 mx-auto">
        <div class="flex flex-row items-center justify-between gap-6 py-2 border-b">
            <h1 class="text-lg font-semibold sm:text-xl">My Plots</h1>
                <div class="flex flex-row items-center justify-center w-20 max-w-sm gap-1 grow">
                    <div class="relative w-3 h-3 shrink-0">
                        <span class="absolute w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
                        <span class="absolute w-3 h-3 bg-blue-500 rounded-full"></span>
                    </div>
                    <div class="text-xs truncate sm:text-sm max-w-32">{walletAddress}</div>
                </div>
            <button on:click={back} class="w-20 button0">Back</button>
        </div>
        {#if editingPlot === null}
            <PlotsList bind:editingPlot/>
        {:else}
            <EditPlot bind:editingPlot/>
        {/if}
    </div>
</div>