
    <script>

        //TODO 
        //make insideOf null
        //meta tags
        //social links

        import { fly } from "svelte/transition"
        import { goto } from "$app/navigation"
        import { isMobileBrowser, showHowItWorksModal, user } from "$lib/main/store"
        import Leaderboard from "$lib/main/components/leaderboard.svelte";
    

    </script>

    
    <svelte:head>
            
        <!-- HTML Meta Tags -->
        <title>Trraform</title>
        <meta name="description" content="Build and explore millions of worlds.">

        <!-- Facebook Meta Tags -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://trraform.com">
        <meta property="og:title" content="Trraform">
        <meta property="og:description" content="Build and explore millions of worlds.">
        <meta property="og:image" content="https://trraform.com/og-image.png">

        <!-- Twitter Meta Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta property="twitter:domain" content="trraform.com">
        <meta property="twitter:url" content="https://trraform.com">
        <meta name="twitter:title" content="Trraform">
        <meta name="twitter:description" content="Build and explore millions of worlds.">
        <meta name="twitter:image" content="https://trraform.com/og-image.png">

    </svelte:head>

    <div transition:fly={ { x: -500, opacity: 1 } } class="fixed bottom-0 left-0 w-full px-2 py-8 sm:p-8 sm:max-w-max">
        <div class="flex items-center gap-3 opacity-70">
            <a class="w-5 aspect-square" href="https://discord.gg/KGYYePyfuQ" target="_blank">
                <img  src="/discord.svg" alt="">
            </a>
            <a class="w-5 aspect-square" href="https://www.instagram.com/trraform_" target="_blank">
                <img src="/instagram.svg" alt="">
            </a>
            <a class="w-5 aspect-square" href="https://www.tiktok.com/@trraform" target="_blank">
                <img src="/tiktok.svg" alt=""> 
            </a>
        </div>
        <h1 class="mt-1 text-4xl font-bold sm:text-5xl">Millions of Worlds</h1>
        <nav class="w-full mt-3 space-y-3">
            <a class="nav-option" href="/world">Explore</a>
            <a class="nav-option" target="_blank" href="/editor">Build</a>
        </nav>
    </div>

    <div class="fixed left-0 w-full bottom-2">
        <div class="flex items-center justify-center gap-2 mx-auto text-xs sm:text-sm text-zinc-400">
            <div>© 2025 Trraform</div>
            <a href="/terms-of-service" target="_blank">Terms of service</a>
            <a href="/privacy-policy" target="_blank">Privacy policy</a>
            <button on:click={() => $showHowItWorksModal = true}>How it works</button>
        </div>
    </div>
    
    <div transition:fly={{ x: 400 }}  class="fixed bottom-0 right-0 hidden w-full p-8 pointer-events-none md:block">
        <Leaderboard/>
    </div>

    <style lang="postcss">

        .nav-option {

            @apply hover:scale-[1.01] active:scale-100 cursor-pointer transition-transform block text-center sm:text-lg font-semibold w-full py-2.5 sm:py-3 bg-blue-700 outline-blue-500 outline outline-1 rounded-xl sm:rounded-2xl;
            
        }

    </style>
