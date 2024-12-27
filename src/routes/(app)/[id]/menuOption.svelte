
<script>

    export let toggle = false
    export let src = ""
    export let alt = ""
    export let tag = ""

</script>

<button on:click class="{toggle ? 'opactiy-100' : 'opacity-50'} relative block group w-6 sm:w-7 hover:opacity-100">
    <span class="absolute mr-1 text-sm font-semibold transition-opacity -translate-y-1/2 opacity-0 pointer-events-none select-none right-full w-max top-1/2 group-hover:opacity-100">{tag}</span>
    <img src={src} alt={alt}>
</button>