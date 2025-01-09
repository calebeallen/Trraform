
<script>
    
	import { GRID_SIZING, NEW_BUILD_MODAL, NOTIFICATION, REFS } from "../../store";
	import { verifyBuild, pushNotification } from "@packages/global/functions";
    import { PlusSVG, UploadSVG } from "@packages/ui";
    import Modal from "./modal.svelte";

    let importInput

    function newBuild(){

        $NEW_BUILD_MODAL = false
        setTimeout( () => $GRID_SIZING = true, 1)

    }

    function importFile(){

        const file = importInput.files[0]

        if(file){

            const fr = new FileReader()

            fr.onload = res => {

                try{
                    
                    //verify data first
                    const dat = new Uint16Array(res.target.result)

                    if(!verifyBuild(dat))

                        throw null

                    REFS.newBuild(dat)
                    $NEW_BUILD_MODAL = false
                    
                } catch {

                    pushNotification(NOTIFICATION, "Import Failed", `Could not import ${file.name}.`)

                }

            }

            fr.readAsArrayBuffer(file)

        }

        importInput.value = ''

    }

</script>

<input bind:this={importInput} on:change={importFile} type="file" class="hidden">
<Modal header="New Build" addedClasses="max-w-xs" on:close={() => $NEW_BUILD_MODAL = false}>
    <p class="text-sm">You cannot undo this, be sure to download your current build.</p>
    <div class="flex w-full gap-4 mt-3">
        <button on:click={newBuild} class="option group">
            <div class="option-svg">
                <PlusSVG/>
            </div>
            <span class="option-text">New</span>
        </button>
        <button on:click={() => importInput.click()} class="option group">
            <div class="option-svg">
                <UploadSVG/>
            </div>
            <span class="option-text">Import File</span>
        </button>
    </div>
</Modal>

<style lang="postcss">

    .option{

        @apply relative w-full aspect-square transition-colors bg-black bg-opacity-0 rounded-lg outline outline-1 outline-zinc-700 hover:bg-opacity-10;

    }

    .option-svg{

        @apply absolute w-8 h-8 transition-transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 group-hover:-translate-y-[80%];

    }

    .option-text{

        @apply absolute text-sm font-semibold transition-opacity -translate-x-1/2 opacity-0 translate-y-1/3 group-hover:opacity-100 top-1/2 left-1/2 w-max;

    }

</style>