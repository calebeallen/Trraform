
<script>
	
    import { onMount } from "svelte";
    import { GRID_SIZING, REFS, MODE, OBJECT_SELECT, COLOR_SELECT, OVERLAP, SHOW_BLOCK_PANEL } from "$lib/editor/store";
    import { Scene, MeshBasicMaterial, LineSegments, Spherical, Color } from "three"
    import { BUILD_SIZE_STD, BUILD_SIZE_LARGE } from "$lib/common/constants"
	import { GridGeometry } from "$lib/editor/geometries/gridGeometry";
	import { disposeMesh } from "$lib/common/utils";
	import { fly } from "svelte/transition";

    const gridMat = new MeshBasicMaterial( { transparent: true, opacity: 0.2 } )
    const spherical = new Spherical()

    let grid, size = BUILD_SIZE_STD, isSliderActive = false 

    let t2 = null

    onMount(async () => {

        REFS.gridSizingScene = new Scene()
        REFS.gridSizingScene.background = new Color( 0x333338 )
        REFS.camera.position.setFromSphericalCoords(1, Math.PI * 2/5, Math.PI / 4)
        REFS.camera.target.set(0,0,0)
    
        gridInput()

    })

    function dispose(){

        REFS.gridSizingScene.remove(grid)
        disposeMesh(grid)

    }

    function gridInput(){

        if(grid)

            dispose()

        const gridGeom = new GridGeometry(size, 1)

        grid = new LineSegments(gridGeom, gridMat)

        spherical.setFromVector3(REFS.camera.position)
        spherical.radius = size * 1.3

        REFS.camera.position.setFromSpherical(spherical)

        REFS.camera.lookAt(REFS.camera.target)
        REFS.camera.updateSphere()

        REFS.gridSizingScene.add(grid)

    }

    function mousemove(e){

        if(!isSliderActive && e.which > 0){

            REFS.camera.angularVelocity.theta += -e.movementX / window.innerWidth * 200
            REFS.camera.angularVelocity.phi += e.movementY / window.innerHeight * 200

        }

    }

    function confirm(){

        $GRID_SIZING = false

        dispose()

        $MODE = "place"
        $OBJECT_SELECT = false
        $COLOR_SELECT = false
        $OVERLAP = false
        $SHOW_BLOCK_PANEL = false

        REFS.newBuild([0,size])

    }

    function cancel(){

        $GRID_SIZING = false
        $OBJECT_SELECT = false
        $COLOR_SELECT = false
        $OVERLAP = false
        $SHOW_BLOCK_PANEL = false

        dispose()

        REFS.camera.target.set(REFS.buildSize / 2, 0, REFS.buildSize / 2)

        spherical.setFromVector3(REFS.camera.position)
        spherical.radius = REFS.buildSize * 1.3

        REFS.camera.position.setFromSpherical(spherical)
        REFS.camera.position.add(REFS.camera.target)
        REFS.camera.lookAt(REFS.camera.target)
        REFS.camera.updateSphere()

    }

</script>

<svelte:window

    on:mousemove={mousemove}
    on:mouseup={() => isSliderActive = false}

/>

<div transition:fly={{y: -200, duration: 200}} class="absolute -translate-x-1/2 left-1/2 top-16">
    <div class="flex flex-col items-center">
        <h1 class="text-4xl font-bold text-center lg:text-5xl">New Build {size}x{size}x{size}</h1>
        {#if size > BUILD_SIZE_STD}
            <h2 class="w-full mt-2 text-lg font-semibold text-center text-zinc-300">This size is available to supporters only.</h2>
        {/if}
    </div>
</div>
<div transition:fly={{y: 200, duration: 200}} class="absolute space-y-5 -translate-x-1/2 w-72 bottom-5 left-1/2 panel-container">
    <div class="text-sm font-semibold">Grid Size</div>
    <div class="flex justify-center">
        <input class="slider" bind:value={size} on:input={gridInput} on:mousedown={() => isSliderActive = true} type="range" min="6" max={BUILD_SIZE_LARGE}> 
    </div>
    <div class="flex gap-2">
        <button class="editor-btn" on:click={confirm}>Confirm</button>
        <button class="editor-btn" on:click={cancel}>Cancel</button>
    </div>
</div>


<style lang="postcss">

    .slider {

        @apply w-[90%] h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer;

    }

    .slider::-webkit-slider-thumb {

        @apply w-3.5 h-3.5 bg-zinc-800 rounded-full appearance-none cursor-pointer  outline outline-1 outline-zinc-700   ;

    }

    .slider::-moz-range-thumb {

        @apply w-3.5 h-3.5 bg-zinc-600 rounded-full appearance-none cursor-pointer;

    }

</style>


