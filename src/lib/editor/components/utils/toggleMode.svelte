
<script>

    import { MODE } from '$lib/editor/store'
    import Tool from "$lib/editor/components/utils/tool.svelte"
    import { createEventDispatcher } from 'svelte'

    export let mode = ""
    export let selectIfModes = []
    export let disableIfModes = []
    export let overrideDisabled = false

    export let tipPosition = "right"
    export let tipHeader = null
    export let tipImageSrc = null
    export let tipImageAlt = ""
    let state = "disabled"
    
    const dispatch = createEventDispatcher()

    $:{

        if(disableIfModes.includes($MODE) && !overrideDisabled)

            state = "disabled"

        else if(selectIfModes.includes($MODE))

            state = "selected"
                
        else

            state = "enabled"

    }
           

    function click(){

        //switch modes function is only called when the user switches modes via ui interface.
        if (state === "enabled") {

            dispatch("toggle", { mode })
            $MODE = mode

        } else if (state === "selected") {

            dispatch("toggle", { mode: "place" })
            $MODE = "place" 

        }

    }
    
</script>

<Tool {tipPosition} {tipHeader} {tipImageSrc} {tipImageAlt} bind:state on:click={click}>
    <slot name="icon" slot="icon"/>
    <slot name="tipContent" slot="tipContent"/>
</Tool>
