
<script>

    import { createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";

    export let closeOnClickOutside = false
    export let header
    let addedClasses = ''
    export { addedClasses as class }
    let contentContainer

    const dispatch = createEventDispatcher();

    function click(e){

        if(!contentContainer.contains(e.target)){
            console.log("close")
            dispatch("close")

        }
        
    }
    
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:click={click} transition:fade={{duration: 150}} class="fixed top-0 left-0 grid w-full h-full px-2 overflow-auto bg-black bg-opacity-50 place-items-center">
    <div bind:this={contentContainer} on:click|stopPropagation transition:fly={{duration: 150, y: 50}} class="w-full p-4 bg-zinc-800 outline outline-1 outline-zinc-700 rounded-2xl shadow-2xl shadow-black {addedClasses}">
        <div class="flex items-baseline justify-between w-full mb-2">
            <h1 class="text-base font-bold sm:text-lg">{header}</h1>
            <button on:click={() => dispatch("close")} class="w-5 h-5 transition-opacity active:opacity-60">
                <img src="/close.svg" alt="close">
            </button>
        </div>
        <slot/>
    </div>
</div>