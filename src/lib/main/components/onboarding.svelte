
<script>

    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
    
    let show = 0
    let interval = null
    let showFront = true

    const dispatch = createEventDispatcher()

    onMount(() => {

        interval = setInterval(() => show++, 1000)
        

    })

    function enter(){

        if(show > 3){

            showFront = false
            clearInterval(interval)
            localStorage.setItem("onboarded", true)

            setTimeout(() => dispatch("close"), 1500)
           
        }

    }
    
</script>

<svelte:document on:click={enter} on:keydown={enter}/>

<div out:fade class="fixed flex items-center justify-center w-screen h-screen bg-black">
    <div class="font-bold text-center texl-xl sm:text-2xl">Welcome</div>
</div>
{#if showFront}
<div out:fade class="fixed flex items-center justify-center w-screen h-screen bg-black">
    <div class="flex flex-col items-center gap-4 font-bold text-center texl-xl sm:text-2xl">
        <div class="{show > 0 ? "opacity-100" : "opacity-0"} transition-opacity">How it works:</div>
        <div class="{show > 1 ? "opacity-100" : "opacity-0"}  transition-opacity">1. Claim any open plot</div>
        <div class="{show > 2 ? "opacity-100" : "opacity-0"}  transition-opacity">2. Build anything on it</div>
        <div class="{show > 3 ? "opacity-100" : "opacity-0"}  transition-opacity">3. Explore inside of plots to find even more plots.</div>
        <button class="{show > 4 ? "opacity-100 animate-pulse" : "opacity-0"} transition-opacity flex items-center gap-1 hover:opacity-50 mt-4 ">Got it!</button>
    </div>
</div>
{/if}