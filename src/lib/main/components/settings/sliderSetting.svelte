
<script>

    import { fade } from "svelte/transition";
    import { onMount } from "svelte"
    import { refs } from "../../store"
    import Slider from "../slider.svelte";

    export let name = ""
    export let value = 0
    export let min = 0
    export let max = 10
    export let exp = 1
    export let stepSize = 1
    export let nolimit = false
    export let prefix = null
    export let postfix = null
    export let units = ["","k", "M"]
    let valueStr = ""

    $:{

        if (nolimit && value >= max) 

            valueStr = "No Limit"

        else {

            if (value >= 1000000) 
                valueStr = (value / 1000000).toFixed(1).replace(/\.0$/, '') + units[2]
            else if (value >= 1000)
                valueStr = (value / 1000).toFixed(1).replace(/\.0$/, '') + units[1]
            else 
                valueStr = value.toString() + units[0]

        }

        if(prefix !== null)

            valueStr = `${prefix} ${valueStr}`

        if(postfix !== null)

            valueStr = `${valueStr} ${postfix}`

    }

</script>

<div class="flex items-center justify-between w-full gap-3">
    <div class="flex items-center flex-1 gap-1 text-sm">
        <div class="break-words min-w-16 max-w-fit ">{name}</div>
        <div class="w-fit"><slot/></div>
    </div>
    <div class="flex items-center gap-3 w-52 sm:w-60">
        <Slider bind:value bind:max bind:min bind:exp bind:stepSize/>
        <div class="w-20 text-sm text-center">{valueStr}</div>
    </div>
</div>

