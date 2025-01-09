
<script>

    import Tool from "$lib/editor/components/utils/tool.svelte"
    import { createEventDispatcher } from 'svelte'

    export let tipPosition = "right"
    export let tipHeader = null
    export let tipImageSrc = null
    export let tipImageAlt = ""
    let state = "enabled"

    const dispatch = createEventDispatcher()

    function click(){

        state = state === "enabled" ? "selected" : "enabled"
        dispatch("toggle", state === "selected")

    }
    
</script>

<!-- replace with <Tool/> -->
<Tool {tipPosition} {tipHeader} {tipImageSrc} {tipImageAlt} bind:state on:click={click}>
    <slot name="icon" slot="icon"/>
    <slot name="tipContent" slot="tipContent"/>
</Tool>
