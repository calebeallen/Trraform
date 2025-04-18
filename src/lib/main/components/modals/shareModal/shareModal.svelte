
<script>

    import { onMount, createEventDispatcher, onDestroy } from "svelte";
    import { IMAGES_BUCKET_URL } from "$lib/common/constants"
    import { decodePlotData } from "$lib/common/utils"
    import MyPlots from "$lib/main/plot/myPlot"
    import { fade, fly } from "svelte/transition";
    import PlotId from "$lib/common/plotId";
    import ShareOptionLink from "./shareOptionLink.svelte";
    import ShareOptionButton from "./shareOptionButton.svelte";
    import { notification, modalsShowing, insideOf } from "$lib/main/store"
    import { pushNotification } from "$lib/common/utils"

    const dispatch = createEventDispatcher();

    let plotIdStr
    let plotImgSrc
    let xPostIntent, threadsPostIntent  
    let load = true
    let contentContainer
    
    onMount(async () => {

        $modalsShowing++

        plotIdStr = $insideOf.id.string()

        if($insideOf.owner !== null)
            plotImgSrc = $insideOf.id.getImgUrl()
        else    
            plotImgSrc = "/default.png"

        const encoded = encodeURI(`https://trraform.com/world?plotId=${plotIdStr}`)
        const message = encodeURIComponent("Check out this plot on #trraform")
        const param = `?url=${encoded}&text=${message}`

        xPostIntent = `https://twitter.com/intent/tweet${param}`
        threadsPostIntent = `https://www.threads.net/intent/post${param}`

        load = false

    })

    onDestroy(() => $modalsShowing--)

    function copyToClipboard(){

        navigator.clipboard.writeText(`https://trraform.com/world?plotId=${plotIdStr}`)
        pushNotification(notification, "Plot link copied", "Thanks for sharing!")
        close()

    }

    function close(){

        dispatch("close")   

    }

    function click(e){

        if(!contentContainer.contains(e.target))
            dispatch("close")

    }

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:click={click} transition:fade={{duration: 150}} class="fixed top-0 left-0 grid w-full h-full px-2 overflow-auto bg-black bg-opacity-50 place-items-center">
    <div bind:this={contentContainer} transition:fly={{duration: 150, y: 50}} class="relative outline outline-1 outline-zinc-700 rounded-3xl w-full max-w-96 aspect-[0.75] shadow-2xl shadow-black bg-zinc-900">
        {#if load}
            <div class="w-full h-full animate-pulse bg-zinc-900 rounded-3xl"></div>
            <div class="absolute top-0 left-0 flex items-baseline justify-between w-full p-4">
                <div class="w-56 h-5 rounded-full bg-zinc-800 animate-pulse"></div>
                <button on:click={() => dispatch("close")} class="w-5 h-5 transition-opacity active:opacity-60">
                    <img src="/close.svg" alt="close">
                </button>
            </div>
        {:else}
            <img class="object-cover h-full rounded-3xl" src={plotImgSrc} alt="build">
            <div class="absolute top-0 left-0 flex items-baseline justify-between w-full p-4">
                <h1 class="font-bold sm:text-lg">Share Plot 0x{plotIdStr}</h1>
                <button on:click={() => dispatch("close")} class="w-5 h-5 transition-opacity active:opacity-60">
                    <img src="/close.svg" alt="close">
                </button>
            </div>
            <div class="absolute flex gap-4 -translate-x-1/2 w-max bottom-10 left-1/2 ">
                <ShareOptionButton src="/link.svg" tag="Copy link" on:click={copyToClipboard}/>
                <ShareOptionLink src="/x.svg" tag="X" href={xPostIntent} on:click={close}/>
                <ShareOptionLink src="/threads.svg" tag="Threads" href={threadsPostIntent} on:click={close}/>
            </div>
        {/if}
    </div>
</div>