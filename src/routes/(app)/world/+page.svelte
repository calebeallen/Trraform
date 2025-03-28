<script>

    //TODO
    //stop refresh on android when scroll up
    //disable when modal
    //flag blue dot menu options

    import { page } from "$app/stores"
    import { onMount } from "svelte";
    import { insideOf, refs, isMobileBrowser, showMyPlots, plotSearchFocused, showSettingsModal, showHowItWorksModal } from "$lib/main/store"
    import ReportModal from "$lib/main/components/reportModal.svelte";
    import { setCookie, getCookie } from "$lib/common/cookie"

    import ShareModal from "$lib/main/components/share/shareModal.svelte";
    import ClaimModal from "$lib/main/components/claimModal.svelte";
    import { fly } from "svelte/transition";

    export let data 
    let lastTouches = []
    
    let showConnectModal = false, showReportModal = false, showShareModal = false, showClaimModal = false
    let reportPlotId = null, sharePlotId = null
    let profile = {}
    let showProfile = false

    let plusOneAnimation = false

    let canVote = false
    let minTillVote = ""

    onMount(() => {

        cancelKeyEvent()

    })

    function keydown(e){

        if( showConnectModal || showReportModal || showShareModal || showClaimModal || $plotSearchFocused || $showMyPlots || $showSettingsModal )

            return

        const key = e.key.toLowerCase()

        if(key === "w" || key === "a" || key === "s" || key === "d")

            refs.camera.update = refs.camera.standard

        switch(key){

            case "w":

                refs.camera.forward = true
                break

            case "s":

                refs.camera.backward = true
                break

            case "d":

                refs.camera.right = true
                break

            case "a":

                refs.camera.left = true
                break
            
            case "shift":   
                
                refs.camera.accelerationMultiplier = 4
                break

        }

    }

    function keyup(e){

        const key = e.key.toLowerCase()

        switch(key){

            case "w":

                refs.camera.forward = false
                break

            case "s":

                refs.camera.backward = false
                break

            case "d":

                refs.camera.right = false
                break

            case "a":

                refs.camera.left = false
                break

            case "shift":

                refs.camera.accelerationMultiplier = 1
                break

        }

    }

    function cancelKeyEvent(){

        if(refs.camera){

            refs.camera.forward = refs.camera.backward = refs.camera.right = refs.camera.left = false
            refs.camera.accelerationMultiplier = 1

        }

    }

    function mousewheel(e){
        
        if( showConnectModal || showReportModal || showShareModal || showClaimModal || $showMyPlots || $plotSearchFocused || $showSettingsModal )

            return

        if(refs.camera.update === refs.camera.autoRotate)

            refs.camera.update = refs.camera.orbit

        refs.camera.scrollVelocity -= e.deltaY / 100

    }

    function touchevent(e){ 

        if( showConnectModal || showReportModal || showShareModal || showClaimModal || $showMyPlots || $plotSearchFocused || $showSettingsModal || refs.camera.update === refs.camera.standard )

            return

        refs.camera.update = refs.camera.orbit

        const { touches } = e

        if(lastTouches.length === 1){
        
            const lastTouch = lastTouches[0]

            //there may be multiple new touches, but they will be new touch events if last touches has length is 1
            for(const touch of touches){

                if(touch.identifier === lastTouch.identifier){

                    const touchPos = { x: touch.clientX, y: touch.clientY }
                    const lastTouchPos = { x: lastTouch.clientX, y: lastTouch.clientY }

                    const dx = touchPos.x - lastTouchPos.x
                    const dy = touchPos.y - lastTouchPos.y

                    const { route } = $page

                    if( route?.id === "/(app)/[id]" && refs.camera.update === refs.camera.autoRotate)

                        refs.camera.update = refs.camera.orbit

                    refs.camera.angularVelocityDamping = 1e-6
                    refs.camera.angularVelocity.theta += - dx / window.innerWidth * Math.PI * 20
                    refs.camera.angularVelocity.phi += dy / window.innerHeight * Math.PI * 20

                }

            }

        } else if (lastTouches.length === 2) {

            let sameTouches = 0

            for(const lastTouch of lastTouches)
            for(const touch of touches)

                if(touch.identifier == lastTouch.identifier)

                    sameTouches++

            if(sameTouches === 2){

                const len1 = Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY)
                const len2 = Math.hypot(lastTouches[1].clientX - lastTouches[0].clientX, lastTouches[1].clientY - lastTouches[0].clientY)

                refs.camera.scrollVelocity -= (len2 - len1) / 10

            }

        }

        lastTouches = touches

    }

    $: if ($insideOf !== null) {

        profile = new Promise(async res => {

            const plot = $insideOf
            await plot.load()

            const idStr = plot.id.string()

            let link = null

            //normalize url
            if(plot.link){

                link = plot.link

                if(!link.startsWith("https://") && !link.startsWith("http://"))

                    link = `https://${link}`

            }

            res({ 
                minted : plot.minted, 
                id : idStr,
                name : plot.name || `Plot ${idStr}`, 
                desc : plot.desc,
                link,
                linkLabel : plot.linkLabel || "link"
            })

        })

        const lastVote = localStorage.getItem("tsLastVote")


        if(lastVote === null){
            canVote = true
        } else {
            const tsLastVote = parseInt(lastVote)
            const MIN_5 = 5 * 60 * 1000;
            const timeLeft = MIN_5 - (Date.now() - tsLastVote)

            if(timeLeft < 0)
                canVote = true
            else {
                canVote = false
                minTillVote = Math.ceil((timeLeft) / 1000 / 60)
            }
        }

        showProfile = true
       

    } else {
        
        showProfile = false

    }

    function refresh(){

        refs.renderManager.refresh($insideOf)

    }

    async function castVote(id){

        plusOneAnimation = true
        setTimeout(() => plusOneAnimation = false, 1)


        canVote = false
        localStorage.setItem("tsLastVote", Date.now())
        minTillVote = 5
        await fetch(`https://api.trraform.com/cast-vote?plotId=${id}`, { method: "POST" })


    }

</script>

<svelte:head>
    
    <!-- HTML Meta Tags -->
    <title>Trraform</title>
    <meta name="description" content="Millions of worlds powered by Polygon.">

    <!-- Facebook Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content={data?.ogUrl ?? "https://trraform.com/world"}>
    <meta property="og:title" content={data?.ogTitle ?? "Trraform"}>
    <meta property="og:description" content={data?.ogDesc ?? "Millions of worlds powered by Polygon."}>
    <meta property="og:image" content={data?.ogImage ?? "https://trraform.com/banner.png"}>

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta property="twitter:domain" content="trraform.com">
    <meta property="twitter:url" content={data?.ogUrl ?? "https://trraform.com/world"}>
    <meta name="twitter:title" content={data?.ogTitle ?? "Trraform"}>
    <meta name="twitter:description" content={data?.ogDesc ?? "Millions of worlds powered by Polygon."}>
    <meta name="twitter:image" content={data?.ogImage ?? "https://trraform.com/banner.png"}>

</svelte:head>

<svelte:window
    on:blur={cancelKeyEvent}
    on:contextmenu={cancelKeyEvent}
    on:visibilitychange={cancelKeyEvent}
    on:touchstart|passive={touchevent} 
    on:touchmove|passive={touchevent} 
    on:touchend|passive={touchevent} 
    on:mousewheel|passive={mousewheel} 
/>

<svelte:document
    on:keydown={keydown}
    on:keyup={keyup}
/>


<div class="fixed sm:bottom-3 bottom-2 sm:left-3 left-2 w-[calc(100vw-16px)] sm:max-w-80 transition-transform { showProfile === false ? "-translate-x-[calc(100%+20px)]" : ""}">
    <div class="relative p-2.5 bg-zinc-900 outline-1 outline outline-zinc-800 rounded-2xl h-max flex flex-col gap-1">
        {#await profile}
            <div class="w-full h-20 animate-pulse">
                <div class="w-1/4 h-3 mt-0.5 rounded-full bg-zinc-700"></div>
                <div class="w-1/2 h-4 mt-1 rounded-full bg-zinc-700"></div>
            </div>
        {:then { id, minted, name, desc, link, linkLabel } }
                <div class="flex justify-between gap-1">
                    <h3 class="max-w-full text-sm break-all w-max sm:text-base">{name}</h3>
                    <div class="select-none shrink-0">
                        <button on:click={refresh} class="relative w-3.5 sm:w-4 select-none aspect-square group focus:outline-none">
                            <img src="/refresh.svg" alt="report">   
                            <span class="plot-option-tag">Refresh</span>
                        </button>
                        <button on:click={() => {
                            sharePlotId = id
                            showShareModal = true
                        }} class="relative w-3.5 sm:w-4 aspect-square select-none group focus:outline-none">
                            <img src="/share.svg" alt="report">   
                            <span class="plot-option-tag">Share</span>
                        </button>
                        {#if minted}
                            <button on:click={() => {
                                reportPlotId = id
                                showReportModal = true
                            }} class="relative w-3.5 sm:w-4 aspect-square select-none group focus:outline-none">
                                <img src="/report.svg" alt="report">
                                <span class="plot-option-tag">Report</span>
                            </button>
                        {/if}
                    </div>
                </div>
            <div class="text-xs opacity-70">id: {id}</div>
            {#if (!minted || desc || link) && !$isMobileBrowser}
                <div class="w-full h-px bg-zinc-800"></div>
            {/if}
            {#if minted}
                {#if desc}
                    <p>{desc}</p>
                {/if}
                {#if link}
                    <a href={link} target="_blank" class="flex items-center gap-1 transition-opacity max-w-max opacity-70 active:opacity-40">
                        <img class="w-4 h-4" src="/link.svg" alt="link">
                        <p>{linkLabel}</p>
                    </a>
                {/if}
                {#if canVote}
                    <button class="mt-1 button0" on:click={() => castVote(id)}>Cast Vote</button>
                {:else}
                    <div class="w-full mt-1 text-sm text-center text-zinc-500">Vote again in {minTillVote} minutes</div>
                {/if}
            {:else}
                <button class="mt-1 button0" on:click={() => showClaimModal = true}>Claim</button>
            {/if}
        {/await}
    </div>
    {#if plusOneAnimation == true}
        <div out:fly={{ y: -150, opacity: 0, duration: 2000 }} class="absolute top-0 left-0 w-full text-3xl font-bold text-center pointer-events-none rotate-12 -z-10">+1</div>
    {/if}
</div> 

{#if showShareModal}
    <ShareModal bind:plotIdStr={sharePlotId} on:close={() => showShareModal = false}/>
{/if}

{#if showReportModal}
    <ReportModal bind:plotIdStr={reportPlotId} on:close={() => showReportModal = false}/>
{/if}

{#if showClaimModal}
    <ClaimModal bind:plot={$insideOf} on:close={() => showClaimModal = false}/>
{/if}

<style lang="postcss">

    h3 {

        @apply font-semibold;

    }

    p {

        @apply text-xs sm:text-sm;

    }

    .plot-option-tag {

        @apply absolute text-xs font-semibold transition-opacity opacity-0 pointer-events-none select-none w-max bottom-0 -translate-x-1/2 -translate-y-full mb-0.5 left-1/2 group-hover:opacity-100;

    }
    
    .button{

        @apply mt-1 w-full px-2 py-1 text-xs sm:text-sm text-center transition-colors bg-blue-700 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed hover:bg-blue-600 focus:outline-none outline outline-1 outline-blue-600 focus:bg-blue-600 font-semibold;

    }

</style>