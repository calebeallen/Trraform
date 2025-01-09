

<script>

	import { fly } from "svelte/transition";
    import { CONVERTING, EndTransformable, FACES_CONVERTED, MODE, REFS, TOTAL_CONVERT, addEvent } from "$lib/editor/store";
	import { onMount } from "svelte";
    import { TransformableGlb } from "$lib/editor/transform"
	import { Euler, Vector3 } from "three";
    import Tool from "$lib/editor/components/utils/tool.svelte";

    let last, tranX, tranY, tranZ, rotX, rotY, rotZ, scale

    onMount(() => {

        last = {}

        if(REFS.transform instanceof TransformableGlb){

            const rot = new Euler()

            rot.setFromQuaternion(REFS.transform.glbMesh.quaternion)

            last.rotX = rotX = rot.x.toFixed(2)
            last.rotY = rotY = rot.y.toFixed(2)
            last.rotZ = rotZ = rot.z.toFixed(2)
            last.scale = scale = 1

        }

        const tran = REFS.transform.meshGroup.position

        last.tranX = tranX = tran.x
        last.tranY = tranY = tran.y
        last.tranZ = tranZ = tran.z

        REFS.transform.updateUi = (tran = null, rot = null, scale = null) => {

            if(tran !== null){

                last.tranX = tranX = tran.x
                last.tranY = tranY = tran.y
                last.tranZ = tranZ = tran.z

            }

            if(rot !== null){

                last.rotX = rotX = rot.x.toFixed(2)
                last.rotY = rotY = rot.y.toFixed(2)
                last.rotZ = rotZ = rot.z.toFixed(2)

            }

        }

    })

    function changeTranslation(){

        if(!isFinite(tranX) || !isFinite(tranY) || !isFinite(tranZ)){

            tranX = last.tranX
            tranY = last.tranY
            tranZ = last.tranZ

            return

        }

        const clamp = t => {

            t = Math.round(t)

            return t < -500 ? -500 : t > 500 ? 500 : t

        }
        
        tranX = clamp(tranX)
        tranY = clamp(tranY)
        tranZ = clamp(tranZ)
         
        last.tranX = tranX
        last.tranY = tranY
        last.tranZ = tranZ

        addEvent( [ REFS.transform.updateTranslateFromUi(tranX, tranY, tranZ) ], $MODE)

    }

    function changeRotation(){

        if(!isFinite(rotX) || !isFinite(rotY) || !isFinite(rotZ)){

            rotX = last.rotX
            rotY = last.rotY
            rotZ = last.rotZ

            return

        }

        const clamp = a => {

            a = parseFloat(a) * Math.PI / 180
            
            a = ( (a + Math.PI) % (2 * Math.PI) ) - Math.PI;

            if (a < -Math.PI) 

                a += 2 * Math.PI
            
            return a
            
        }

        //in rad
        rotX = clamp(rotX)
        rotY = clamp(rotY)
        rotZ = clamp(rotZ)

        addEvent( [ REFS.transform.updateRotateFromUi(rotX, rotY, rotZ) ], $MODE )

        //convert to deg then string
        last.rotX = rotX = (rotX * 180 / Math.PI).toFixed(2)
        last.rotY = rotY = (rotY * 180 / Math.PI).toFixed(2)
        last.rotZ = rotZ = (rotZ * 180 / Math.PI).toFixed(2)

    }

    function changeScale(){

        if(!isFinite(scale)){

            scale = last.scale
            return

        }

        scale = scale < 0 ? 0 : scale > 10 ? 10 : scale

        addEvent( [ REFS.transform.updateScaleFromUi(scale) ], $MODE )

        last.scale = scale.toFixed(2)

    }

    function paste(){

        const evn = REFS.transform.paste()

        if(evn !== null)

            addEvent([ evn ], $MODE)

    }

    function rotate90(axis){

        let vect, rad

        switch(axis){

            case "x":

                vect = new Vector3(1,0,0)
                rad = Math.PI / 2
                break

            case "-x":

                vect = new Vector3(1,0,0)
                rad = -Math.PI / 2
                break

            case "y":

                vect = new Vector3(0,1,0)
                rad = Math.PI / 2
                break

            case "-y":

                vect = new Vector3(0,1,0)
                rad = -Math.PI / 2
                
        }

        const evn = REFS.transform.rotateRad(vect, rad)

        addEvent([ evn ], $MODE)

    }

    function snapToGrid(){

        const evn = REFS.transform.snapToGrid()

        if(evn !== null)

            addEvent([ evn ], $MODE)

    }

    function snapToTop(){

        const evn = REFS.transform.snapToTop()

        if(evn !== null)

            addEvent([ evn ], $MODE)

    }

    async function convert(){

        addEvent( [ await REFS.transform.convert() ], $MODE, "transform-glb-object" )

        $MODE = "transform-glb-object"

    }

    function back(){

        addEvent( [ REFS.transform.back() ], $MODE, "transform-glb" )

        $MODE = "transform-glb"

    }

    function confirm( cancel = false ){

        const evns = [new EndTransformable(REFS.transform)]

        const pasteEvn = REFS.transform.paste(cancel)

        if(pasteEvn !== null)

            evns.push(pasteEvn)

        addEvent(evns, $MODE, "place")

        REFS.transform.removeFromScene()
        REFS.transform = null

        $MODE = "place"

    }

    function cancel(){

        addEvent( [ new EndTransformable( REFS.transform ) ], $MODE, "place" ) 

        REFS.transform.removeFromScene()
        REFS.transform = null

        $MODE = "place"

    }

</script>


<div transition:fly={{x: 300, duration: 150}} class="absolute space-y-2 transition-all select-none right-2 panel-container bottom-2">
    <div class="text-sm font-semibold">Transform</div>
    <div class="container">
        <div class="my-auto text-xs">Translate X</div>
        <input tabindex="-1" class="transform-input panel-number-input" bind:value={tranX} on:change={changeTranslation} type="number" name="translate"> 
    </div>
    <div class="container">
        <div class="my-auto text-xs">Translate Y</div>
        <input tabindex="-1" class="transform-input panel-number-input" bind:value={tranY} on:change={changeTranslation} type="number" name="translate"> 
    </div>
    <div class="container">
        <div class="my-auto text-xs">Translate Z</div>
        <input tabindex="-1" class="transform-input panel-number-input" bind:value={tranZ} on:change={changeTranslation} type="number" name="translate"> 
    </div>
    <div class="divider"></div>
    {#if $MODE === "transform-glb"}
        <div class="container">
            <div class="my-auto text-xs">Rotate X</div>
            <input tabindex="-1" class="transform-input panel-number-input" bind:value={rotX} on:change={changeRotation} type="number" name="rotate"> 
        </div>
        <div class="container">
            <div class="my-auto text-xs">Rotate Y</div>
            <input tabindex="-1" class="transform-input panel-number-input" bind:value={rotY} on:change={changeRotation} type="number" name="rotate"> 
        </div>
        <div class="container">
            <div class="my-auto text-xs">Rotate Z</div>
            <input tabindex="-1" class="transform-input panel-number-input" bind:value={rotZ} on:change={changeRotation} type="number" name="rotate"> 
        </div>
        <div class="divider"></div>
        <div class="container">
            <div class="my-auto text-xs">Scale</div>
            <input tabindex="-1" class="transform-input panel-number-input" step="0.05" min="0.05" bind:value={scale} on:change={changeScale} type="number" name="scale"> 
        </div>
        <div class="divider"></div>
    {:else}
        <div class="flex gap-1 justify-evenly">
            <Tool on:click={() => rotate90("x")} tipPosition="top" tipHeader="Rotate X +90°">
                <img src="/rotatePositiveX.svg" alt="rotate +x" slot="icon">
            </Tool>
            <Tool on:click={() => rotate90("-x")} tipPosition="top" tipHeader="Rotate X -90°">
                <img src="/rotateNegativeX.svg" alt="rotate -x" slot="icon">
            </Tool>
            <Tool on:click={() => rotate90("y")} tipPosition="top" tipHeader="Rotate X +90°">
                <img src="/rotatePositiveY.svg" alt="rotate +y" slot="icon">
            </Tool>
            <Tool on:click={() => rotate90("-y")} tipPosition="top" tipHeader="Rotate Y -90°">
                <img src="/rotateNegativeY.svg" alt="rotate -y" slot="icon">
            </Tool>
            <Tool on:click={paste} tipPosition="top" tipHeader="Paste">
                <img src="/paste.svg" alt="paste" slot="icon">
            </Tool>
            <Tool on:click={snapToGrid} tipPosition="top" tipHeader="Snap to grid">
                <img src="/snapToGrid.svg" alt="snap to grid" slot="icon">
            </Tool>
            <Tool on:click={snapToTop} tipPosition="top" tipHeader="Snap to top">
                <img src="/snapToTop.svg" alt="snap to top" slot="icon">
            </Tool>
        </div>
    {/if}
    {#if $CONVERTING}
        <div>
            <div class="text-sm font-semibold">Converting...</div>
            <div class="text-xs">{$FACES_CONVERTED.toLocaleString()} of {$TOTAL_CONVERT.toLocaleString()} faces proccesed</div>
        </div>
        <div class="absolute bottom-0 left-0 w-full h-4 overflow-hidden rounded-xl">
            <div class="absolute bottom-0 left-0 w-full h-1 -translate-x-full bg-blue-600" style="left: {Math.floor(($FACES_CONVERTED / $TOTAL_CONVERT) * 100)}%"></div>
        </div>
    {:else}
        <div class="flex gap-2">
            {#if $MODE === "transform-glb"}
                <button tabindex="-1" class="editor-btn" on:click={convert}>Convert</button>
                <button tabindex="-1" class="editor-btn" on:click={cancel}>Cancel</button>
            {:else if $MODE === "transform-glb-object"}
                <button tabindex="-1" class="editor-btn" on:click={() => confirm()}>Confirm</button>
                <button tabindex="-1" class="editor-btn" on:click={back}>Back</button>
            {:else if $MODE === "transform-object"}
                <button tabindex="-1" class="editor-btn" on:click={() => confirm()}>Confirm</button>
                <button tabindex="-1" class="editor-btn" on:click={() => confirm(true)}>Cancel</button>
            {:else if $MODE === "transform-imported-object"}
                <button tabindex="-1" class="editor-btn" on:click={() => confirm()}>Confirm</button>
                <button tabindex="-1" class="editor-btn" on:click={cancel}>Cancel</button>
            {/if}
        </div>
    {/if}
</div>


<style lang="postcss">

    .container {

        @apply flex w-64 flex-row justify-between items-stretch flex-grow-0;

    }

</style>
