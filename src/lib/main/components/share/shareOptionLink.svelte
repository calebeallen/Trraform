
<script>

    export let href = ""
    export let src = ""
    export let alt = ""
    export let tag = ""

</script>

<a href={href} target="_blank" class="relative p-2 transition-colors rounded-full shadow-md select-none bg-zinc-800 active:bg-zinc-700 outline outline-zinc-600 outline-1 shadow-black group" on:click>
    <img class="w-6 h-6" src={src} alt={alt}>
    <div class="absolute top-0 p-1 text-xs font-semibold transition-opacity -translate-x-1/2 -translate-y-[calc(100%+6px)] opacity-0 w-max left-1/2 group-hover:opacity-100">{tag}</div>
</a>