<script>

    //TODO
    //stop refresh on android when scroll up
    //disable when modal
    //flag blue dot menu options
    import { insideOf, user, showAuthModal, showReportModal, showShareModal, showClaimModal } from "$lib/main/store"
    import { fly } from "svelte/transition"

    export let data
    
    let reportPlotId = null, sharePlotId = null
    let profile = {}
    let showProfile = false

    let plusOneAnimation = false

    let canVote = false
    let minTillVote = ""

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
    <meta property="og:description" content={data?.ogDesc ?? "Millions of worlds."}>
    <meta property="og:image" content={data?.ogImage ?? "https://trraform.com/banner.png"}>

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta property="twitter:domain" content="trraform.com">
    <meta property="twitter:url" content={data?.ogUrl ?? "https://trraform.com/world"}>
    <meta name="twitter:title" content={data?.ogTitle ?? "Trraform"}>
    <meta name="twitter:description" content={data?.ogDesc ?? "Millions of worlds."}>
    <meta name="twitter:image" content={data?.ogImage ?? "https://trraform.com/banner.png"}>

</svelte:head>

<div class="fixed sm:bottom-3 bottom-2 sm:left-3 left-2 w-[calc(100vw-16px)] sm:max-w-80 transition-transform { showProfile === false ? "-translate-x-[calc(100%+20px)]" : ""}">
    <div class="relative p-2.5 bg-zinc-900 outline-1 outline outline-zinc-800 rounded-2xl h-max flex flex-col gap-1">
        {#await profile}
            <div class="w-full h-20 animate-pulse">
                <div class="w-1/2 h-5 mt-1 rounded-full bg-zinc-800"></div>
                <div class="w-1/4 h-3 mt-1 rounded-full bg-zinc-800"></div>
            </div>
        {:then { id, minted, name, desc, link, linkLabel } }
                <div class="flex justify-between gap-2">
                    <h3 class="max-w-full text-sm break-all w-max sm:text-base">{name}</h3>
                    <div class="flex gap-2 select-none shrink-0">
                        <button on:click={() => {
                            sharePlotId = id
                            $showShareModal = true
                        }} class="relative w-4 select-none aspect-square group focus:outline-none">
                            <img src="/share.svg" alt="report">   
                            <span class="plot-option-tag">Share</span>
                        </button>
                        {#if minted}
                            <button on:click={() => {
                                reportPlotId = id
                                $showReportModal = true
                            }} class="relative w-4 select-none aspect-square group focus:outline-none">
                                <img src="/report.svg" alt="report">
                                <span class="plot-option-tag">Report</span>
                            </button>
                        {/if}
                    </div>
                </div>
            <div class="text-xs opacity-70">id: {id}</div>
            {#if desc || link}
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
                <button class="mt-1 button0" on:click={() => {
                    if(!$user)
                        $showAuthModal = true
                    else
                        $showClaimModal = true
                }}>Claim</button>
            {/if}
        {/await}
    </div>
    {#if plusOneAnimation == true}
        <div out:fly={{ y: -150, opacity: 0, duration: 2000 }} class="absolute top-0 left-0 w-full text-3xl font-bold text-center pointer-events-none rotate-12 -z-10">+1</div>
    {/if}
</div> 



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

</style>