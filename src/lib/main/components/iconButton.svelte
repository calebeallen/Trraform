
<script>

    export let content = ""
    export let href = ""
    export let onclick = () => {}

</script>

<a href={href} on:click={onclick} class="flex items-center gap-1 p-1 bg-black bg-opacity-0 rounded-lg active:opacity-70 hover:bg-opacity-20">
    <div class="w-5 h-5">
        <slot/>
    </div>
    <div class="text-sm transition-transform">{content}</div>
</a>