<script>

    //TODO
    //stop refresh on android when scroll up
    //disable when modal
    //flag blue dot menu options
    import { insideOf, user, showAuthModal, showReportModal, showShareModal, showClaimModal, cart, notification, pendingOrder, showHowItWorksModal, editingPlot, myPlots, showUserWidget, isMobileBrowser } from "$lib/main/store"
    import { API_ORIGIN, PRICE } from "$lib/common/constants"
    import { fly } from "svelte/transition"
    import { pushNotification } from "$lib/common/utils"
    import { onMount } from "svelte";
    import MyPlot from "$lib/main/plot/myPlot"

    export let data
    
    let reportPlotId = null, sharePlotId = null
    let profile = {}
    let showProfile = false

    let showControls = false
    let plusOneAnimation = false

    let canVote = false
    let minTillVote = ""

    onMount(() => {

        if(!localStorage.getItem("show_controls") && !$isMobileBrowser){
            showControls = true
            localStorage.setItem("show_controls", true)
        }

    })

    $: if ($insideOf !== null) {

        profile = new Promise(async res => {

            const plot = $insideOf
            await plot.loadPromise
            const idStr = plot.id.string()
            let link = null

            //normalize url
            if(plot.link){
                link = plot.link
                if(!link.startsWith("https://") && !link.startsWith("http://"))
                    link = `https://${link}`
            }

            // change
            let userOwned = false
            if($user?.plotIds)
                for(const { plotId } of $user?.plotIds )
                    if(plotId == idStr){
                        userOwned = true
                        break
                    }

            res({ 
                owner : plot.owner, 
                userOwned,
                id : idStr,
                depth: plot.id.depth(),
                verified: plot.verified,
                name : plot.name || `Plot ${idStr}`, 
                desc : plot.desc,
                link,
                linkTitle : plot.linkTitle || "link"
            })

        })

        const lastVote = localStorage.getItem("time_last_vote")

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
       

    } else 
        showProfile = false


    async function castVote(id){

        plusOneAnimation = true
        setTimeout(() => plusOneAnimation = false, 1)

        canVote = false
        localStorage.setItem("time_last_vote", Date.now())
        minTillVote = 5
        await fetch(`${API_ORIGIN}/leaderboard/vote`, { 
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({ plotId: id })
        })

    }

    function addToCart(){

        const plotId = $insideOf.id

        if(Object.keys($cart ?? {}).length >= 30){
            pushNotification(notification, "Cart full", "Cart contains maximum items. Please split your order.")
            return
        }

        $cart[plotId.string()] = {
            isClaimed: false,
            depth: plotId.depth()
        }
        $cart = $cart
        localStorage.setItem("cart", JSON.stringify($cart))

    }

    function removeFromCart(){

        const plotId = $insideOf.id
        delete $cart[plotId.string()]
        $cart = $cart
        localStorage.setItem("cart", JSON.stringify($cart))

    }

    function setEditing(){

        $editingPlot = null

        setTimeout(() => {
            //check if it is already in the myplots list
            for(const plot of $myPlots){
                if(plot.id.equals($insideOf.id)){
                    $editingPlot = plot
                    $showUserWidget = true
                    return
                }
            }

            //otherwise create temp one
            const idStr = $insideOf.id.string()
            for(const { plotId } of $user.plotIds){
                if(idStr == plotId){
                    $editingPlot = new MyPlot($insideOf.id)
                    $showUserWidget = true
                    return
                }
            }
        }, 1)

    }

</script>

<svelte:head>
    
    <!-- HTML Meta Tags -->
    <title>Trraform</title>
    <meta name="description" content="Build and explore millions of worlds.">

    <!-- Facebook Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content={data?.ogUrl ?? "https://trraform.com/world"}>
    <meta property="og:title" content={data?.ogTitle ?? "Trraform"}>
    <meta property="og:description" content={data?.ogDesc ?? "Build and explore millions of worlds."}>
    <meta property="og:image" content={data?.ogImage ?? "https://trraform.com/og-image.png"}>

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta property="twitter:domain" content="trraform.com">
    <meta property="twitter:url" content={data?.ogUrl ?? "https://trraform.com/world"}>
    <meta name="twitter:title" content={data?.ogTitle ?? "Trraform"}>
    <meta name="twitter:description" content={data?.ogDesc ?? "Build and explore millions of worlds."}>
    <meta name="twitter:image" content={data?.ogImage ?? "https://trraform.com/og-image.png"}>

</svelte:head>

<svelte:document on:keydown={e => {

    const key = e.key.toLowerCase()

    if(key === "w" || key === "a" || key === "s" || key === "d")
        showControls = false

}}/>

{#if showControls}
    <div transition:fly={{ y: 25 }} class="fixed font-bold text-center -translate-x-1/2 sm:text-lg left-1/2 bottom-1/4">WASD to move, SHIFT to fly fast</div>
{/if}


<div class="fixed sm:bottom-3 bottom-2 sm:left-3 left-2 w-[calc(100vw-16px)] sm:max-w-80 transition-transform { showProfile === false ? "-translate-x-[calc(100%+20px)]" : ""}">
    <div class="relative flex flex-col gap-2.5 p-2.5 bg-zinc-900 outline-1 outline outline-zinc-800 rounded-2xl h-max">
        {#await profile}
            <div class="w-full h-20 animate-pulse">
                <div class="w-1/2 h-5 mt-1 rounded-full bg-zinc-800"></div>
                <div class="w-1/4 h-3 mt-1 rounded-full bg-zinc-800"></div>
            </div>
        {:then { id, owner, userOwned, depth, verified, name, desc, link, linkTitle } }
            <div>
                <div class="flex items-baseline justify-between gap-2">
                    <h3 class="max-w-full text-sm break-all w-max sm:text-base">{name} {#if verified}<img class="w-3.5 aspect-square" src="/verified.svg" alt="" style=" display: inline; vertical-align: middle;">{/if}</h3>
                    <div class="flex gap-2 select-none shrink-0">
                        <button on:click={() => {
                            sharePlotId = id
                            $showShareModal = true
                        }} class="relative w-4 select-none aspect-square group focus:outline-none">
                            <img src="/share.svg" alt="report">   
                            <span class="plot-option-tag">Share</span>
                        </button>
                        {#if owner}
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
                <div class="space-y-px">
                    {#if owner}
                        <div class="text-xs opacity-70"><img class="w-3 aspect-square" src="/user.svg" alt="" style=" display: inline; vertical-align: middle;"> {owner}</div>
                    {/if}
                    <div class="text-xs opacity-70">id: 0x{id}</div>
                </div>
            </div>
            <!-- if plot has an owner (owner is null), if plot is owned by user (owner will null after claiming) -->
            {#if owner || userOwned}
                {#if desc || link}
                    <div class="w-full h-px bg-zinc-800"></div>
                {/if}
                {#if owner}
                    {#if desc}
                        <p class="text-zinc-300">{desc}</p>
                    {/if}
                {/if}
                {#if link}
                    <a href={link} target="_blank" class="flex items-center gap-1 transition-opacity max-w-max opacity-70 active:opacity-40">
                        <img class="w-4 h-4" src="/link.svg" alt="link">
                        <p>{linkTitle}</p>
                    </a>
                {/if}
                {#if userOwned}
                    <button on:click={setEditing} class="p-1 text-sm font-semibold transition-colors rounded-lg bg-zinc-600 outline-zinc-500 outline outline-1 hover:bg-zinc-500">Edit plot</button>
                {:else}
                    {#if canVote}
                        <button class="mt-1 button0" on:click={() => castVote(id)}>Vote</button>
                    {:else}
                        <div class="w-full mt-1 text-sm text-center text-zinc-500">Vote again in {minTillVote} minute{#if minTillVote > 1}s{/if}.</div>
                    {/if}
                {/if}
            {:else if !$pendingOrder.has(id)}
                {#if $user}
                    <div class="w-full h-px bg-zinc-800"></div>
                    {#if $user.plotCredits}
                        <div class="text-sm">You have <strong>{$user.plotCredits}</strong> plot credit{#if $user.plotCredits > 1}s{/if}!</div>
                        <button class="mt-1 button0" on:click={() => $showClaimModal = true}>Claim</button>
                    {:else}
                        <div class="flex items-center gap-2 text-sm text-zinc-300">
                            <div>Depth {depth}</div>
                            <div class="w-px h-4 bg-zinc-700"></div>
                            <div class="text-sm">${PRICE[depth] / 100}</div>
                        </div>
                        {#if $cart && $cart[id]}
                            <button on:click={() => removeFromCart(id)} class="button0">Remove from cart</button>
                        {:else}
                            <button on:click={() => addToCart(id)} class="button0">Add to cart</button>
                        {/if}
                    {/if}
                {:else}
                    <button class="mt-1 button0" on:click={() => $showAuthModal = true}>Claim</button>
                {/if}
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