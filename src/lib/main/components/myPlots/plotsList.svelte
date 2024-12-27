
<script>

    import { onMount } from "svelte"
    import { myPlots } from "$lib/main/store"
    import WalletConnection from "$lib/main/walletConnection"
    import PlotWidget from "$lib/main/components/myPlots/plotWidget.svelte"

    export let editingPlot
    let container

    onMount( async () => {

        const { clientWidth, clientHeight } = container
        const w = clientWidth + 12
        const h = clientHeight - 12

        const widgetW = 252
        const widgetH = 332

        const fitX = Math.floor(w / widgetW)
        const fitY = Math.ceil(h / widgetH)

        //load what can fit or 5 rows
        await WalletConnection.loadMyPlots(Math.min(fitX * fitY, fitX * 5))

    })

    function onmousewheel(e){

        const { deltaY } = e
        const { clientWidth, clientHeight, scrollTop, scrollHeight } = container

        if(scrollTop + clientHeight + deltaY >= scrollHeight - 240){

            if($myPlots.length >= WalletConnection.plotIterator){

                const w = clientWidth + 12
                const widgetW = 252
                const fitX = Math.floor(w / widgetW)

                //load 2 more rows + the rest of the remaining row (if there is anything)
                const fillRow = Math.ceil(WalletConnection.plotIterator / fitX) * fitX
                const range = fillRow + fitX * 2

                WalletConnection.loadMyPlots(range)

            }

        }

    }   

</script>

<div bind:this={container} on:mousewheel|passive={onmousewheel} class="w-full h-full overflow-y-scroll hide-scrollbar">
    {#if WalletConnection.plotCount > 0}
        <div class="flex flex-wrap gap-3 py-3 pb-24 mx-auto w-60 sm:w-full md:max-w-[744px] sm:max-w-[492px]">
            {#each $myPlots as plot}
                <PlotWidget bind:editingPlot plot={plot}/>
            {/each}
        </div>
    {:else}
        <div class="w-full mt-24 text-3xl font-bold text-center">Nothing here yet!</div>
        <div class="w-full mt-1 text-center">Explore to find an open plot.</div>
    {/if}
</div>