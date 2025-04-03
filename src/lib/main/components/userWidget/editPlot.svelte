
<script>
    import isURL from "validator/lib/isURL";

    export let editingPlot
    let name = ""
    let desc = ""
    let link = ""
    let linkTitle = ""
    let linkError = ""
    let saveError = ""

    function save(){

        linkError = saveError = ""

        if(!isURL(link)){
            linkError = "Invalid URL"
            return
        }

    }

</script>

<div class="p-px max-w-96">
    <div class="relative aspect-square rounded-2xl outline-1 outline outline-zinc-700 bg-zinc-900">
        <img src="/default.png" alt="">
        <div class="absolute top-0 left-0 flex items-baseline justify-between w-full p-2 text-xs sm:text-sm">
            <div>
                <div>id: 0x3242</div>
                <div>depth: 2</div>
                <div>build size: 40</div>
            </div>
            <button on:click={() => editingPlot = null} class="flex items-center gap-0.5 mr-1 hover:border-b">
                <img class="w-3.5 sm:w-4 aspect-square" src="/arrowLeft.svg" alt="arrow left">
                <div>Back</div>
            </button>
        </div>
        <div class="absolute bottom-0 flex items-center justify-center w-full gap-4 p-2">
            <button class="relative group">
                <div class="build-option-tag">Load from editor</div>
                <img class="build-option" src="/floppy.svg" alt="load">
            </button>
            <button class="relative group">
                <div class="build-option-tag">Upload build file</div>
                <img class="build-option" src="/upload.svg" alt="upload">
            </button>
            <button class="relative group">
                <div class="build-option-tag">Download build</div>
                <img class="build-option" src="/download.svg" alt="download">
            </button>
        </div>
    </div>
    <form on:submit={save} class="mt-4 space-y-4">
        <input bind:value={name} class="w-full std-input" type="text" placeholder="Name">
        <textarea bind:value={desc} class="block w-full m-0 leading-none border-none appearance-none std-input" type="text" placeholder="Description" rows="3"/>
        <div>
            <input bind:value={link} class="w-full std-input" type="text" placeholder="Link">
            {#if linkError}
                <div class="mt-1 text-xs text-red-500">{linkError}</div>
            {/if}
        </div>
        <input bind:value={linkTitle} class="w-full std-input" type="text" placeholder="Link title">
        <div>
            <button type="submit" class="w-full button0">Save</button>
            {#if saveError}
                <div class="mt-1 text-xs text-red-500">{saveError}</div>
            {/if}
        </div>
    </form>
</div>

<style lang="postcss">

    .build-option-tag{
        @apply absolute top-0 -mt-1 text-xs font-semibold -translate-x-1/2 -translate-y-full w-max left-1/2 opacity-0 group-hover:opacity-100 transition-opacity ;
    }

    .build-option{
        @apply w-5 sm:w-6 aspect-square;
    }

</style>