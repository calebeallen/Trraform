
<script>

    import { CloseSVG } from "@packages/ui";
    import { onDestroy, onMount, createEventDispatcher } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { refs } from "../store";

    export let header
    let addedClasses = '';
    export { addedClasses as class };

    const dispatch = createEventDispatcher();

    // disable world movement events
    onMount(() => refs.disabled = true)
    onDestroy(() => refs.disabled = false)

    function clickOutside(node) {
  
        const handleClick = event => {

            if (node && !node.contains(event.target) && !event.defaultPrevented) 

                node.dispatchEvent(new CustomEvent('click_outside', node))
            
        }

        document.addEventListener('click', handleClick, true)
        
        return {

            destroy() {

                document.removeEventListener('click', handleClick, true)

            }

        }

    }

</script>

<div transition:fade={{duration: 150}} class="fixed top-0 left-0 grid w-full h-full px-2 overflow-auto bg-black bg-opacity-50 place-items-center">
    <div on:click_outside={() => dispatch("close")} transition:fly={{duration: 150, y: 50}} class="w-full p-4 bg-zinc-800 outline outline-1 outline-zinc-700 rounded-2xl {addedClasses}">
        <div class="flex items-baseline justify-between w-full mb-2">
            <h1 class="text-lg font-bold">{header}</h1>
            <button on:click={() => dispatch("close")} class="w-5 h-5 transition-opacity active:opacity-60">
                <CloseSVG/>
            </button>
        </div>
        <slot/>
    </div>
</div>