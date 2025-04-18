
<script>

    //todo add share button

    import { onMount } from "svelte";
    import { goto } from "$app/navigation"

    export let editingPlot
    export let plot
    let plotData = {}
    let loading = true

    onMount( async () => {

        await plot.load()
        const plotIdStr = plot.id.string()
        plotData = {
            isNew: plot.isNew,
            id: plotIdStr,
            name: plot.name || `Plot 0x${plotIdStr}`,
            imgUrl: await plot.getImgUrl()
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
            <h2 class="text-sm font-bold truncate sm:text-base">{plotData.name}</h2>
            <h3 class="text-xs">id: 0x{plotData.id}</h3>
        </div>
        <img class="object-cover h-full" src={plotData.imgUrl} alt="build"/> 
        <div class="absolute bottom-0 flex flex-col w-full gap-px p-1 transition-opacity opacity-0 group-hover:opacity-100">
            <button on:click={() => goto(`/world?plotId=${plotData.id}`)} class="flex items-center w-full gap-1 px-1 py-0.5 bg-zinc-950 bg-opacity-0 rounded-xl hover:bg-opacity-50">
                <img class="w-3.5 sm:w-4 aspect-square" src="/goto.svg" alt="">
                <div class="text-xs sm:text-sm">Go to</div>
            </button>
            <button on:click={() => editingPlot = plot} class="flex items-center w-full gap-1 px-1 py-0.5  bg-zinc-950 bg-opacity-0 rounded-xl hover:bg-opacity-50">
                <img class="w-3.5 sm:w-4 aspect-square" src="/pencil.svg" alt="">
                <div class="text-xs sm:text-sm">Edit</div>
            </button>
        </div>
    {/if}
    {#if plotData.isNew}
        <div class="absolute w-24 py-px text-xs font-semibold text-center origin-center rotate-45 translate-x-1/2 bg-blue-700 top-2 right-4">NEW</div>
    {/if}
</div>

<style lang="postcss">

    .head-container{

        @apply absolute top-0 left-0 w-full p-2;

    }

</style>
 