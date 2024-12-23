

<script>

    import { onMount } from "svelte"

    export let value
    export let max = 10
    export let min = 0
    export let exp = 1
    export let stepSize = 1
    
    $: {
        const range = max - min
        value = Math.round(Math.pow(value / range, exp) * range)
    }

</script>

<input class="slider" type="range" bind:value={value} min={min} max={max} step={stepSize}> 

<style lang="postcss">

    .slider {

        @apply w-full h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer;

    }

    .slider::-webkit-slider-thumb {

        @apply w-3.5 h-3.5 bg-zinc-700 rounded-full appearance-none cursor-pointer outline outline-1 outline-zinc-600   ;

    }

    .slider::-moz-range-thumb {

        @apply w-3.5 h-3.5 bg-zinc-700 rounded-full appearance-none cursor-pointer;

    }

</style>
