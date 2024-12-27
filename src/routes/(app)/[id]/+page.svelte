<script>

    //TODO
    //stop refresh on android when scroll up
    //disable when modal
    //flag blue dot menu options

    import { page } from "$app/stores"
    import { goto } from "$app/navigation"
    import { onMount } from "svelte";
    import { insideOf, refs, newPlots, myPlots, notification } from "$lib/main/store"
    import SettingsModal from "$lib/main/components/settings/settingsModal.svelte";
    import ConnectWalletModal from "$lib/main/components/connectWallet/connectWalletModal.svelte";
    import Loading from "$lib/common/components/loading.svelte"
    import { MAX_DEPTH } from "$lib/common/constants";
    import { pushNotification } from "$lib/common/utils";
    import PlotId from "$lib/common/plotId"
    import { confetti } from "$lib/main/decoration"
    import WalletConnection from "$lib/main/walletConnection";
    import MyPlot from "$lib/main/plot/myPlot"
    import Plot from "$lib/main/plot/plot"
    import MenuOption from "./menuOption.svelte";
    import { formatEther } from "viem";

    let menuExpanded = false
    let searchValue = ""
    let searchFocused = false
    let load
    let lastTouches = []
    
    let showSettingsModal = false, showConnectModal = false
    let reportPlotButtonVisible = false, reportPlotModalState = 0, reportBugModalState = 0
    let reportPlotId = "", reportPlotMsg = "", reportBugMsg = "", charCount = 0
    let profile = null
    let showProfile = false

    onMount(() => {

        cancelKeyEvent()

    })

    function keydown(e){

        if(refs.disabled)

            return

        const key = e.key.toLowerCase()

        if(key === "w" || key === "a" || key === "s" || key === "d")

            refs.camera.update = refs.camera.standard

        if(searchFocused){

            if( key === "enter")

                search()

            return

        }

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

            case " ":

                refs.camera.upward = true
                break

            case "shift":

                refs.camera.downward = true
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

            case " ":

                refs.camera.upward = false
                break

            case "shift":

                refs.camera.downward = false
                break

        }

    }

    function cancelKeyEvent(){

        if(refs.camera)

            refs.camera.forward = refs.camera.backward = refs.camera.right = refs.camera.left = refs.camera.upward = refs.camera.downward = false

    }

    function mousewheel(e){
        
        if(refs.disabled)

            return

        refs.camera.scrollVelocity -= e.deltaY / 100

    }

    function touchevent(e){ 

        if(refs.disabled || refs.camera.update === refs.camera.standard)

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

    async function mint(){

        if (WalletConnection.isConnected || await WalletConnection.reconnect()) {
        
            showConnectModal = false
            load = true

            try {

                const plot = $insideOf
                const mintPrice = await plot.getSmp()
                const hash = await WalletConnection.mint(plot.id, mintPrice)

                pushNotification(notification, `We're Processing Your Transaction`, "This may take a minute...")

                await WalletConnection.txSuccess(hash)

                $myPlots.unshift(new MyPlot(plot.id, true))
            
                plot.minted = true

                if (plot.id.depth() < MAX_DEPTH)

                    plot.createChildPlots(...Plot.defaultChildPlots(plot.buildSize))
                    
                profile = getProfile(plot)
                
                setTimeout(() => {
                    confetti(plot.pos, plot.parent.blockSize)
                    pushNotification(notification, `Plot ${plot.id.string()} Minted!`, 'Go to the "My Plots" tab to view your new plot!', () => goto("/myplots"))

                }, 1000)
                

            } catch(e) {

                console.log(e)
                pushNotification(notification, "Minting Failed", "This transaction could not be completed on chain.")
                
            }

            load = false    

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

                pushNotification(notification, "Invalid Plot Id", `Could not locate plot with id "${searchValue}."`)
                return

            }

            //only push changed browser state
            if(!pagePlotId.equals(searchPlotId))

                goto(searchPlotId.string())

        } catch {

            pushNotification(notification, "Plot Not Found", `Could not locate plot with id "${searchValue}."`)

        }

    }

    $: if ($insideOf?.id?.id) {

        profile = getProfile($insideOf)
        showProfile = true
        profile.then(data => {

            if(data.minted){

                reportPlotId = data.id
                reportPlotButtonVisible = true

            }

        })
       

    } else {

        reportPlotButtonVisible = false
        showProfile = false

    }

    async function getProfile(plot) {
        
        reportPlotButtonVisible = false
        await plot.load()

        const idStr = plot.id.string()

        let link = null

        //normalize url
        if(plot.link){

            link = plot.link

            if(!link.startsWith("https://") && !link.startsWith("http://"))

                link = `https://${link}`

        }

        //format mint price
        let mintPrice = await plot.parent.getSmp()

        if(mintPrice !== null)

            mintPrice = formatEther(mintPrice)

        return { 
            minted : plot.minted, 
            id : idStr,
            name : plot.name || `Plot ${idStr}`, 
            desc : plot.desc,
            link,
            linkLabel : plot.linkLabel || "link",
            mintPrice
        }

    }

    $: charCount = reportPlotMsg.trim().length - 250
    $: charCount = reportBugMsg.trim().length

    function showReportPlotModal(){

        reportPlotModalState = 1
        reportPlotMsg = ""
        charCount = -250

    }

    function showReportBugModal(){

        reportBugModalState = 1
        reportBugMsg = ""
        charCount = 0

    }

    async function submitPlotReport(){

        load = true
        await fetch( `https://report.trraform.com/reportPlot?plotId=${reportPlotId}`, { 
            method: "POST",
            body: JSON.stringify({ reportMsg : reportPlotMsg }),
            headers: { "Content-Type" : "application/json" }
        } )
        load = false
        reportPlotModalState = 2

    }

    async function copyToClipboard(id){

        await navigator.clipboard.writeText(`https://www.trrafrom.com/${id}`);

    }

</script>

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
        <button on:click={search} class="relative flex-none w-4 sm:w-5 aspect-square group">
            <div class="ml-3 standard-tag">Search</div>
            <img class="transition-opacity opacity-70 group-active:opacity-50" src="/navigate.svg" alt="search">
        </button>
    </div>
    <div class="relative h-6 sm:h-7">
        <MenuOption bind:toggle={menuExpanded} on:click={() => menuExpanded = !menuExpanded} src="/menu.svg" alt="menu" tag="Menu"/>
        <div class="{menuExpanded ? "" : "translate-x-20"} transition-transform mt-1.5 space-y-1.5">
            <MenuOption on:click={() => goto("/")} src="/house.svg" alt="home" tag="Home"/>
            <MenuOption on:click={() => goto("/myplots")} src="/plot1.svg" alt="my plots" tag="My Plots"/>
            <MenuOption on:click={() => showSettingsModal = true} src="/settings.svg" alt="settings" tag="Settings"/>
        </div>
    </div>
</header>

<div class="container0 fixed sm:bottom-3 bottom-2 sm:left-3 left-2 w-[calc(100vw-16px)] sm:max-w-80 flex flex-col gap-1.5 transition-transform { !showProfile ? "-translate-x-[calc(100%+20px)]" : ""}">
    {#await profile || new Promise(() => {})}
        <div class="w-full h-20 animate-pulse">
            <div class="head-container">
                <div class="w-1/4 h-3 mt-0.5 rounded-full bg-zinc-700"></div>
                <div class="w-1/2 h-4 mt-1 rounded-full bg-zinc-700"></div>
            </div>
        </div>
    {:then { id, minted, name, desc, link, linkLabel, mintPrice } }
        <div>
            <div class="text-xs opacity-70">id: {id}</div>
            <div class="flex items-center gap-1">
                <h3 class="max-w-full break-all w-max">{name}</h3>
                <button on:click={() => copyToClipboard(id)} class="relative flex-shrink-0 w-4 h-4 group">
                    <div class="transition-opacity opacity-70 group-active:opacity-50">
                        <!-- <CopySVG/> -->
                    </div>
                    <div class="ml-2 standard-tag">Copy plot link</div>
                </button>
            </div>
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
                    <div class="w-4 h-4">
                        <!-- <LinkSVG/>  -->
                    </div>
                    <!-- <p>{linkLabel}</p> -->
                </a>
            {/if}
        {:else}
            <button class="w-full mt-1 button0" on:click={mint}>Mint {#if mintPrice !== null}for {mintPrice} eth {/if}</button>
        {/if}
    {/await}
</div>

<!-- 
{#if reportPlotModalState}
    <Modal class="max-w-screen-sm" header="Report Plot {reportPlotId}?" on:close={() => reportPlotModalState = 0}>
        <div class="flex flex-col gap-3">
            {#if reportPlotModalState === 1}
                <p>We appreciate your help with make Trraform a better place for everyone. Keep in mind that Trraform is a space for people to express themselves freely and that <b>we do not take actions on reports unless they are highly serious.</b> Spam and abuse of our report system will be automatically filtered.</p>
                <p>Describe your report in detail. If this report involves your personal information, please provide an email for our team to contact you.</p>
                <div class="relative w-full">
                    <textarea maxlength="500" bind:value={reportPlotMsg} class="w-full" rows="6" placeholder="Minimum 250 characters, maximum 500 characters."></textarea>
                    <span class="absolute text-xs opacity-50 bottom-1 right-1 {charCount >= 0 ? "text-green-500" : ""}">{charCount}</span>
                </div>
                <button on:click={submitPlotReport} class="button0" disabled={charCount < 0}>Submit</button>
            {:else if reportPlotModalState === 2}
                <h1>We appreciate your help.</h1>
                <p>Your report has been recieved and our team is looking into it. Be aware that if you provided a contact, we may try to reach out for more information. If you have any other issues, a good way to get in contact is through our discord.</p>
            {/if}
        </div>
    </Modal>
{/if} -->

{#if showSettingsModal}
    <SettingsModal on:close={() => showSettingsModal = false}/>
{/if}

{#if showConnectModal}
    <ConnectWalletModal on:cancel={() => showConnectModal = false} on:success={mint}/>
{/if}

{#if load}
    <Loading class="opacity-50"/>
{/if}

<style lang="postcss">

    h1{

        @apply text-lg font-bold;

    }

    h3{

        @apply font-semibold;

    }

    p{

        @apply text-sm;

    }

    li{

        @apply text-sm;

    }

    .menu-button{

        @apply block relative w-8 h-8 mb-2 transition-opacity;

    }

    .menu-button-tag{

        @apply absolute right-full mr-1 w-max top-1/2 -translate-y-1/2 transition-opacity pointer-events-none opacity-0 select-none text-sm font-semibold group-hover:opacity-100;

    }

    .menu-button-new-tag{

        @apply absolute top-0.5 right-0 w-2 h-2 rounded-full bg-blue-500;

    }
    
    .menu-button-svg{

        @apply delay-0 transition-transform group-hover:opacity-100;

    }

    .standard-tag{

        @apply absolute px-1.5 py-1 text-xs transition-opacity delay-150 -translate-y-1/2 rounded opacity-0 pointer-events-none top-1/2 left-full bg-zinc-800 group-hover:opacity-100 w-max max-w-40;

    }

    textarea{

        @apply align-top p-1 resize-none m-0 mt-1 text-sm rounded-lg outline outline-1 outline-zinc-800 bg-zinc-900 transition-colors;

    }


</style>