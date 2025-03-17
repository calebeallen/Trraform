
<script>

    export let src = ""
    export let alt = ""
    export let text = ""

</script>

<button on:click class="flex items-center w-full gap-1 px-1 py-0.5 bg-black bg-opacity-0 rounded-lg hover:bg-opacity-50">
    <img class="w-3.5 sm:w-4 aspect-square" src={src} alt={alt}>
    <span class="text-xs sm:text-sm">{text}</span>
</button>