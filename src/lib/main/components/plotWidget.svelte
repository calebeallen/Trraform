
<script>

    import { onMount } from "svelte";
    import { NavigateSVG, EditSVG, Logo } from "@packages/ui";
    import IconButton from "./iconButton.svelte";

    export let plot
    let load = new Promise(() => {})

    onMount( () => load = (async () => {

        await plot.load()
        
        const id = plot.id.string()
        const DAY = 24 * 60 * 60 * 1000
        const now = Date.now()
        const banned = now < plot.rEnd

        let tag = null

        if (plot.isNew) {

            tag = { text: `New`, color : "#2563eb" }
            plot.removeIsNew()

        }

        if (banned)

            tag = { text: `Banned for ${Math.floor((plot.rEnd - now) / DAY)} days`, color : "#880000" }
        
        return {
            id,
            name: plot.name || `Plot ${id}`,
            imgUrl: await plot.getImgUrl(),
            tag,
            banned
        }


    })())

</script>

<div class="transition-colors plot-container group">
    {#await load}
        <div class="w-full h-full animate-pulse bg-zinc-900">
            <div class="head-container">
                <div class="w-1/2 h-5 mt-1 rounded-full bg-zinc-800"></div>
                <div class="w-1/4 h-4 mt-1 rounded-full bg-zinc-800"></div>
            </div>
        </div>
    {:then {id, name, imgUrl, tag, banned}}
        {#if plot.status}
            <div class="absolute w-40 py-0.5 origin-center bg-blue-600 top-7 right-7 translate-x-1/2 -translate-y-1/2 rotate-45 text-xs text-center">{plot.status}</div>
        {/if}
        <div class="head-container">
            <h2>{id}</h2>
            <h1>{name}</h1>
            {#if tag}
                <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full" style="background-color: {tag.color};"></div>
                    <div class="text-xs text-zinc-400">{tag.text}</div>
                </div>
            {/if}   
        </div>
        {#if imgUrl}
            <img src={imgUrl} alt="build"/> 
        {:else}
            <div class="relative w-full h-full">
                <div class="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 opacity-50 left-1/2 top-1/2">
                    <Logo/>
                </div>
            </div>
        {/if}
        <div class="absolute top-0 left-0 w-full h-full group">
            <div class="absolute bottom-0 flex flex-col w-full gap-0.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <IconButton content="Go to plot" href="/{id}">
                    <NavigateSVG/>
                </IconButton>
                {#if !banned}
                    <IconButton content="Edit plot" href="/myplots/{id}">
                        <EditSVG/>
                    </IconButton>
                {/if}
            </div>
        </div>
    {/await}
</div>

<style lang="postcss">

    h1{

        @apply text-lg font-bold truncate;

    }

    h2{

        @apply text-xs;

    }

    .head-container{

        @apply absolute top-0 left-0 w-full p-2;

    }

</style>
 