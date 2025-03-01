
<script>

    import { onMount } from "svelte"
    import { verifyBuild, encodePlotData, pushNotification } from "$lib/common/utils"
    import { preprocessPNG } from "$lib/common/buildImage"
    import { MAX_BUILD_SIZES, NAME_FIELD_MAXLEN, DESC_FIELD_MAXLEN, LINK_FIELD_MAXLEN, LINK_LABEL_FIELD_MAXLEN, MIN_SMP, MAX_SMP } from "$lib/common/constants"
    import { notification, loadScreenOpacity } from "$lib/main/store.js"
    import MyPlot from "$lib/main/plot/myPlot.js"
    import PlotWidgetOption from "$lib/main/components/myPlots/plotWidgetOption.svelte"
    import WalletConnection from "$lib/main/walletConnection"
    import Tip from "$lib/common/components/tip.svelte"
    import isURL from "validator/lib/isURL"
    
    export let editingPlot

    let buildInput
    let depth = 0
    let id, imgUrl, name = "", desc = "", link = "", linkLabel = "", buildData = null
    let changed = false, validUrl, urlErrorMsg = ""

    onMount( async () => {

        $loadScreenOpacity = 50
        editingPlot.isNew = false
        id = editingPlot.id.string()
        depth = editingPlot.id.depth()
        name = editingPlot.name
        desc = editingPlot.desc
        link = editingPlot.link
        linkLabel = editingPlot.linkLabel
        buildData = editingPlot.buildData
        imgUrl = await editingPlot.getImgUrl()

        $loadScreenOpacity = 0

    })

    function loadFromEditor(){

        let data = localStorage.getItem("editorSave")
        let u16Arr
        
        if (data) {

            data = data.split(",").map(x => parseInt(x))
            u16Arr = new Uint16Array(data)
        
        } else 

            u16Arr = new Uint16Array([0,32])

        setBuild(u16Arr)

    }

    function changeBuild(){

        const file = buildInput.files[0]
        const fr = new FileReader()

        fr.onload = async res => setBuild(new Uint16Array(res.target.result))
        fr.readAsArrayBuffer(file)

        buildInput.value = ''

    }

    async function setBuild(_buildData){

        try {

            if(!verifyBuild(_buildData)){

                pushNotification(notification, "Invalid Build", "Build data could not be validated.")
                return

            }

            console.log(isSameBuild(buildData, _buildData))

            if(isSameBuild(buildData, _buildData))

                return

            const maxbs = MAX_BUILD_SIZES[editingPlot.id.depth()]
            const bs = _buildData[1]

            if( bs < 6 ){

                pushNotification(notification, "Invalid Build Size", `Build size must be greater than ${maxbs}x${maxbs}x${maxbs}.`)
                return

            }

            if( bs > maxbs ){

                pushNotification(notification, "Invalid Build Size", `Build size exceeds the maximum for this plot (${maxbs}x${maxbs}x${maxbs}).`)
                return
                
            }

            imgUrl = await MyPlot.imgUrl(_buildData)
            buildData = _buildData

        } catch(e) {

            pushNotification(notification, "Error Uploading Build", "An unknown error occured.")

        }

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

    $:{

        changed = name !== editingPlot.name || desc !== editingPlot.desc || link !== editingPlot.link || linkLabel !== editingPlot.linkLabel || buildData !== editingPlot.buildData
        urlErrorMsg = ""
        validUrl = true

        if(link != ""){

            if (!isURL(link)){

                urlErrorMsg = "*Invalid url"
                validUrl = false

            }
            
            if (link.length > LINK_FIELD_MAXLEN) {

                urlErrorMsg = `*Url cannot exceed ${LINK_FIELD_MAXLEN} characters.`
                validUrl = false

            }

        }

    }

    async function save(){

        try {
            
            $loadScreenOpacity = 50
            
            const message = "Your signature is used to verify your ownership of the plot you are trying to update. This allows us to authenticate you without saving any sensitive information."
            const signature = await WalletConnection.getSignature(message)

            const form = new FormData()
            form.append("plotId", editingPlot.id.string())
            form.append("message", message)
            form.append("signature", signature)
            form.append("name", name)
            form.append("desc", desc)
            form.append("link", link)
            form.append("linkLabel", linkLabel)
            form.append("buildData", new Blob([buildData]))

            // if(buildData !== editingPlot.buildData){

            const p = preprocessPNG(await MyPlot.getMesh(buildData))
            form.append("buildImageData", new Blob([p]))

            // }
            
            //update
            const res = await fetch("http://localhost:8080/update-plot", { 
                method: "POST",
                body: form
            })

            if(!res.ok)

                throw new Error("Api error")
                
            editingPlot.name = name
            editingPlot.desc = desc
            editingPlot.link = link
            editingPlot.linkLabel = linkLabel
            editingPlot.buildData = buildData
            editingPlot.imgUrl = imgUrl

            editingPlot = null

            pushNotification(notification, "Plot updated", "Updates may take some time to appear. Check back later!")

        } catch(e) {

            console.log(e)

            pushNotification(notification, "Something went wrong..", `Plot ${id} could not be updated.`)
            
        }

        $loadScreenOpacity = 0

    }


</script>


<input bind:this={buildInput} on:input={changeBuild} type="file" class="hidden">
<div class="w-full h-full overflow-x-hidden overflow-y-scroll hide-scrollbar">
    <div class="flex flex-row flex-wrap justify-center gap-3 px-1 py-3">
        <div class="relative flex-none overflow-hidden w-60 h-80 rounded-2xl outline-1 outline outline-zinc-800 bg-zinc-900 group">
            <img class="object-cover h-full" src={imgUrl} alt="build"/> 
            <div class="absolute bottom-0 flex flex-col w-full gap-0.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <PlotWidgetOption on:click={loadFromEditor} src="/floppy.svg" alt="load" text="Load from editor"/>
                <PlotWidgetOption on:click={() => buildInput.click()} src="/upload.svg" alt="upload" text="Upload build file"/>
                <PlotWidgetOption on:click={download} src="/download.svg" alt="download" text="Download"/>
            </div>
        </div>
        <div class="flex flex-col justify-between grow h-80">
            <div>
                <h2 class="text-sm">Name</h2>
                <input bind:value={name} class="w-full outline-zinc-800" type="text" maxlength={NAME_FIELD_MAXLEN} placeholder="Name">
            </div>
            <div>
                <h2 class="text-sm">Description</h2>
                <textarea bind:value={desc} class="w-full hide-scrollbar outline-zinc-800" rows="3" maxlength={DESC_FIELD_MAXLEN} placeholder="Description"></textarea>
            </div>
            <div>
                <div class="flex items-center gap-2">
                    <h2 class="inline text-sm">Link</h2>
                    <div class="text-xs text-red-500">{urlErrorMsg}</div>
                </div>
                <input bind:value={link} class="w-full {validUrl ? "outline-zinc-800" : "outline-red-500"}" type="text" maxlength={LINK_FIELD_MAXLEN + 1} placeholder="url">
            </div>
            <div>
                <div class="flex items-center gap-1">
                    <h2 class="inline text-sm">Link label</h2>
                    <Tip class="bottom-0 left-0 translate-x-4" text="Display your link to users as custom text instead of a url."/> 
                </div>
                <input bind:value={linkLabel} class="w-full outline-zinc-800" type="text" maxlength={LINK_LABEL_FIELD_MAXLEN} placeholder="ex. My website">
            </div>
            <button on:click={save} class="mt-1 button0 { changed && validUrl ? "pointer-events-auto" : "pointer-events-none opacity-50" }">Save</button>
        </div>
    </div>
</div>

<style lang="postcss">

    h2 {

        @apply text-sm font-semibold;

    }

    input, textarea {

        @apply align-top p-1 resize-none m-0 mt-1 text-sm rounded-lg outline outline-1 bg-zinc-900 transition-colors focus:bg-zinc-800;

    }

</style>