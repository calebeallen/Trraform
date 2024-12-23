
<script>

    import { fly } from "svelte/transition";
    import { createEventDispatcher } from "svelte";

    const dispatchEvent = createEventDispatcher()

    export let options = []
    export let selectedIndex = 0

    let expanded = false

    function select(i){

        if(i != selectedIndex){

            selectedIndex = i
            dispatchEvent("change", {index: i})

        }

        expanded = false

    }

</script>

<div class="relative w-full">
    <button on:click={() => expanded = !expanded} class="flex items-center gap-1 px-2 py-1 text-sm truncate transition-colors rounded-lg outline outline-1 outline-zinc-600 bg-zinc-700 hover:bg-opacity-80">
        {options[selectedIndex]}
        <svg class="w-5 h-5 -mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon">
            <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
        </svg>
    </button>
    {#if expanded}
        <div transition:fly={{ y: -5, duration: 100}} class="absolute left-0 mt-2 overflow-hidden rounded-lg w-max top-full bg-zinc-700">
            {#each options as option, i}
                <button on:click={() => select(i)} class="px-3 py-1.5 block p-2 text-sm hover:bg-zinc-600 w-full">{option}</button>
            {/each}
        </div>
    {/if}
</div>
