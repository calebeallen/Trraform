

<script>

	import { fly } from "svelte/transition";
    export let store

</script>


{#each $store as { id, header, text, callback } (id) }
    <button transition:fly={{ x: 600, opacity: 1, duration: 200, delay: 500 }} on:click={callback} class="fixed p-2 pb-4 w-[calc(100%-16px)] sm:w-[calc(100%-24px)] max-w-sm bottom-2 right-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden text-left">
        <h1 class="block text-sm font-semibold sm:text-base">{header}</h1>
        <p class="block mt-2 text-xs sm:text-sm">{text}</p>
        <div class="time-bar"></div>
    </button>
{/each}

<style lang="postcss">

    .time-bar {

        @apply absolute bottom-0 left-0 w-full h-1 bg-blue-700 rounded-full;
        animation: time-bar-animation 5s forwards;

    }

    @keyframes time-bar-animation {
		from {
			left: -100%;
		}
		to {
			left: 0%;
		}
	}
    

</style>