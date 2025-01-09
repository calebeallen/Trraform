
<script>

    import { InitTransformable, ModifyEvent, TransformEvent, COLOR_SELECT, MODE, OBJECT_SELECT, OVERLAP, REFS, SHOW_BLOCK_PANEL, CONVERTING, addEvent, NEW_BUILD_MODAL, EndTransformable, ConvertEvent, SELECTED, DOWNLOAD_MODAL, NOTIFICATION, COLOR_INDEX } from "$lib/editor/store"
    import { I2P, expand, verifyBuild, pushNotification } from "$lib/common/utils";
    import GLBConverter from "$lib/editor/glb/glbConverter"
    import { TransformableObject, TransformableGlb } from "$lib/editor/transform"
    import { ColorLibrary } from "$lib/common/colorLibrary"
    import Tool from "$lib/editor/components/utils/tool.svelte";
    import ToggleMode from "$lib/editor/components/utils/toggleMode.svelte";
    import Toggle from "$lib/editor/components/utils/toggle.svelte";
	import { fly } from "svelte/transition";
    import { PLOT_COUNT } from "$lib/common/constants"

    let importInput

    let cubeFrontColor, cubeLeftColor, cubeRightColor

    //called when ui buttons clicked
    function beforeModeSwitch(e){

        const { mode } = e.detail

        if($MODE === "select"){

            //initiate transform object
            if( mode === "transform-object" ){

                const indicies = []
                const before = []
                const selected = []

                //loop through build to find selected blocks
                for(let i = 0; i < REFS.build.blocks.length; i++){

                    const block = REFS.build.blocks[i]

                    //if block is selected
                    if(block[1] === 1){

                        //copy block data
                        indicies.push(i)

                        selected.push( [block[0], I2P(i, REFS.buildSize)] )
                        before.push( [block[0], true] )

                        //remove selected block from scene
                        REFS.build.modifyByIndex(i)

                    }

                }

                REFS.transform = new TransformableObject()
                REFS.transform.init(selected).addToScene()

                REFS.build.update()

                addEvent( [ new InitTransformable( REFS.transform ), new ModifyEvent( indicies, before, [[ 0, false ]] ) ], $MODE, mode ) 

            //deselect blocks
            } else {

                const indicies = []
                const before = []
                const after = []
                
                //loop through build to find selected blocks
                for(let i = 0; i < REFS.build.blocks.length; i++){

                    const block = REFS.build.blocks[i]

                    //if block is selected
                    if(block[1] === 1){

                        indicies.push(i)

                        before.push( [block[0], true] )
                        after.push( [block[0], false] )

                        REFS.build.modifyByIndex(i, block[0])

                    }

                }

                REFS.build.update()

                addEvent( [ new ModifyEvent( indicies, before, after ) ], $MODE, mode ) 

            }

        //confirm transform event
        }else if($MODE === "transform-object" || $MODE === "transform-glb-object"){

            const pasteEvent = REFS.transform.paste()

            addEvent( [ new EndTransformable( REFS.transform ), pasteEvent ], $MODE, mode ) 

            REFS.transform.removeFromScene()
            REFS.transform = null

        //cancel transform event
        }else if($MODE === "transform-glb" || $MODE === "transform-imported-object"){

            addEvent( [ new EndTransformable( REFS.transform ) ], $MODE, mode ) 

            REFS.transform.removeFromScene()
            REFS.transform = null

        }

    }

    function importInputChange(){

        const file = importInput.files[0]

        if(file)

            importFile(file)

        importInput.value = ''

    }

    function onDrop(e){

        if(e.dataTransfer.items && !$CONVERTING)

            importFile( [...e.dataTransfer.items][0].getAsFile() )

    }

    async function importFile(file){

        let ext = file.name.split(".")

        ext = ext[ext.length - 1]

        if(ext === "glb"){

            try{

                const converter = new GLBConverter()
                await converter.load(file)

                beforeModeSwitch({ detail : "place" })

                REFS.transform = new TransformableGlb( converter )
                REFS.transform.addToScene()

                addEvent([new InitTransformable(REFS.transform)], $MODE, "transform-glb")

                //prevents ui lag
                setTimeout( () => $MODE = "transform-glb", 1 )

            } catch(e) {

                pushNotification(NOTIFICATION, "Import Failed", `Could not import ${file.name}.`)

            }

        } else {

            const fr = new FileReader()

            fr.onload = res => {

                try {

                    const u16 = new Uint16Array(res.target.result)

                    if(!verifyBuild(u16))

                        throw null

                    
                    beforeModeSwitch({ detail : "place" })
                    
                    const expanded = expand(u16)
                    const buildSize = u16[1]
                    const blocks = []

                    for(let i = 1; i < expanded.length; i++)

                        if(expanded[i] !== 0)

                            blocks.push( [ expanded[i], I2P(i, buildSize) ] )

                    REFS.transform = new TransformableObject()
                    REFS.transform.init(blocks)
                    REFS.transform.addToScene()

                    addEvent( [ new InitTransformable( REFS.transform ) ], $MODE, "transform-imported-object" ) 

                    setTimeout( () => $MODE = "transform-imported-object", 1 )

                } catch {

                    pushNotification(NOTIFICATION, "Import Failed", `Could not import ${file.name}; this file is not supported.`)

                }

            }

            fr.readAsArrayBuffer(file)

        }

    }

    async function undo(){

        if( REFS.eventIndex < 0 || $CONVERTING )

            return

        const events = REFS.eventQueue[REFS.eventIndex].events

        for(let i = 0; i < events.length; i++){

            const event = events[i]

            if(event instanceof ModifyEvent){

                for(let j = 0; j < event.indicies.length; j++){

                    const blk = event.before.length === 1 ? event.before[0] : event.before[j]

                    REFS.build.modifyByIndex(event.indicies[j], blk[0], blk[1])

                }

                REFS.build.update()

            } else if (event instanceof InitTransformable){

                REFS.transform.removeFromScene()
                REFS.transform = null

            } else if (event instanceof TransformEvent){

                let dP = null, dQ = null, dS = null

                if(event.dP !== null)

                    dP = event.dP.clone().multiplyScalar(-1)

                if(event.dQ !== null)

                    dQ = event.dQ.clone().invert()

                if(event.dS !== null)

                    dS = 1 / event.dS

                REFS.transform.applyTransformation( dP, dQ, dS )

            } else if (event instanceof EndTransformable){

                REFS.transform = event.transformable
                REFS.transform.addToScene()

            } else if (event instanceof ConvertEvent){

                if(event.dir === "forwards")

                    REFS.transform.back()

                else if(event.dir === "backwards")

                    await REFS.transform.convert()

            }

        }

        $MODE = REFS.eventQueue[REFS.eventIndex].modeBefore

        REFS.eventIndex --

    }

    async function redo(){

        if( REFS.eventIndex >= REFS.eventQueue.length - 1 || $CONVERTING )

            return

        REFS.eventIndex++

        const events = REFS.eventQueue[REFS.eventIndex].events

        for(let i = 0; i < events.length; i++){

            const event = events[i]

            if(event instanceof ModifyEvent){

                for(let j = 0; j < event.indicies.length; j++){

                    const blk = event.after.length === 1 ? event.after[0] : event.after[j]

                    REFS.build.modifyByIndex(event.indicies[j], blk[0], blk[1])

                }

                REFS.build.update()

            } else if (event instanceof InitTransformable){

                REFS.transform = event.transformable
                REFS.transform.addToScene()

            } else if (event instanceof TransformEvent)

                REFS.transform.applyTransformation(event.dP, event.dQ, event.dS)

            else if (event instanceof EndTransformable){

                REFS.transform.removeFromScene()
                REFS.transform = null

            } else if (event instanceof ConvertEvent){

                if(event.dir === "forwards")

                    await REFS.transform.convert()

                else if(event.dir === "backwards")

                    REFS.transform.back()

            }

        }

        $MODE = REFS.eventQueue[REFS.eventIndex].modeAfter

    }

    function keydown(e){

        const key = e.key.toLowerCase()

        if(key === "z"){

            e.preventDefault()

            if((e.ctrlKey || e.metaKey) && e.shiftKey)

                redo()

            else if(e.ctrlKey || e.metaKey)

                undo()

        }

    }

    $:if($COLOR_INDEX > PLOT_COUNT){

        cubeFrontColor = ColorLibrary.applyLightStr($COLOR_INDEX, 0)
        cubeLeftColor = ColorLibrary.applyLightStr($COLOR_INDEX, 1)
        cubeRightColor = ColorLibrary.applyLightStr($COLOR_INDEX, 2)

    }

</script>

<svelte:window

    on:dragover|preventDefault
    on:drop|preventDefault={ onDrop }
    on:keydown={keydown}

/>

<input bind:this={importInput} on:change={importInputChange} type="file" class="hidden">
<div transition:fly={{x: -50, duration: 200}} class="fixed p-1 space-y-1 -translate-y-1/2 left-2 top-1/2 panel-container {$CONVERTING ? "pointer-events-none" : ""}">
    <Tool on:click={() => $NEW_BUILD_MODAL = true} tipHeader="New Build">
        <img src="/plus.svg" alt="plus" slot="icon">
    </Tool>
    <Tool on:click={() => $DOWNLOAD_MODAL = true} tipHeader="Download">
        <img src="/download.svg" alt="download" slot="icon">
    </Tool>
    <Tool on:click={() => importInput.click()} tipHeader="Import">
        <img src="/upload.svg" alt="upload" slot="icon">
        <div class="mt-1 space-y-1" slot="tipContent">
            <div class="text-xs">Import .trra or .glb files.</div>
            <div class="text-xs"><b>3D Model Converter (Beta):</b> Convert GLB format models to blocks and add them to your build.</div>
        </div>
    </Tool>
    <div class="divider"></div>
    <Tool on:click={undo} tipHeader="Undo">
        <img src="/undo.svg" alt="undo" slot="icon">
    </Tool>
    <Tool on:click={redo} tipHeader="Redo">
        <img src="/redo.svg" alt="redo" slot="icon">
    </Tool>
    <div class="divider"></div>
    <ToggleMode on:toggle={beforeModeSwitch} disableIfModes={["edit"]} selectIfModes={["delete"]} mode="delete" tipHeader="Delete" tipImageSrc="/delete.gif">
        <img src="/delete.svg" alt="delete" slot="icon">
        <div class="my-1 space-y-1" slot="tipContent">
            <div class="text-xs"><b>With Color Select:</b> Deletes blocks of the same color.</div>
            <div class="text-xs"><b>With Object Select:</b> Deletes all connected blocks.</div>
        </div>
    </ToggleMode>
    <ToggleMode on:toggle={beforeModeSwitch} disableIfModes={["edit"]} selectIfModes={["paint"]} mode="paint" tipHeader="Paint" tipImageSrc="/paint.gif">
        <img src="/paint.svg" alt="paint" slot="icon">
        <div class="my-1 space-y-1" slot="tipContent">
            <div class="text-xs"><b>With Color Select:</b> Paints blocks of the same color.</div>
            <div class="text-xs"><b>With Object Select:</b> Paints all connected blocks.</div>
        </div>
    </ToggleMode>
    <ToggleMode on:toggle={beforeModeSwitch} disableIfModes={["edit"]} selectIfModes={["select"]} mode="select" tipHeader="Select" tipImageSrc="/select.gif">
        <img src="/select.svg" alt="select" slot="icon">
        <div class="my-1 space-y-1" slot="tipContent">
            <div class="text-xs">Select blocks to transform.</div>
            <div class="text-xs"><b>With Color Select:</b> Selects blocks of the same color.</div>
            <div class="text-xs"><b>With Object Select:</b> Selects all connected blocks.</div>
        </div>
    </ToggleMode>
    <ToggleMode on:toggle={beforeModeSwitch} bind:overrideDisabled={$SELECTED} disableIfModes={['place', 'paint', 'delete',"select"]} selectIfModes={["transform-object", "transform-glb", "transform-glb-object", "transform-imported-object"]} mode="transform-object" tipHeader="Transform" tipImageSrc="/transform.gif">
        <img src="/transform.svg" alt="transform" slot="icon">
        <div class="my-1 space-y-1" slot="tipContent">
            <div class="text-xs">Transform selected blocks.</div>
            <div class="text-xs"><b>With Overlap:</b> Transformed blocks will override existing blocks.</div>
        </div>
    </ToggleMode>
    <div class="divider"></div>
    <Toggle on:toggle={e => $OVERLAP = e.detail} tipHeader="Overlap">
        <img src="/overlap.svg" alt="overlap" slot="icon">
    </Toggle>
    <Toggle on:toggle={e => $COLOR_SELECT = e.detail} tipHeader="Color Select">
        <img src="/colorPalette.svg" alt="color palette" slot="icon">
    </Toggle>
    <Toggle on:toggle={e => $OBJECT_SELECT = e.detail} tipHeader="Object Select">
        <img src="/object.svg" alt="paint" slot="icon">
    </Toggle>
    <div class="divider"></div>
    <Toggle on:toggle={e => $SHOW_BLOCK_PANEL = e.detail}>
        <div slot="icon">
            {#if $COLOR_INDEX <= PLOT_COUNT}
                <img src="/plot.svg" alt="plot">
            {:else}
                <div class="translate-x-1">
                    <div class="cube">
                        <div class="front" style="background-color: {cubeFrontColor};"></div>
                        <div class="right" style="background-color: {cubeRightColor};"></div>
                        <div class="top" style="background-color: {cubeLeftColor};"></div>
                    </div>
                </div>
            {/if}
        </div>
    </Toggle>
</div>

<style>

    :root {
        --cube-size: 12px;
    }

    .cube {
        position: relative;
        width: var(--cube-size);
        height: var(--cube-size);
        transform-style: preserve-3d;
        transform: rotateX(30deg) rotateY(45deg);
    }

    .cube div {
        position: absolute;
        width: var(--cube-size);
        height: var(--cube-size);
    }

    .front {
        transform: translateZ(calc(var(--cube-size) / -2));
    }

    .right {
        transform: rotateY(90deg) translateZ(calc(var(--cube-size) / 2));
    }

    .top {
        transform: rotateX(90deg) translateZ(calc(var(--cube-size) / 2));
    }

</style>