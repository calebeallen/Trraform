
<script>

    export let src = ""
    export let alt = ""
    export let text = ""

</script>

<button on:click class="flex items-center w-full gap-1 p-1 bg-black bg-opacity-0 rounded-lg hover:bg-opacity-50">
    <img class="w-4 h-4" src={src} alt={alt}>
    <span class="text-sm">{text}</span>
</button>