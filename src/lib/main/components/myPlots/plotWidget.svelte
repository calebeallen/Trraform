
<script>

    //todo add share button

    import { onMount } from "svelte";
    import { goto } from "$app/navigation"
    import { showMyPlots } from "$lib/main/store"
    import PlotWidgetOption from "$lib/main/components/myPlots/plotWidgetOption.svelte";
    import { IMPLEMENTATION_CONTRACT_ADDRESS } from "$lib/main/walletConnection"

    export let editingPlot
    export let plot
    let plotData = {}
    let loading = false

    onMount( async () => {

        loading = true

        await plot.load()
        
        const id = plot.id.string()
        const DAY = 24 * 60 * 60 * 1000
        const now = Date.now()
        const banned = now < plot.rEnd

        let tag = null

        if (plot.isNew) 

            tag = { text: `New`, color : "#2563eb" }

        if (banned)

            tag = { text: `Banned for ${Math.floor((plot.rEnd - now) / DAY)} days.`, color : "#880000" }
        
        plotData = {
            id,
            name: plot.name || `Plot ${id}`,
            imgUrl: await plot.getImgUrl(),
            tag,
            banned
        }

        loading = false

    })

</script>

<div class="relative flex-none overflow-hidden transition-colors w-56 aspect-[0.75] rounded-2xl outline-1 outline outline-zinc-800 bg-zinc-900 group">
    {#if loading}
        <div class="w-full h-full animate-pulse bg-zinc-900">
            <div class="head-container">
                <div class="w-1/2 h-5 mt-1 rounded-full bg-zinc-800"></div>
                <div class="w-1/4 h-4 mt-1 rounded-full bg-zinc-800"></div>
            </div>
        </div>
    {:else}
        <div class="head-container">
            <h3 class="text-xs">{plotData.id}</h3>
            <h2 class="font-bold truncate sm:text-lg">{plotData.name}</h2>
            {#if plotData.tag}
                <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full" style="background-color: {plotData.tag.color};"></div>
                    <div class="text-xs text-zinc-400">{plotData.tag.text}</div>
                </div>
            {/if}   
        </div>
        <img class="object-cover h-full" src={plotData.imgUrl} alt="build"/> 
        <div class="absolute bottom-0 flex flex-col w-full gap-px p-1 transition-opacity opacity-0 group-hover:opacity-100">
            <PlotWidgetOption on:click={() => {
                $showMyPlots = false
                goto(`/world?plotId=${plotData.id}`)
            }} src="/navigate.svg" alt="navigate" text="Go to"/>
            {#if !plotData.banned}
                <PlotWidgetOption on:click={() => editingPlot = plot} src="/pencil.svg" alt="pencil" text="Edit"/>
            {/if} 
            <PlotWidgetOption src="/sell.svg" text="Sell" on:click={() => window.open(`https://rarible.com/token/polygon/${IMPLEMENTATION_CONTRACT_ADDRESS}:${plot?.id?.id}`)}/>
        </div>
    {/if}
</div>

<style lang="postcss">

    .head-container{

        @apply absolute top-0 left-0 w-full p-2;

    }

</style>
 