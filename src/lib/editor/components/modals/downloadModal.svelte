
<script>
    
	import { DOWNLOAD_MODAL, REFS, PLOTS_PLACED } from "$lib/editor/store";
    import { condense } from "$lib/common/utils"
    import Modal from "$lib/common/components/modal.svelte"
    import { onMount } from "svelte";

    let name = ""
    let showWarning = false

    onMount(() => {

        for(const placed of $PLOTS_PLACED)
            if(!placed){
                showWarning = true
                return
            }

    })

    function download(){

        const blob = new Blob([ condense(REFS.build.blocks.map(x => x[0]), REFS.buildSize) ])
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")

        a.href = url
        a.download = `${ name === "" ? "New Build" : name.trim()}.trra`

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setTimeout( () => $DOWNLOAD_MODAL = false, 200 )

    }

</script>

<Modal class="max-w-xs" header="Download Build" on:close={() => $DOWNLOAD_MODAL = false}>
    <div>
        {#if showWarning}
        <div class="text-xs text-yellow-300">One or more subplots have not been placed. If this build is uploaded to a depth 0 or 1 plot, unplaced subplots will be placed randomly.</div>
        {/if}
        <div class="flex items-end mt-2">
            <img class="w-6 h-6 opacity-50" src="/pencil.svg" alt="pencil">
            <input bind:value={name} type="text" placeholder="Name" class="flex-1 m-0 mr-2 text-sm transition-colors bg-transparent border-b border-transparent focus:outline-none hover:border-zinc-700 focus:border-zinc-700">
        </div>
        <div class="flex w-full mt-2">
            <button on:click={download} class="relative w-full h-20 transition-colors bg-black bg-opacity-0 rounded-lg outline outline-1 outline-zinc-700 group hover:bg-opacity-10">
                <img class="absolute w-8 h-8 transition-transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 group-hover:-translate-y-[80%]" src="/download.svg" alt="download">
                <span class="absolute text-sm font-semibold transition-opacity -translate-x-1/2 opacity-0 translate-y-1/3 group-hover:opacity-100 top-1/2 left-1/2 w-max">Download</span>
            </button>  
        </div>
    </div>
</Modal>


