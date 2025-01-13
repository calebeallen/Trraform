<script>

    //TODO
    //stop refresh on android when scroll up
    //disable when modal
    //flag blue dot menu options

    import { page } from "$app/stores"
    import { goto } from "$app/navigation"
    import { onMount } from "svelte";
    import { insideOf, refs, notification, newPlots } from "$lib/main/store"
    import SettingsModal from "$lib/main/components/settings/settingsModal.svelte";
    import ConnectWalletModal from "$lib/main/components/connectWallet/connectWalletModal.svelte";
    import ReportModal from "$lib/main/components/reportModal.svelte";
    import { pushNotification } from "$lib/common/utils";
    import PlotId from "$lib/common/plotId"
    import { confetti } from "$lib/main/decoration"
    import WalletConnection from "$lib/main/walletConnection";
    import MenuOption from "./menuOption.svelte";
    import ShareModal from "$lib/main/components/share/shareModal.svelte";
    import MintModal from "$lib/main/components/mintModal.svelte";

    export let data 
    let menuExpanded = false
    let searchValue = ""
    let searchFocused = false
    let lastTouches = []
    
    let showSettingsModal = false, showConnectModal = false, showReportModal = false, showShareModal = false, showMintModal = false
    let reportPlotId = null, sharePlotId = null, mintPlot = null
    let profile = {}
    let showProfile = false

    onMount(() => {

        cancelKeyEvent()

    })

    function keydown(e){

        if(showSettingsModal || showConnectModal || showReportModal || showShareModal || showMintModal)

            return

        const key = e.key.toLowerCase()

        if(searchFocused){

            if( key === "enter")

                search()

            return

        }

        if(key === "w" || key === "a" || key === "s" || key === "d" || key === " " || key === "control")

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
        
        if(showSettingsModal || showConnectModal || showReportModal || showShareModal)

            return

        if(refs.camera.update === refs.camera.autoRotate)

            refs.camera.update = refs.camera.orbit

        refs.camera.scrollVelocity -= e.deltaY / 100

    }

    function touchevent(e){ 

        if(showSettingsModal || showConnectModal || showReportModal || showShareModal || refs.camera.update === refs.camera.standard)

            return

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

    async function prepMint(){

        if (WalletConnection.isConnected || await WalletConnection.reconnect()) {

            showConnectModal = false
            mintPlot = $insideOf
            showMintModal = true
        
        } else 

            showConnectModal = true

    }

    async function search() {

        if(searchValue == "")

            return

        //go forward with search if plot ids are legit
        try{

            const pagePlotId = PlotId.fromHexString($page.params.id)
            const searchPlotId = PlotId.fromHexString(searchValue)

            if(!searchPlotId.verify()){

                pushNotification(notification, "Invalid plot id", `Plot "${searchValue}" does not exist.`)
                return

            }

            //only push changed browser state
            if(!pagePlotId.equals(searchPlotId))

                goto(searchPlotId.string())

        } catch {

            pushNotification(notification, "Plot not found", `Could not locate plot with id "${searchValue}".`)

        }

    }

    $: if ($insideOf?.id?.id) {

        profile = getProfile($insideOf)
        showProfile = true
        profile.then(data => {

            if(data.minted)

                reportPlotId = data.id

        })
       

    } else {
        
        showProfile = false

    }

    async function getProfile(plot) {
        
        await plot.load()

        const idStr = plot.id.string()

        let link = null

        //normalize url
        if(plot.link){

            link = plot.link

            if(!link.startsWith("https://") && !link.startsWith("http://"))

                link = `https://${link}`

        }

        return { 
            minted : plot.minted, 
            id : idStr,
            name : plot.name || `Plot ${idStr}`, 
            desc : plot.desc,
            link,
            linkLabel : plot.linkLabel || "link"
        }

    }

    function refresh(){

        refs.renderManager.unrenderChunkById($insideOf.chunk.id)
        $insideOf.clear()
        profile = getProfile($insideOf)

    }

</script>

<svelte:head>
    
    <!-- HTML Meta Tags -->
    <title>Trraform</title>
    <meta name="description" content="Millions of worlds powered by Ethereum.">

    <!-- Facebook Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content={data?.ogUrl ?? "https://trraform.com/world"}>
    <meta property="og:title" content={data?.ogTitle ?? "Trraform"}>
    <meta property="og:description" content={data?.ogDesc ?? "Millions of worlds powered by Ethereum."}>
    <meta property="og:image" content={data?.ogImage ?? "https://trraform.com/ogImage.png"}>

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta property="twitter:domain" content="trraform.com">
    <meta property="twitter:url" content={data?.ogUrl ?? "https://trraform.com/world"}>
    <meta name="twitter:title" content={data?.ogTitle ?? "Trraform"}>
    <meta name="twitter:description" content={data?.ogDesc ?? "Millions of worlds powered by Ethereum."}>
    <meta name="twitter:image" content={data?.ogImage ?? "https://trraform.com/ogImage.png"}>

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

<header class="fixed top-0 left-0 flex items-center justify-between w-full gap-3 p-4">
    <a class="flex-shrink-0 block w-6 opacity-50 sm:w-7 aspect-square" href="/">
        <img src="/logo.svg" alt="Logo">
    </a>
    <div class="flex w-full sm:w-72 items-center gap-1.5 p-1 outline outline-1 outline-zinc-800 bg-zinc-900 rounded-lg">
        <input bind:value={searchValue} on:focus={() => searchFocused = true} on:blur={() => searchFocused = false} type="text" placeholder="Search plot by id" maxlength="10" class="flex-1 h-4 text-xs bg-transparent border-r sm:h-5 sm:text-sm focus:outline-none border-zinc-800">
        <button on:click={search} class="flex-none w-4 sm:w-5 aspect-square group">
            <img class="transition-opacity opacity-70 group-active:opacity-50" src="/navigate.svg" alt="search">
        </button>
    </div>
    <div class="relative h-6 sm:h-7">
        <MenuOption bind:toggle={menuExpanded} on:click={() => menuExpanded = !menuExpanded} newBinding={newPlots} src="/menu.svg" alt="menu" tag="Menu"/>
        <div class="{menuExpanded ? "" : "translate-x-20"} transition-transform mt-1.5 space-y-1.5">
            <MenuOption on:click={() => goto("/")} src="/house.svg" alt="home" tag="Home"/>
            <MenuOption on:click={() => goto("/myplots")} newBinding={newPlots} src="/plot1.svg" alt="my plots" tag="My Plots"/>
            <MenuOption on:click={() => showSettingsModal = true} src="/settings.svg" alt="settings" tag="Settings"/>
        </div>
    </div>
</header>

<div class="p-2.5 bg-zinc-900 outline-1 outline outline-zinc-800 rounded-2xl h-max fixed sm:bottom-3 bottom-2 sm:left-3 left-2 w-[calc(100vw-16px)] sm:max-w-80 flex flex-col gap-1.5 transition-transform { showProfile === false ? "-translate-x-[calc(100%+20px)]" : ""}">
    {#await profile}
        <div class="w-full h-20 animate-pulse">
            <div class="w-1/4 h-3 mt-0.5 rounded-full bg-zinc-700"></div>
            <div class="w-1/2 h-4 mt-1 rounded-full bg-zinc-700"></div>
        </div>
    {:then { id, minted, name, desc, link, linkLabel } }
        <div>
            <div class="flex items-center justify-between gap-1">
                <h3 class="max-w-full break-all w-max">{name}</h3>
                <div class="select-none">
                    <button on:click={refresh} class="relative w-4 h-4 select-none group">
                        <img src="/refresh.svg" alt="report">   
                        <span class="plot-option-tag">Refresh</span>
                    </button>
                    <button on:click={() => {
                        sharePlotId = id
                        showShareModal = true
                    }} class="relative w-4 h-4 select-none group">
                        <img src="/share.svg" alt="report">   
                        <span class="plot-option-tag">Share</span>
                    </button>
                    {#if minted}
                        <button on:click={() => {
                            reportPlotId = id
                            showReportModal = true
                        }} class="relative w-4 h-4 select-none group">
                            <img src="/report.svg" alt="report">
                            <span class="plot-option-tag">Report</span>
                        </button>
                    {/if}
                </div>
            </div>
            <div class="text-xs opacity-70">id: {id}</div>
        </div>
        {#if !minted || desc || link}
            <div class="w-full h-px bg-zinc-800"></div>
        {/if}
        {#if minted}
            {#if desc}
                <p>{desc}</p>
            {/if}
            {#if link}
                <a href={link} target="_blank" class="flex items-center gap-1 transition-opacity opacity-70 active:opacity-40">
                    <img class="w-4 h-4" src="/link.svg" alt="link">
                    <p>{linkLabel}</p>
                </a>
            {/if}
        {:else}
            <button class="w-full mt-1 button0" on:click={prepMint}>Mint</button>
        {/if}
    {/await}
</div>

{#if showShareModal}
    <ShareModal bind:plotIdStr={sharePlotId} on:close={() => showShareModal = false}/>
{/if}

{#if showReportModal}
    <ReportModal bind:plotIdStr={reportPlotId} on:close={() => showReportModal = false}/>
{/if}

{#if showSettingsModal}
    <SettingsModal on:close={() => showSettingsModal = false}/>
{/if}

{#if showConnectModal}
    <ConnectWalletModal on:success={prepMint} on:cancel={() => showConnectModal = false}/>
{/if}

{#if showMintModal}
    <MintModal bind:plot={mintPlot} on:close={() => showMintModal = false} on:success={e => {
        const plot = e.detail
        showMintModal = false
        confetti(plot.pos, plot.parent.blockSize)
        profile = getProfile(plot)
    }}/>
{/if}

<style lang="postcss">

    h3 {

        @apply font-semibold;

    }

    p {

        @apply text-sm;

    }

    .plot-option-tag {

        @apply absolute text-xs font-semibold transition-opacity opacity-0 pointer-events-none select-none w-max bottom-0 -translate-x-1/2 -translate-y-full mb-0.5 left-1/2 group-hover:opacity-100;

    }

</style>