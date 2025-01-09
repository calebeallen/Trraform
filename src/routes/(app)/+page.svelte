
<script>

    //TODO 
    //meta tags
    //social links

    import { onMount } from "svelte"
    import { fade, fly } from "svelte/transition"
    import { refs, isMobileBrowser } from "$lib/main/store"

    let inView = false
    let sectionContainer, s0, s1, s2, s3
    let renderS0 = false, renderS1 = false, renderS2 = false, renderS3 = false

    let lastScrollY = 0

    onMount( () => {

        lastScrollY = 0
        window.scrollTo({top:0})

    })

    function scroll(){
        
        const bS = sectionContainer.getBoundingClientRect()
        const b0 = s0.getBoundingClientRect()
        const b1 = s1.getBoundingClientRect()
        const b2 = s2.getBoundingClientRect()
        const b3 = s3.getBoundingClientRect()

        const boundary = window.innerHeight - 100

        inView = renderS0 = renderS1 = renderS2 = renderS3 = false

        if(bS.y < boundary)
    
            inView = true

        if(b0.y < boundary)

            renderS0 = true
        
        if(b1.y < boundary)

            renderS1 = true

        if(b2.y < boundary)

            renderS2 = true

        if(b3.y < boundary)

            renderS3 = true

        if(refs.camera)

            lastScrollY = window.scrollY

    }

</script>

<svelte:window on:scroll={scroll}/>

{#if !inView}
    <div transition:fly={ { x: -500, opacity: 1 } } class="fixed bottom-0 left-0 w-full p-3 sm:p-5 sm:max-w-max">
        <h1>Millions of Worlds</h1>
        <h4 class="mt-1">Powered by <b>Ethereum</b> <img class="inline-block w-2 h-3 translate-y-px" src="/eth-small.svg" alt="eth small"></h4>
        <nav class="w-full mt-4 space-y-3">
            <a class="nav-option" href="/0x00">Explore</a>
            {#if !$isMobileBrowser}
                <a class="nav-option" href="/editor">Build</a>
            {/if}
        </nav>
    </div>
{/if}


<div bind:this={sectionContainer} class="relative w-full max-w-screen-lg mx-auto mt-[100vh]">
    <section bind:this={s0} class="mt-10">
        {#if renderS0}
            <div class="accent-container"> 
                <div class="accent-circle-container">
                    <div transition:fade={{ duration: 200 }} class="accent-circle outline-blue-500"></div>
                </div>
                <div class="accent-line-container">
                    <div transition:fly={{ y: -1000, duration: 800 }} class="accent-line from-blue-500 to-cyan-500"></div>
                </div>
            </div>
            <div class="flex flex-col items-center justify-between w-full gap-2 mb-64 sm:flex-row sm:items-start">
                <div class="content-container">
                    <div transition:fly={{ x: 50, duration: 500 }} class="text-blue-500 section-tag">Create and Explore</div>
                    <h1 transition:fly={{ x: 50, duration: 500, delay: 100 }}>Build Your World</h1>
                    <div transition:fly={{ x: 50, duration: 500, delay: 200 }} class="w-full pr-2 space-y-1 sm:max-w-md sm:space-y-2">
                        <p>Each block houses a plot that you can purchase and use to build anything you want. These plots have subplots that can hold their own builds, and those subplots have subplots! The possiblities of what you can create are truly endless. Bring your unique creations to life alongside <b class="text-lime-300">millions</b> of others.</p>
                        <p>With <b class="text-lime-300">unmatched innovation</b>, Trraform offers a truly unique approach to crypto—a project tailored not only to holders, but to <b class="text-lime-300">everyone</b>.</p>
                    </div>
                </div>
                <div transition:fly={{ y: 120, duration: 500 }} class="relative hidden mr-2 w-72 md:w-96 shrink-0 sm:block aspect-square bg-radial-gradient">
                    <img src="/buildExample.png" alt="example build" loading="lazy">
                    <div class="absolute w-56 bottom-1 right-1 container0 space-y-0.5 scale-75 md:scale-100 shadow-xl hover:shadow-2xl transition-shadow">
                        <div class="text-xs opacity-70">id: 0xa124b1c4</div>
                        <div class="max-w-full font-bold">Japanese Farmhouse 民家</div>
                        <div class="w-full h-px bg-zinc-700"></div>
                        <div class="w-full text-xs break-words">This style of house dates to 1603 and was commonly used by farmers and merchants in rural Japan.</div>
                    </div>
                </div>
            </div>  
        {/if}
    </section>  
    <section bind:this={s1}>
        {#if renderS1}
            <div class="accent-container"> 
                <div class="accent-circle-container">
                    <div transition:fade={{ duration: 200 }} class="accent-circle outline-cyan-500"></div>
                </div>
                <div class="accent-line-container">
                    <div transition:fly={{ y: -1000, duration: 800 }} class="accent-line from-cyan-500 to-blue-500"></div>
                </div>
            </div>
            <div class="mb-64 content-container">
                <div transition:fly={{ x: 50, duration: 500 }} class="section-tag text-cyan-500">Crypto</div>
                <h1 transition:fly={{ x: 50, duration: 500, delay: 100 }}>Mint, Earn, Trade</h1>
                <div transition:fly={{ x: 50, duration: 500, delay: 200 }} class="w-full pr-2 space-y-1 sm:space-y-2">
                    <p>Find any open spot and make it your own. By simply owning a plot, you <b class="text-lime-300">automatically earn 70% royalties</b> when one of its subplots are minted. The funds go straight to your wallet. Better yet, <b class="text-lime-300">you set the mint price</b> for these subplots.</p>
                    <p>Interested in trading? Trraform implements the <b class="text-lime-300">ERC-721 token standard</b> for seamless integration with popular NFT exchanges. Trade your plot like any other token.</p>
                </div>
            </div>
        {/if}
    </section>
    <section bind:this={s2}>
        {#if renderS2}
            <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 opacity-10">
                <img class="rotate-12 w-[50vw] max-w-screen-md min-w-[500px]" src="eth.svg" alt="eth">
            </div>
            <div class="accent-container"> 
                <div class="accent-circle-container">
                    <div transition:fade={{ duration: 200 }} class="accent-circle outline-blue-500"></div>
                </div>
                <div class="accent-line-container">
                    <div transition:fly={{ y: -1000, duration: 800 }} class="accent-line from-blue-500 to-cyan-500"></div>
                </div>
                <div class="-translate-y-2">
                    <div in:fade={{ duration: 200, delay: 800 }} out:fade={{ duration: 200 }} class="{renderS2 ? "" : "opacity-0"} delay-500 accent-circle outline-cyan-500"></div>
                </div>
            </div>
            <div>
                <div class="w-full content-container">
                    <div transition:fly={{ x: 50, duration: 500 }} class="text-blue-500 section-tag">Whats included?</div>
                    <h1 transition:fly={{ x: 50, duration: 500, delay: 100 }}>Benefits at Every Level</h1>
                    <p transition:fly={{ x: 50, duration: 500, delay: 200 }} class="w-full max-w-md pr-2 space-y-1 sm:space-y-2">Depth indicates how many layers of plots a single plot is nested within. There's perks to all of them!</p>
                </div>
                <div class="w-full mt-8 space-y-3 -translate-x-6 sm:mt-10 sm:-translate-x-8">
                    <div transition:fly={{ x: 50, duration: 500, delay: 200 }} class="info-widget">
                        <img src="/dodecahedron.svg" alt="dodecahedron" class="ml-auto icon-option">
                        <h3>Depth 0</h3>
                        <ul class="ml-2 spacy-y-0.5">
                            <li><b class="text-lime-300">24 mintable subplots</b></li>
                            <li>32x32x32 maximum build size</li>
                        </ul>
                    </div>
                    <div transition:fly={{ x: 50, duration: 500, delay: 300 }} class="info-widget">
                        <img src="/icosahedron.svg" alt="icosahedron" class="ml-auto icon-option">
                        <h3>Depth 1</h3>
                        <ul class="ml-2">
                            <li><b class="text-lime-300">24 mintable subplots</b></li>
                            <li>48x48x48 maximum build size</li>
                        </ul>
                    </div>
                    <div transition:fly={{ x: 50, duration: 500, delay: 400 }} class="info-widget">
                        <img src="/dodecahedron1.svg" alt="dodecahedron" class="ml-auto icon-option">
                        <h3>Depth 2</h3>
                        <ul class="ml-2">
                            <li><b class="text-lime-300">64x64x64 maximum build size</b></li>
                        </ul>
                    </div>
                </div>
            </div>
        {/if}
    </section>
    <section bind:this={s3} class="flex-row-reverse mt-64">
        {#if renderS3}
            <div class="accent-container"> 
                <div class="pt-[17px] sm:pt-[23px]">
                    <div transition:fade={{ duration: 200 }} class="accent-circle outline-blue-500"></div>
                </div>
                <div class="accent-line-container">
                    <div transition:fly={{ y: -1000, duration: 800 }} class="accent-line from-blue-500 to-cyan-500"></div>
                </div>
                <div class="-translate-y-2">
                    <div transition:fly={{ x: 50, duration: 500, delay: 200 }} class="accent-circle outline-cyan-500"></div>
                </div>
            </div>
            <div>
                <div class="ml-auto content-container w-max">
                    <h1 transition:fly={{ x: 50, duration: 500 }} class="text-right">Trraform Editor</h1>
                    <h2 transition:fly={{ x: 50, duration: 500, delay: 100 }} class="text-right text-zinc-300">With 3D Model Conversion</h2>
                </div>
                <a transition:fly={{ y: 50, duration: 500, delay: 200 }} target="_blank" href="/editor" class="block px-2 mt-8 translate-x-8 sm:mt-10 sm:translate-x-10">
                    <img class="aspect-[16/9] w-full sm:rounded-2xl rounded-xl outline outline-1 shadow-2xl outline-zinc-600" src="/editor.png" alt="" loading="lazy">
                </a>
            </div>
        {/if}
    </section>
    <footer class="p-2 mx-auto mt-64">
        <div class="flex flex-wrap-reverse justify-center px-10 text-xs gap-x-3 sm:text-sm">
            <span>© 2025 Trraform. All rights reserved.</span>
            <div class="flex gap-x-3">
                <a target="_blank" href="/terms-of-service">Terms of Service</a>
                <a target="_blank" href="/privacy-policy">Privacy Policy</a> 
            </div>
        </div>
    </footer>
</div>


<header class="fixed top-0 left-0 flex justify-between w-full p-4 opacity-50">
    <div class="flex items-center flex-shrink-0 gap-1">
        <img class="icon-option" src="/logo.svg" alt="Logo">
        <span class="mr-4 text-lg font-semibold sm:text-xl w-max">Trraform</span>
    </div>
    <ul class="flex items-center gap-4">
        <div class="w-0.5 h-5 bg-white opacity-50 rounded-full"></div>
        <a class="icon-option" href="/">
            <img src="/instagram.svg" alt="Instagram">
        </a>
        <a class="icon-option" href="/">
            <img src="/discord.svg" alt="Discord">
        </a>
        <a class="p-px icon-option" href="/">
            <img src="/x.svg" alt="X">
        </a>
    </ul>
</header>

<style lang="postcss">

    section {

        @apply relative flex items-stretch min-h-64 w-full;

    }

    h1 {

        @apply sm:text-5xl text-4xl font-bold;

    }

    h2 {

        @apply sm:text-xl text-lg font-semibold;

    }

    h3 {

        @apply sm:text-lg font-bold;

    }

    h4 {

        @apply sm:text-base text-sm font-semibold;

    }

    p { 

        @apply sm:text-lg text-zinc-100;

    }

    li {

        @apply sm:text-base text-sm text-zinc-300;

    }

    .icon-option {

        @apply w-6 sm:w-7 aspect-square;

    }

    .nav-option {

        @apply hover:scale-[1.02] active:scale-100 cursor-pointer transition-transform block text-center sm:text-lg font-semibold w-full py-2.5 sm:py-3 bg-blue-700 outline-blue-500 outline outline-1 rounded-xl sm:rounded-2xl;
        
    }

    .section-tag{

        @apply w-max sm:text-sm text-xs px-2 sm:mb-1 py-0.5 outline outline-2 font-semibold rounded-full bg-transparent;

    }

    .content-container{

        @apply space-y-2 sm:space-y-3;

    }

    .info-widget{

        @apply sm:p-4 p-3 bg-zinc-900 outline outline-1 outline-zinc-800 rounded-xl sm:rounded-2xl w-full max-w-lg;

    }

    .accent-container{

        @apply w-8 sm:w-10 shrink-0;

    }

    .accent-circle-container{

        @apply pt-[45px] sm:pt-[57px];

    }

    .accent-circle{

        @apply w-2 h-2 mx-auto rounded-full outline-[3px] outline;

    }

    .accent-line-container{

        @apply h-full pb-2 overflow-y-hidden;

    }

    .accent-line{

        @apply w-[3px] h-full mx-auto rounded-full bg-gradient-to-b;

    } 

    .bg-radial-gradient{

        background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%);

    }

</style>
