
    <script>

        //TODO 
        //make insideOf null
        //meta tags
        //social links

        import { fly } from "svelte/transition"
        import { goto } from "$app/navigation"
        import { isMobileBrowser, showHowItWorksModal } from "$lib/main/store"
        import Leaderboard from "$lib/main/components/leaderboard.svelte";
        import { setCookie, getCookie } from "$lib/common/cookie"

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
        <meta property="og:image" content="https://trraform.com/banner.png">

        <!-- Twitter Meta Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta property="twitter:domain" content="trraform.com">
        <meta property="twitter:url" content="https://trraform.com">
        <meta name="twitter:title" content="Trraform">
        <meta name="twitter:description" content="Millions of worlds powered by Polygon.">
        <meta name="twitter:image" content="https://trraform.com/banner.png">

    </svelte:head>

    <div transition:fly={ { x: -500, opacity: 1 } } class="fixed bottom-0 left-0 w-full p-2 sm:p-2 sm:max-w-max">
        <div class="flex items-center gap-2 opacity-70">
            <a class="w-4 aspect-square" href="https://discord.gg/KGYYePyfuQ" target="_blank">
                <img  src="/discord.svg" alt="">
            </a>
            <a class="w-4 aspect-square" href="https://www.instagram.com/trraform_" target="_blank">
                <img src="/instagram.svg" alt="">
            </a>
            <a class="w-4 aspect-square" href="https://x.com/trraform" target="_blank">
                <img src="/x.svg" alt="">
            </a>
            <a class="w-4 aspect-square" href="https://www.tiktok.com/@trraform" target="_blank">
                <img src="/tiktok.svg" alt=""> 
            </a>
        </div>
        <h1 class="mt-1 text-4xl font-bold sm:text-5xl">Millions of Worlds</h1>
        <h4 class="mt-1 text-sm font-semibold sm:text-base">Powered by <b>Polygon</b></h4>
        <nav class="w-full mt-3 space-y-3">
            <button on:click={() => {
                $showHowItWorksModal = getCookie("showHowItWorks") == ""
                setCookie("showHowItWorks", "false", 99999)
                goto("/world")
            }} class="nav-option" href="/world">Explore</button>
            {#if !$isMobileBrowser}
                <a class="nav-option" target="_self" href="/editor">Build</a>
            {/if}
        </nav>
        <div class="flex flex-col items-stretch w-full gap-2 mt-2 text-xs sm:text-sm sm:justify-normal sm:flex-row opacity-70">
            <div class="flex items-center justify-center gap-2">
                <a href="/terms-of-service" target="_blank">Terms of service</a>
                <div class="w-px h-3.5 sm:h-4 bg-white"></div>
                <a href="/privacy-policy" target="_blank">Privacy policy</a>
                <div class="w-px h-3.5 sm:h-4 bg-white"></div>
                <button on:click={() => $showHowItWorksModal = true}>How it works</button>
            </div>
        </div>
    </div>
    

    <div class="fixed hidden bottom-2 right-2 md:block">
        <Leaderboard/>
    </div>

    <style lang="postcss">

        .nav-option {

            @apply hover:scale-[1.01] active:scale-100 cursor-pointer transition-transform block text-center sm:text-lg font-semibold w-full py-2.5 sm:py-3 bg-blue-700 outline-blue-500 outline outline-1 rounded-xl sm:rounded-2xl;
            
        }

    </style>
