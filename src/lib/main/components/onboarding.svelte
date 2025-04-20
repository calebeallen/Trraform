
<script>

    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
    
    let show = 0
    let interval = null

    const dispatch = createEventDispatcher()

    onMount(() => {

        interval = setInterval(() => show++, 1300)
        

    })

    function enter(){

        if(show > 3){
            dispatch("close")
            clearInterval(interval)
            localStorage.setItem("onboarded", true)
        }

    }
    
</script>

<svelte:document on:click={enter} on:keydown={enter}/>

<div out:fade class="fixed flex items-center justify-center w-screen h-screen bg-black">
    <div class="flex flex-col items-center gap-4 font-bold text-center texl-lg sm:text-2xl">
        <div class="{show > 0 ? "opacity-100" : "opacity-0"} transition-opacity">How it works:</div>
        <div class="{show > 1 ? "opacity-100" : "opacity-0"}  transition-opacity">1. Claim any plot</div>
        <div class="{show > 2 ? "opacity-100" : "opacity-0"}  transition-opacity">2. Build anything on it</div>
        <button class="{show > 3 ? "opacity-100 animate-pulse" : "opacity-0"} transition-opacity flex items-center gap-1 hover:opacity-50 mt-4 ">
            <div>Got it!</div>
        </button>
    </div>
</div>