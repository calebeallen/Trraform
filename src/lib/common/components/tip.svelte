
<script>

    export let text = ""
    export let addedClasses = ""

</script>

<div class="relative flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-700 group">
    <img src="/question.svg" alt="tip">
    <div class="absolute opacity-0 group-hover:opacity-100 bg-zinc-700 max-w-52 text-xs p-1 rounded-md w-max pointer-events-none transition-opacity {addedClasses}">{text}</div>
</div>