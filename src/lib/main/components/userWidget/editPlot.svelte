
<script>

    import { onMount } from "svelte";
    import { BUILD_SIZE_STD, BUILD_SIZE_LARGE, API_ORIGIN } from "$lib/common/constants"
    import isURL from "validator/lib/isURL";
    import { user, loadScreenOpacity, notification } from "$lib/main/store"
    import { fade } from "svelte/transition";
    import MyPlot from "$lib/main/plot/myPlot"
    import { pushNotification } from "$lib/common/utils"
    import { preprocessPNG } from "$lib/common/buildImage"

    const NAME_MAX_LENGTH = 48
    const DESC_MAX_LENGTH = 128
    const LINK_MAX_LENGTH = 256
    const LINK_TITLE_MAX_LENGTH = 64

    export let editingPlot
    let name = ""
    let desc = ""
    let link = ""
    let linkTitle = ""
    let imgUrl = ""
    let buildData = null
    let changed = false

    let buildInput
    let buildErrorTimeout = null

    let buildError = ""
    let linkError = ""
    let saveError = ""

    onMount(async () => {

        await editingPlot.load()
        editingPlot.isNew = false

        name = editingPlot.name
        desc = editingPlot.desc
        link = editingPlot.link
        linkTitle = editingPlot.linkTitle
        buildData = editingPlot.buildData
        imgUrl = await editingPlot.getImgUrl()
        
    })

    function loadFromEditor(){

        let data = localStorage.getItem("editor_save")
        let _buildData

        if (data) {
            data = data.split(",").map(x => parseInt(x))
            _buildData = new Uint16Array(data)
        } else 
            _buildData = new Uint16Array([0,6])

        setBuild(_buildData)

    }

    

    function changeBuild(){

        const file = buildInput.files[0]
        const fr = new FileReader()

        fr.onload = async res => setBuild(new Uint16Array(res.target.result))
        fr.readAsArrayBuffer(file)

        buildInput.value = ''

    }


    async function setBuild(_buildData){

        const bs = _buildData[1]

        if(!$user.subActive && bs > BUILD_SIZE_STD){
            showBuildError(`Build exceeds maximum size (${BUILD_SIZE_STD}x${BUILD_SIZE_STD}x${BUILD_SIZE_STD}).`)
            return
        }

        if(bs > BUILD_SIZE_LARGE){
            showBuildError(`Build exceeds maximum size (${BUILD_SIZE_LARGE}x${BUILD_SIZE_LARGE}x${BUILD_SIZE_LARGE}).`)
            return
        }

        imgUrl = _buildData.length == 2 ? "/default.png" : await MyPlot.imgUrl(_buildData)
        buildData = _buildData

    }

    function showBuildError(text){

        clearTimeout(buildErrorTimeout)
        buildErrorTimeout = setTimeout(() => buildError = "", 3000)
        buildError = text

    }

    function isSameBuild(b1, b2){

        if(!(b1 instanceof Uint16Array) || !(b2 instanceof Uint16Array) || b1.length !== b2.length)
            return false

        for(let i = 0; i < b1.length; i++)
            if(b1[i] !== b2[i])
                return false

        return true

    }

    function download(){

        if(!buildData)
            return

        const blob = new Blob([buildData])
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")

        a.href = url
        a.download = `${ name || id }.trra`

        document.body.appendChild(a)

        a.click()

        document.body.removeChild(a)

        URL.revokeObjectURL(url)

    }

    function b64Encode(typedArr){

        const dv = new DataView(typedArr.buffer)
        const n = dv.byteLength
        let str = ''

        for (let i = 0; i < n; i++) 
            str += String.fromCharCode(dv.getUint8(i))
        
        return btoa(str)

    }

    async function save(){

        linkError = saveError = ""

        if($user.subActive && link != "" && !isURL(link)){
            linkError = "Invalid URL"
            return
        }

        $loadScreenOpacity = 50

        // encode build data
        let imageData = ""
        if(buildData.length > 2){
            const mesh = await MyPlot.getMesh(buildData)
            imageData = b64Encode(preprocessPNG(mesh))
        }

        const plotData = {
            plotId: editingPlot.id.string(),
            name,
            description: desc,
            link,
            linkTitle,
            buildData: b64Encode(buildData),
            imageData
        }

        try{

            const res = await fetch(`${API_ORIGIN}/plot/update`, {
                method: "POST",
                headers: {
                    "Authorization": localStorage.getItem("auth_token"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(plotData)
            })

            if(!res.ok)
                throw new Error()

            pushNotification(notification, "Plot updated", "It will take a few minutes for these updates to show.")

            editingPlot.name = name
            editingPlot.desc = desc
            editingPlot.link = link
            editingPlot.linkTitle = linkTitle
            editingPlot.buildData = buildData
            await editingPlot.updateImgUrl()
            
            editingPlot = null

        } catch {

            pushNotification(notification, "Something went wrong", "Could not update plot, try again later.")

        }

        $loadScreenOpacity = 0

    }   


    $:{

        changed = name !== editingPlot.name || 
        desc !== editingPlot.desc || 
        link !== editingPlot.link || 
        linkTitle !== editingPlot.linkTitle || 
        !isSameBuild(buildData, editingPlot.buildData)

    }

</script>

<input bind:this={buildInput} on:change={changeBuild} class="hidden" type="file">
<div class="w-full mt-3 overflow-y-auto scrollbar-clean shrink">
    <div class="p-px max-w-96">
        <div class="relative aspect-square rounded-2xl outline-1 outline outline-zinc-700 bg-zinc-900">
            <img class="object-cover" src={imgUrl} alt="">
                <button on:click={() => editingPlot = null} class="absolute top-2 left-2 text-sm flex items-center gap-0.5 mr-1 hover:opacity-70 transition-opacity">
                    <img class="w-3.5 sm:w-4 aspect-square" src="/arrowLeft.svg" alt="arrow left">
                    <div>Back</div>
                </button>
            <div class="absolute bottom-0 flex items-center justify-center w-full gap-4 p-2">
                <button on:click={loadFromEditor} class="relative group">
                    <div class="build-option-tag">Load from editor</div>
                    <img class="build-option" src="/floppy.svg" alt="load">
                </button>
                <button on:click={buildInput.click()} class="relative group">
                    <div class="build-option-tag">Upload build file</div>
                    <img class="build-option" src="/upload.svg" alt="upload">
                </button>
                <button on:click={download} class="relative group">
                    <div class="build-option-tag">Download build</div>
                    <img class="build-option" src="/download.svg" alt="download">
                </button>
            </div>
        </div>
        {#if buildError}
            <div out:fade class="mt-1 text-xs text-red-500">{buildError}</div>
        {/if}
        <form on:submit|preventDefault={save} class="mt-4 space-y-4">
            <input bind:value={name} class="w-full std-input" type="text" placeholder="Name" maxlength={NAME_MAX_LENGTH}>
            <textarea bind:value={desc} class="block w-full m-0 leading-none border-none appearance-none resize-none std-input" type="text" placeholder="Description" rows="3" maxlength={DESC_MAX_LENGTH}/>
            {#if $user?.subActive}
                <div>
                    <input bind:value={link} class="w-full std-input" type="text" placeholder="Link" maxlength={LINK_MAX_LENGTH}>
                    {#if linkError}
                        <div class="mt-1 text-xs text-red-500">{linkError}</div>
                    {/if}
                </div>
                <input bind:value={linkTitle} class="w-full std-input" type="text" placeholder="Link title" maxlength={LINK_TITLE_MAX_LENGTH}>
            {/if}
            <div>
                <button type="submit" class="w-full button0 {changed ? "" : "pointer-events-none opacity-70"}">Save</button>
                {#if saveError}
                    <div class="mt-1 text-xs text-red-500">{saveError}</div>
                {/if}
            </div>
        </form>
    </div>
</div>

<style lang="postcss">

    .build-option-tag{
        @apply absolute top-0 -mt-1 text-xs font-semibold -translate-x-1/2 -translate-y-full w-max left-1/2 opacity-0 group-hover:opacity-100 transition-opacity ;
    }

    .build-option{
        @apply w-5 sm:w-6 aspect-square transition-opacity group-hover:opacity-70;
    }

</style>