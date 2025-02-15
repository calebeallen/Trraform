<script>

    //TODO
    //stop refresh on android when scroll up
    //disable when modal
    //flag blue dot menu options

    import { page } from "$app/stores"
    import { goto } from "$app/navigation"
    import { onMount } from "svelte";
    import { insideOf, refs, newPlots, isMobileBrowser } from "$lib/main/store"
    import SettingsModal from "$lib/main/components/settings/settingsModal.svelte";
    
    import MenuOption from "./menuOption.svelte";
    import Search from "$lib/main/components/search.svelte"

    let menuExpanded = false
    let lastTouches = []
    
    let showSettingsModal = false, showConnectModal = false, showReportModal = false, showShareModal = false, showMintModal = false
    let insideId = ""
    let showProfile = false
    let searchFocused

    onMount(() => {

        cancelKeyEvent()

    })

    function keydown(e){

        if(showSettingsModal || showConnectModal || showReportModal || showShareModal || showMintModal || searchFocused)

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
        
        if(showSettingsModal || showConnectModal || showReportModal || showShareModal || showMintModal || searchFocused)

            return

        if(refs.camera.update === refs.camera.autoRotate)

            refs.camera.update = refs.camera.orbit

        refs.camera.scrollVelocity -= e.deltaY / 100

    }

    function touchevent(e){ 

        if(showSettingsModal || showConnectModal || showReportModal || showShareModal || showMintModal || searchFocused || refs.camera.update === refs.camera.standard)

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

    $: if ($insideOf !== null) {

        showProfile = true
        insideId = $insideOf.id.string()
       
    } else {
        
        showProfile = false
        insideId = ""

    }

</script>

<svelte:head>
            
    <!-- HTML Meta Tags -->
    <title>Trraform</title>
    <meta name="description" content="Millions of worlds powered by Polygon.">

    <!-- Facebook Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://trraform.com">
    <meta property="og:title" content="Trraform">
    <meta property="og:description" content="Millions of worlds powered by Polygon.">
    <meta property="og:image" content="https://trraform.com/ogImage.png">

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta property="twitter:domain" content="trraform.com">
    <meta property="twitter:url" content="https://trraform.com">
    <meta name="twitter:title" content="Trraform">
    <meta name="twitter:description" content="Millions of worlds powered by Polygon.">
    <meta name="twitter:image" content="https://trraform.com/ogImage.png">

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

<header class="fixed top-0 left-0 flex items-baseline justify-between w-full gap-3 p-4 pointer-events-none select-none">
    <a class="flex-shrink-0 block opacity-50 pointer-events-auto w-7 aspect-square" href="/">
        <img src="/logo.svg" alt="Logo">
    </a>
    <div class="-translate-y-5 pointer-events-auto">
        <Search bind:searchFocused/>
    </div>
    <div class="relative h-6 pointer-events-auto sm:h-7">
        <MenuOption bind:toggle={menuExpanded} on:click={() => menuExpanded = !menuExpanded} newBinding={newPlots} src="/menu.svg" alt="menu" tag="Menu"/>
        <div class="{menuExpanded ? "" : "translate-x-20"} transition-transform mt-1.5 space-y-1.5">
            <MenuOption on:click={() => goto("/")} src="/house.svg" alt="home" tag="Home"/>
            <MenuOption on:click={() => showSettingsModal = true} src="/settings.svg" alt="settings" tag="Settings"/>
        </div>
    </div>
</header>

<div class="p-2.5 bg-zinc-900 outline-1 outline outline-zinc-800 rounded-2xl h-max fixed sm:bottom-3 bottom-2 sm:left-3 left-2 w-[calc(100vw-16px)] sm:max-w-80 flex flex-col gap-1.5 transition-transform { showProfile === false ? "-translate-x-[calc(100%+20px)]" : ""}">
    <div>
        <div class="flex items-center justify-between gap-1">
            <h3 class="max-w-full break-all w-max">Plot {insideId}</h3>
        </div>
        <div class="text-xs opacity-70">id: {insideId}</div>
    </div>
    <div class="w-full h-px bg-zinc-800"></div>
    <p>Want this plot? Join the discord to be notified when minting becomes available! 🚀🚀🚀</p>
    <a href="https://discord.gg/KGYYePyfuQ" target="_blank" class="flex items-center gap-1 transition-opacity opacity-70 active:opacity-40">
        <img class="w-4 h-4" src="/link.svg" alt="link">
        <p>Discord</p>
    </a>
</div>

{#if showSettingsModal}
    <SettingsModal on:close={() => showSettingsModal = false}/>
{/if}

<style lang="postcss">

    h3 {

        @apply font-semibold;

    }

    p {

        @apply text-sm;

    }

</style>