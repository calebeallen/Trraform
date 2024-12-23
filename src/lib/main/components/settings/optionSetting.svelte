
<script>

    export let name = ""
    export let options = []
    export let width = 200
    export let selected = 0

    const optionWidth = width / options.length

</script>




<div class="flex items-center justify-between w-full gap-3">
    <div class="flex items-center flex-1 gap-1 text-sm">
        <div class="break-words w-fit max-w-fit">{name}</div>
        <div class="w-fit"><slot/></div>
    </div>
    <div class="relative flex items-center rounded-lg bg-zinc-700 outline outline-1 outline-zinc-600" style="width: {width}px;">
        <div class="absolute h-6 transition-transform rounded-md bg-zinc-600" style="width: {optionWidth}px; transform: translateX({selected * optionWidth}px)"></div>
        {#each options as name, i}
            <button on:click={() => selected = i} class="inline-block py-0.5 text-sm text-center z-10 active:opacity-50 transition-opacity" style="width: {optionWidth}px;">{name}</button>
        {/each}
    </div>
</div>

