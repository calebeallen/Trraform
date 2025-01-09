
<script>

    import { onMount } from "svelte";
    import { ColorLibrary, HUES, GRID_SIZE } from "$lib/common/colorLibrary";
    import { PLOT_COUNT } from "$lib/common/constants"
    import { COLOR_INDEX, EYEDROP, MODE, ModifyEvent, PLOTS_PLACED, REFS, SHOW_BLOCK_PANEL, addEvent } from "$lib/editor/store";
    import { draggable } from "$lib/editor/components/utils/draggable"

    const GS2 = GRID_SIZE * GRID_SIZE
    const START = PLOT_COUNT + 1

    let panel
    let gridCanvas, gridCtx, hueCtx
    let gridSelCol = 'rgb(0,0,0)'
    let hueSelCol = 'rgb(0,0,0)'
    let hueDivision, gridDivision
    let ismousedown = false
    let hue = 0
    let gridPos = { x: 0, y: 0 }
    let size = 1

    onMount(() => {
        
        const panelBounds = panel.getBoundingClientRect()

        //set panel initial position
        panel.style.top = `${ panelBounds.top + panelBounds.height > window.innerHeight - 10 ?  window.innerHeight - 10 - panelBounds.height : panelBounds.top }px`

    })

    function sizeInput(){

        if(size === null)

            return

        size = size < 1 ? 1 : size > 100 ? 100 : size

        REFS.diameter = size

    }

    function sizeChange(){

        if(size === null){

            size = 1

            return

        }

        size = size < 1 ? 1 : size > 100 ? 100 : size

        REFS.diameter = size

    }

    REFS.setColorFromIndex = ci => {

        ci -= PLOT_COUNT + 1
        const grid = ci % GS2
        hue = Math.floor(ci / GS2) 

        gridPos.x = grid % GRID_SIZE
        gridPos.y = Math.floor(grid / GRID_SIZE)

        hueInput()

    }

    function hueCanvasMount(e){

        hueCtx = e.getContext("2d")

        const bounds = e.getBoundingClientRect()

        hueDivision = bounds.height / HUES
        gridDivision = bounds.height / GRID_SIZE

        //create hue slider
        for(let i = 0; i < HUES; i++){

            hueCtx.fillStyle = ColorLibrary.rgbString(i * GS2 + START)
            hueCtx.fillRect(0, hueDivision * i, 10, Math.ceil(hueDivision) + 0.5)

        }

        hueInput()

    }

    function gridCanvasMount(e){

        gridCtx = e.getContext("2d")

    }

    function hueInput(){

        //draw grid canvas
        for(let i = 0; i < GS2; i++){
            
            gridCtx.fillStyle = ColorLibrary.rgbString(hue * GS2 + START + i)
            gridCtx.fillRect((i % GRID_SIZE) * gridDivision, Math.floor(i / GRID_SIZE) * gridDivision, Math.ceil(gridDivision) + 0.5, Math.ceil(gridDivision) + 0.5)

        }

        //set hue slider color
        hueSelCol = ColorLibrary.rgbString(hue * GS2 + START)

        setColor()

    }

    function gridMouseDown(e){

        gridInput(e)
        ismousedown = true

    }

    function gridInput(e){

        let bounds = gridCanvas.getBoundingClientRect();

        gridPos.x = e.clientX - bounds.x
        gridPos.y = e.clientY - bounds.y

        gridPos.x = Math.floor(gridPos.x / gridDivision)
        gridPos.y = Math.floor(gridPos.y / gridDivision)

        gridPos.x = gridPos.x > GRID_SIZE - 1 ? GRID_SIZE - 1 : gridPos.x
        gridPos.x = gridPos.x < 0 ? 0 : gridPos.x
        gridPos.y = gridPos.y > GRID_SIZE - 1 ? GRID_SIZE - 1 : gridPos.y
        gridPos.y = gridPos.y < 0 ? 0 : gridPos.y

        setColor()
        
    }

    function setColor(){

        //get color index
        let col = hue * GS2 + gridPos.y * GRID_SIZE + gridPos.x + START

        $COLOR_INDEX = col

        //set grid slider color
        gridSelCol = ColorLibrary.rgbString(col)
       
    }

    function changeBlockType(blockType){

        $EYEDROP = false

        if( $MODE !== "place" && blockType == 2)

            return

        if(blockType == 2){

            $COLOR_INDEX = 1

            for(let i = 0; i < $PLOTS_PLACED.length; i++)

                if($PLOTS_PLACED[i] === false){

                    $COLOR_INDEX = i + 1
                    
                    break

                }

        }

        REFS.blockType = blockType

    }


    function clearPlots(){
        
        const pis = REFS.build.plotIndicies

        const affected = []
        const before = []

        for(let i = 0; i < pis.length; i++){

            if(pis[i] != -1){

                affected.push(pis[i])
                before.push([i + 1, false])

                REFS.build.modifyByIndex(pis[i], 0)

            }

        }

        if(affected.length > 0)

            addEvent( [ new ModifyEvent(affected, before, [[0, false]]) ], "place" )

    }

    $:{

        if( $MODE !== "place" && REFS.blockType == 2)

            REFS.blockType = 0

    }

</script>

<svelte:window 

    on:mousemove={ ismousedown ? gridInput : null } 
    on:mouseup={ () => ismousedown = false }

/>

<div bind:this={panel} class="select-none panel-container transition-opacity { $SHOW_BLOCK_PANEL ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none" }" style="top: calc(100% / 2 + 190px); left: 56px;" use:draggable>
    <div class="text-sm font-semibold">Block</div>
    <div class="space-y-2">
        <div class="container">
            <div class="my-auto text-xs">Type</div>
            <div class="flex flex-row gap-1">
                <button tabindex="-1" on:click={() => changeBlockType(0)} class="toggle-btn {REFS.blockType == 0 ? "selected" : "enabled"}">
                    <img src="/cubeOutline.svg" alt="cube outline">
                </button>
                <button tabindex="-1" on:click={() => changeBlockType(1)} class="toggle-btn {REFS.blockType == 1 ? "selected" : "enabled"}">
                    <img src="/sphereOutline.svg" alt="sphere outline">
                </button>
                <button tabindex="-1" on:click={() => changeBlockType(2)} class="toggle-btn {REFS.blockType == 2 ? "selected" : $MODE === "place" ? "enabled" : "disabled"}">
                    <img src="/plot.svg" alt="plot">
                </button>
            </div>
        </div>
        <div class="divider"></div>
        {#if REFS.blockType != 2}
            <div class="container">
                <div class="my-auto text-xs">Size</div>
                <input tabindex="-1" class="w-10 transform-input panel-number-input" type="number" name="scale" bind:value={size} on:input={sizeInput} on:change={sizeChange}> 
            </div>
            <div class="container">
                <div class="text-xs">Color</div>
                <button tabindex="-1" class="w-4 h-4 transition-all rounded active:scale-90 { $EYEDROP ? "selected" : "enabled" }" on:click={ () => $EYEDROP = !$EYEDROP }>
                    <img src="/eyeDropper.svg" alt="eye dropper">
                </button>
            </div>
            <div class="container">
                <canvas bind:this={gridCanvas} use:gridCanvasMount class="w-40 h-40 p-0 m-0 rounded cursor-pointer" width="160px" height="160px" on:mousedown={ gridMouseDown }></canvas>  
                <div class="relative w-2 h-40">
                    <canvas use:hueCanvasMount class="absolute bg-white rounded" width="8px" height="160px"></canvas>  
                    <input tabindex="-1" type="range" class="absolute top-0 z-10 w-40 h-2 p-0 ml-2 origin-top-left rotate-90 cursor-pointer opacity-5" max={HUES} bind:value={ hue } on:input={ hueInput }>
                </div>
                <div class="-translate-x-1/2 selector" style="left: {gridPos.x * gridDivision + gridDivision / 2}px; top: {gridPos.y * gridDivision + gridDivision / 2}px; background-color: {gridSelCol}"></div>
                <div class="selector right-0 translate-x-[2px]" style="top: {hue * hueDivision + hueDivision / 2}px; background-color: {hueSelCol}"></div>
            </div>
        {:else}
            <div class="flex flex-wrap gap-[6px] w-44">
                {#each $PLOTS_PLACED as val, i }
                    <button tabindex="-1" class="relative toggle-btn {$COLOR_INDEX === i + 1 ? "selected" : "enabled"}" on:click={() => $COLOR_INDEX = i + 1}>
                        <div class="{val ? "opacity-50" : ""}">
                            <img src="/plot.svg" alt="plot">
                            <span class="absolute bottom-0.5 right-1 text-[6pt]">{i + 1}</span>
                        </div>
                    </button>
                {/each}
            </div>
            <div class="container">
                <button tabindex="-1" class="editor-btn" on:click={clearPlots}>Clear</button>
            </div>
        {/if}
    </div>
</div>

<style lang="postcss">

    .container{

        @apply relative w-44 flex flex-row justify-between;

    }

    .selector{

        @apply absolute w-3 h-3 rounded-xl -translate-y-1/2 bg-black pointer-events-none outline outline-1 outline-white;

    }

    .toggle-btn{

        @apply w-6 h-6 p-0.5 rounded-lg text-center;

    }

    .enabled {

        @apply hover:bg-zinc-700 active:bg-opacity-80;

    }

    .disabled {

        @apply opacity-50;

    }

    .selected {

        @apply bg-zinc-700 active:bg-opacity-80; 

    }

</style>
