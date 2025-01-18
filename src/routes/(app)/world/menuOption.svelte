
<script>
    import { writable } from "svelte/store";


    export let toggle = false
    export let src = ""
    export let alt = ""
    export let tag = ""
    export let newBinding = writable(false)

</script>

<button on:click class="{toggle ? 'opactiy-100' : 'opacity-50'} relative block group w-7 hover:opacity-100">
    <span class="absolute mr-1 text-sm font-semibold transition-opacity -translate-y-1/2 opacity-0 pointer-events-none select-none right-full w-max top-1/2 group-hover:opacity-100">{tag}</span>
    {#if $newBinding}
        <div class="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
    {/if}
    <img src={src} alt={alt}>
</button>