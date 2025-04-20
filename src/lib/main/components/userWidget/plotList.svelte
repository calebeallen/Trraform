
<script>

    import PlotWidget from "./plotWidget.svelte";
    import { myPlots, user, newPlots} from "$lib/main/store"
    import PlotId from "$lib/common/plotId"
    import MyPlot from "$lib/main/plot/myPlot"
    import { onMount } from "svelte";

    let loadingPlots = false
    let scrollContainer
    let listContainer

    onMount(() => {
        
        const initialAmt = 6 - $myPlots.length
        loadPlots(initialAmt)

    })

    $:{
        $user
        $newPlots = 0
        const initialAmt = 6 - $myPlots.length
        loadPlots(initialAmt)
    }
    
    function onmousewheel(){

        if(!scrollContainer || !listContainer)
            return

        const scrollRect = scrollContainer.getBoundingClientRect()
        const listRect = listContainer.getBoundingClientRect()

        if(listRect.bottom - 50 <= scrollRect.bottom)
            loadPlots(6)

    }

    async function loadPlots(amount){

        if(loadingPlots)
            return

        loadingPlots = true

        const limit = Math.min($myPlots.length + amount, $user.plotIds.length)
        const loadPromises = []

        for(let i = $myPlots.length; i < limit; i++){

    
            const plotId = PlotId.fromHexString($user.plotIds[i].plotId)
            const plot = new MyPlot(plotId, $user.plotIds[i].isNew)
            $myPlots.push(plot)
            loadPromises.push(plot.load())

        }

        $myPlots = $myPlots
        await Promise.all(loadPromises)
        loadingPlots = false

    }

</script>

<div bind:this={scrollContainer} on:mousewheel={onmousewheel} class="w-full mt-3 overflow-y-auto scrollbar-clean shrink">
    {#if $user.plotIds?.length}
        <div bind:this={listContainer} class="grid grid-cols-1 gap-2 p-px mx-auto sm:grid-cols-2 sm:w-[458px] w-[224px]">
            {#each $myPlots as plot (plot?.id?.id)}
                <PlotWidget plot={plot}></PlotWidget>
            {/each}
        </div>
    {:else}
        <div class="flex flex-col items-center justify-center gap-1 h-80 sm:w-[458px] w-full">
            <img class="w-8 aspect-square" src="/plot1.svg" alt="">
            <div class="font-semibold">No plots yet</div>
            <div class="text-sm text-zinc-300">Explore to find open plots</div>
        </div>
    {/if}
</div>