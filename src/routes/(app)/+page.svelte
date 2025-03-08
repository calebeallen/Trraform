
    <script>

        //TODO 
        //make insideOf null
        //meta tags
        //social links

        import { fly } from "svelte/transition"
        import { isMobileBrowser } from "$lib/main/store"
        import Leaderboard from "$lib/main/components/leaderboard.svelte";


    </script>

    
    <svelte:head>
            
        <!-- HTML Meta Tags -->
        <title>Trraform</title>
        <meta name="description" content="Build anything">

        <!-- Facebook Meta Tags -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://trraform.com">
        <meta property="og:title" content="Trraform">
        <meta property="og:description" content="Build anything">
        <meta property="og:image" content="https://trraform.com/ogImage.png">

        <!-- Twitter Meta Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta property="twitter:domain" content="trraform.com">
        <meta property="twitter:url" content="https://trraform.com">
        <meta name="twitter:title" content="Trraform">
        <meta name="twitter:description" content="Build anything">
        <meta name="twitter:image" content="https://trraform.com/ogImage.png">

    </svelte:head>

    <div transition:fly={ { x: -500, opacity: 1 } } class="fixed bottom-0 left-0 w-full p-3 sm:p-5 sm:max-w-max">
        <h1 class="text-4xl font-bold sm:text-5xl">Millions of Worlds</h1>
        <h4 class="mt-1 text-sm font-semibold sm:text-base">Powered by <b>Polygon</b></h4>
        <nav class="w-full mt-4 space-y-3">
            <a class="nav-option" href="/world">Explore</a>
            {#if !$isMobileBrowser}
                <a class="nav-option" target="_self" href="/editor">Build</a>
            {/if}
        </nav>
    </div>

    <div class="fixed hidden bottom-2 right-2 md:block">
        <Leaderboard/>
    </div>

    <style lang="postcss">

        .nav-option {

            @apply hover:scale-[1.01] active:scale-100 cursor-pointer transition-transform block text-center sm:text-lg font-semibold w-full py-2.5 sm:py-3 bg-blue-700 outline-blue-500 outline outline-1 rounded-xl sm:rounded-2xl;
            
        }

    </style>
