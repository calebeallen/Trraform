
<script>

    import { onMount } from "svelte"
    import { fly } from "svelte/transition"
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
    <div transition:fly={ { x: -500, opacity: 1 } } class="fixed bottom-0 left-0 w-full max-w-md p-3 sm:p-5">
        <h1>Millions of Worlds</h1>
        <h3 class="mt-1">Powered by <b>Ethereum</b> <img class="inline-block w-2 h-3 translate-y-px" src="/eth-small.svg" alt=""></h3>
        <nav class="flex flex-col w-full gap-3 mt-4">
            <a class="nav-option" href="/0x00">Explore</a>
            {#if !$isMobileBrowser}
                <a class="nav-option" target="_blank" href="/editor">Build</a>
            {/if}
        </nav>
    </div>
{/if}


<div bind:this={sectionContainer} class="relative w-full max-w-screen-lg mx-auto mt-[100vh] py-1">
    <section bind:this={s0} class="flex items-stretch mt-10 min-h-64">
        <div class="w-8 sm:w-10 shrink-0"> 
            <div class="sm:mt-[60px] mt-[46px]">
                <div class="{renderS0 ? "" : "opacity-0 delay-500"} accent-circle outline-blue-500"></div>
            </div>
            <div class="accent-line-container">
                <div class="{renderS0 ? "" : "-translate-y-full"} accent-line from-blue-500 to-cyan-500"></div>
            </div>
        </div>
        <div class="flex flex-col items-center justify-between flex-1 w-full gap-2 mb-64 sm:flex-row sm:items-start">
            <div class="space-y-2 sm:space-y-3">
                <div class="{renderS0 ? "" : "translate-x-5 opacity-0"} section-tag text-blue-500">Create and Explore</div>
                <h1 class="{renderS0 ? "" : "translate-x-5 opacity-0"} duration-500 delay-75 mt-2">Build Your World</h1>
                <div class="{renderS0 ? "" : "translate-x-5 opacity-0"} duration-500 delay-150 w-full sm:max-w-md pr-2 space-y-1 sm:space-y-2">
                    <p>Create <b class="text-lime-300">worlds within worlds</b>, and bring your unique creations to life alongside <b class="text-lime-300">thousands</b> of others.</p>
                    <p>With <b class="text-lime-300">unmatched innovation</b>, Trraform offers a truly unique approach to crypto—an experience tailored not only to holders, but to <b class="text-lime-300">everyone</b>.</p>
                </div>
            </div>
            <div class="{renderS0 ? "" : "translate-y-10 opacity-0"} duration-500 delay-150 transition-all relative hidden mr-2 -transform w-72 md:w-96 shrink-0 sm:block aspect-square bg-radial-gradient">
                <img src="/buildExample.png" alt="" loading="lazy">
                <div class="absolute w-56 bottom-1 right-1 container0 space-y-0.5 scale-75 md:scale-100 shadow-xl hover:shadow-2xl transition-shadow">
                    <div class="text-xs opacity-70">id: 0xa124b1c4</div>
                    <div class="max-w-full font-bold">Japanese Farmhouse 民家</div>
                    <div class="w-full h-px bg-zinc-700"></div>
                    <div class="w-full text-xs break-words">This style of house dates to 1603 and was commonly used by farmers and merchants in rural Japan.</div>
                </div>
            </div>
        </div>  
    </section>  
    <section bind:this={s1} class="flex items-stretch min-h-64">
        <div class="flex-row w-8 sm:w-10"> 
            <div class="sm:mt-[60px] mt-[46px]">
                <div class="{renderS0 ? "" : "opacity-0"} accent-circle outline-cyan-500"></div>
            </div>
            <div class="accent-line-container">
                <div class="{renderS1 ? "" : "-translate-y-full"} accent-line from-cyan-500 to-blue-500"></div>
            </div>
        </div>
        <div class="flex-1 mb-64 space-y-2 sm:space-y-3">
            <div class="{renderS1 ? "" : "translate-x-5 opacity-0"} section-tag text-cyan-500">Crypto</div>
            <h1 class="{renderS1 ? "" : "translate-x-5 opacity-0"} duration-500 delay-75">Mint, Earn, Trade</h1>
            <div class="{renderS1 ? "" : "translate-x-5 opacity-0"} duration-500 delay-150 w-full pr-2 space-y-1 sm:space-y-2">
                <p>Find any open spot and make it your own. By simply owning a plot, you <b class="text-lime-300">automatically earn 70% royalties</b> when one of its subplots are minted. The funds go straight to your wallet. Better yet, <b class="text-lime-300">you set the mint price</b> for these subplots.</p>
                <p>Interested in trading? Trraform implements the <b class="text-lime-300">ERC-721 token standard</b> for seamless integration with popular NFT exchanges. Trade your plot like any other token.</p>
            </div>
        </div>
    </section>
    <section bind:this={s2} class="relative">
        <div class="absolute top-0 left-0 w-8 h-full sm:w-10 -z-10"> 
            <div class="sm:mt-[60px] mt-[46px]">
                <div class="{renderS1 ? "" : "opacity-0"} accent-circle outline-blue-500"></div>
            </div>
            <div class="accent-line-container">
                <div class="{renderS2 ? "" : "-translate-y-full"} accent-line from-blue-500 to-cyan-500"></div>
            </div>
            <div>
                <div class="{renderS2 ? "" : "opacity-0"} delay-500 accent-circle outline-cyan-500"></div>
            </div>
        </div>
        <div class="ml-8 sm:ml-10">
            <div class="w-full space-y-2 sm:space-y-3">
                <div class="{renderS2 ? "" : "translate-x-5 opacity-0"} section-tag text-blue-500">Whats included?</div>
                <h1 class="{renderS2 ? "" : "translate-x-5 opacity-0"} duration-500 delay-75">Benefits at Every Level</h1>
                <div class="{renderS2 ? "" : "translate-x-5 opacity-0"} duration-500 delay-150 w-full max-w-md pr-2 space-y-1 sm:space-y-2">
                    <p>Depth indicates how many layers of plots a single plot is nested within. There's perks to all of them!</p>
                </div>
            </div>
        </div>
        <div class="flex flex-col w-full gap-3 p-2 mt-10">
            <div class="{renderS2 ? "" : "translate-x-5 opacity-0"} delay-200 info-widget">
                <div class="w-6 h-6 ml-auto">
                    <!-- <Icosahedron/> -->
                </div>
                <h4 class="sm:mb-1 mb-0.5">Depth 0 (base layer)</h4>
                <ul class="ml-2">
                    <li><b class="text-lime-300">24 mintable subplots</b></li>
                    <li>32x32x32 maximum build size</li>
                </ul>
            </div>
            <div class="{renderS2 ? "" : "translate-x-5 opacity-0"} delay-300 info-widget">
                <div class="w-6 h-6 ml-auto">
                    <!-- <Icosahedron/> -->
                </div>
                <h4 class="sm:mb-1 mb-0.5">Depth 1</h4>
                <ul class="ml-2">
                    <li><b class="text-lime-300">24 mintable subplots</b></li>
                    <li>48x48x48 maximum build size</li>
                </ul>
            </div>
            <div class="{renderS2 ? "" : "translate-x-5 opacity-0"} delay-[400ms] info-widget">
                <div class="w-6 h-6 ml-auto">
                    <!-- <Dodecahedron/> -->
                </div>
                <h4 class="sm:mb-1 mb-0.5">Depth 2</h4>
                <ul class="ml-2">
                    <li><b class="text-lime-300">64x64x64 maximum build size</b></li>
                </ul>
            </div>
        </div>
    </section>
    <section bind:this={s3} class="relative mt-64">
        <div class="absolute top-0 right-0 w-8 h-full sm:w-10 -z-10"> 
            <div class="sm:mt-[23px] mt-[18px]">
                <div class="{renderS3 ? "" : "opacity-0 delay-500"} accent-circle outline-blue-500"></div>
            </div>
            <div class="accent-line-container">
                <div class="{renderS3 ? "" : "-translate-y-full"} accent-line from-blue-500 to-cyan-500"></div>
            </div>
            <div>
                <div class="{renderS3 ? "" : "opacity-0"} accent-circle delay-500 outline-cyan-500"></div>
            </div>
        </div>
        <div class="ml-auto mr-8 space-y-2 w-max sm:mr-10 sm:space-y-3">
            <h1 class="{renderS3 ? "" : "-translate-x-5 opacity-0"} text-right duration-500 delay-75">Trraform Editor</h1>
            <h2 class="{renderS3 ? "" : "-translate-x-5 opacity-0"} text-right duration-500 delay-150">With 3D Model Conversion</h2>
        </div>
        <a target="_blank" href="/editor" class="{renderS3 ? "" : "translate-y-5 opacity-0"} duration-500 delay-200 block px-2 mt-10 transition-all">
            <img class="aspect-[16/9] w-full sm:rounded-2xl rounded-xl outline outline-1 shadow-2xl outline-zinc-600" src="/editor.png" alt="" loading="lazy">
        </a>
    </section>
    <footer class="flex justify-center mt-64">
        <div class="flex flex-wrap-reverse justify-center px-10 text-xs gap-x-3 sm:text-sm">
            <span>© 2024 Trraform. All rights reserved.</span>
            <div class="flex gap-x-3">
                <a target="_blank" href="/terms-of-service">Terms of Service</a>
                <a target="_blank" href="/privacy-policy">Privacy Policy</a> 
            </div>
        </div>
    </footer>
    <!-- eth svg -->
    <div class="absolute -translate-y-1/2 translate-x-32 right-0 bottom-[35%] opacity-10 -z-10">
        <div class="rotate-12 w-[50vw] max-w-screen-md min-w-[500px] aspect-square">
            <!-- <Ethereum/> -->
        </div>
    </div>
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
        <a class="icon-option" href="/">
            <img src="/x.svg" alt="X">
        </a>
    </ul>
</header>

<style lang="postcss">

    .icon-option {

        @apply w-6 sm:w-7 aspect-square;

    }

    .nav-option{

        @apply hover:scale-[1.02] active:scale-100 cursor-pointer transition-transform block text-center sm:text-lg font-semibold w-full py-2.5 sm:py-3 bg-blue-700 outline-blue-500 outline outline-1 rounded-xl sm:rounded-2xl;
        
    }

    .section-tag{

        @apply w-max sm:text-sm text-xs px-2 sm:mb-1 py-0.5 outline outline-2 font-semibold rounded-full bg-transparent transition-transform;

    }

    .info-widget{

        @apply transition-all duration-500 flex-1 sm:p-4 p-3 bg-zinc-900 outline outline-1 outline-zinc-800 rounded-2xl w-full max-w-lg;

    }

    section{

        @apply min-h-36 w-full;

    }

    h1 {

        @apply sm:text-5xl text-4xl font-bold;

    }

    h2 {

        @apply sm:text-xl text-lg font-semibold text-zinc-300;

    }

    h3 {

        @apply sm:text-base text-sm font-semibold;

    }

    p{

        @apply sm:text-lg text-zinc-100;
        
    }
    
    

    h4{

        @apply sm:text-lg font-bold;

    }

    li{

        @apply sm:text-base text-sm text-zinc-300;

    }

    .accent-line-container{

        @apply flex-shrink w-full h-[calc(100%-10px)] overflow-y-hidden;

    }

    .accent-line{

        @apply w-[3px] h-full mx-auto rounded-full transition-transform duration-500 bg-gradient-to-b;

    } 

    .accent-circle{

        @apply w-2 h-2 mx-auto rounded-full outline-[3px] outline transition-opacity;

    }

    .bg-radial-gradient{

        background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%)

    }

</style>
