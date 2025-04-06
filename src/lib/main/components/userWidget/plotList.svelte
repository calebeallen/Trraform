
<script>

    import PlotWidget from "./plotWidget.svelte";
    import { myPlots, user } from "$lib/main/store"
    import PlotId from "$lib/common/plotId"
    import { onMount } from "svelte";

    export let editingPlot
    let loadingPlots = false

    let scrollContainer
    let listContainer

    onMount(async () => {

        loadMorePlots()

        //load the amount that can fit in frame
        const width = listContainer.clientWidth 
        const height = scrollContainer.clientHeight
        const w = 244, h = w * 4/3
        const gap = 8

        const nx = Math.round((width + gap) / (w + gap))
        const ny = Math.ceil((height + gap) / (h + gap))

        const loadAmt = Math.min($user.plotIds.length - $myPlots.length, Math.max(nx * ny - $myPlots.length, 0) ) 

        loadingPlots = true
        

    })
    
    
    function onmousewheel(){

        const scrollRect = scrollContainer.getBoundingClientRect()
        const listRect = listContainer.getBoundingClientRect()

        if(listRect.bottom - 50 <= scrollRect.bottom)
            loadMorePlots()

    }


    async function loadMorePlots(){


        if(!loadingPlots)
            return

        loadingPlots = true

        setTimeout(() => {

            loadingPlots = false

        })


    }

    async function getPlotData(plotIds){

        const res = await fetch(`${API_ORIGIN}/user/plots`, {
            headers: { Authorization: localStorage.getItem("auth_token") }
        })
        const { data, error, message } = await res.json()

        if(error)
            throw new Error(message)

        const plots = {}

        for(const item of data){

            const plotId = new PlotId(item.plotId)

            const buildDataU8 = item.buildData
            const dv = new DataView(buildDataU8.buffer)
            const len = buildDataU8.length / 2
            const buildData = new Uint16Array(len)
            
            for (let i = 0; i < len; i++) 
                buildData[i] = dv.getUint16(i * 2, true)

            const plotData = {
                name: plotData.name,
                desc: plotData.description,
                link: plotData.link,
                linkTitle: plotData.linkTitle,
                buildData
            }

            plots[plotId.string()] = plotData

        }

        return plots

    }


</script>

<div bind:this={scrollContainer} on:mousewheel={onmousewheel} class="w-full mt-4 overflow-y-auto scrollbar-clean shrink">
    <div bind:this={listContainer} class="grid grid-cols-1 gap-2 p-px mx-auto sm:grid-cols-2 sm:w-[458px] w-[224px]">
        {#each myPlots as plot (plot.id)}
            <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
        {/each}
        <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
        <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
        <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
        <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
        <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
    </div>
</div>