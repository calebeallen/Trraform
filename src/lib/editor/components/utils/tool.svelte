
<script>

    export let state = "enabled"
    export let tipPosition = "right"
    export let tipHeader = null
    export let tipImageSrc = null
    export let tipImageAlt = ""
    
</script>

<button on:click tabindex="-1" class="{ state } relative block w-8 h-8 p-1.5 transition-colors rounded-lg group">
    <slot name="icon"/>
    {#if tipHeader !== null}
        <div class="{ tipPosition } pointer-events-none opacity-0 transition-opacity delay-200 group-hover:opacity-100">
            <div class="overflow-hidden rounded-lg max-w-56 w-max bg-zinc-800 outline outline-zinc-800 outline-1">
                <div class="p-1">
                    <h2 class="text-sm font-semibold">{tipHeader}</h2>
                    <slot name="tipContent"/>
                </div>
                {#if tipImageSrc}
                    <img class="w-56 aspect-square" src={tipImageSrc} alt={tipImageAlt} loading="lazy">
                {/if}
            </div>
        </div>
    {/if}
</button>

<style>

    .enabled {

        @apply hover:bg-zinc-700 active:bg-opacity-80;

    }

    .disabled {

        @apply opacity-50;

    }

    .selected {

        @apply bg-zinc-700 active:bg-opacity-80; 

    }

    .right {

        @apply absolute left-0 top-0 translate-x-11 translate-y-0.5;

    }

    .top {

        @apply w-max absolute right-0 bottom-0 -translate-y-9;

    }

</style>