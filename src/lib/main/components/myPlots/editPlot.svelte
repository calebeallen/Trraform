
<script>

    import { onMount } from "svelte"
    import { verifyBuild, encodePlotData, pushNotification } from "$lib/common/utils"
    import { preprocessPNG } from "$lib/common/buildImage"
    import { MAX_BUILD_SIZES, NAME_FIELD_MAXLEN, DESC_FIELD_MAXLEN, LINK_FIELD_MAXLEN, LINK_LABEL_FIELD_MAXLEN, MIN_SMP, MAX_SMP } from "$lib/common/constants"
    import { notification } from "$lib/main/store.js"
    import MyPlot from "$lib/main/plot/myPlot.js"
    import PlotWidgetOption from "$lib/main/components/myPlots/plotWidgetOption.svelte"
    import WalletConnection from "$lib/main/walletConnection"
    import Tip from "$lib/common/components/tip.svelte"
    import isURL from "validator/lib/isURL"
    import { formatEther } from "viem"
    import { MAX_DEPTH } from "../../../common/constants";
    
    export let editingPlot
    export let load

    let buildInput
    let depth = 0
    let id, imgUrl, name = "", desc = "", link = "", linkLabel = "", origSmp, smp = 0, buildData = null
    let errors = [], changed = false, smpChanged = false, validUrl, validSmp

    onMount( async () => {

        load = true

        id = editingPlot.id.string()
        depth = editingPlot.id.depth()
        name = editingPlot.name
        desc = editingPlot.desc
        link = editingPlot.link
        linkLabel = editingPlot.linkLabel
        buildData = editingPlot.buildData
        imgUrl = await editingPlot.getImgUrl()

        smp = origSmp = formatEther(await WalletConnection.getSmp(editingPlot.id))

        load = false

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

        smpChanged = smp != origSmp
        changed = name !== editingPlot.name || desc !== editingPlot.desc || link !== editingPlot.link || buildData !== editingPlot.buildData || linkLabel !== editingPlot.linkLabel
        errors = []
        validUrl = validSmp = true

        if(link != ""){

            if (!isURL(link)){

                errors.push("*Invalid url")
                validUrl = false

            }
            
            if (link.length > LINK_FIELD_MAXLEN) {

                errors.push(`*Url cannot exceed ${LINK_FIELD_MAXLEN} characters.`)
                validUrl = false

            }

        }

        if(depth < MAX_DEPTH && origSmp){

            if(smp < MIN_SMP){

                errors.push(`*Subplot mint price must be at least ${MIN_SMP} ETH.`)
                validSmp = false

            } else if (smp > MAX_SMP){

                errors.push(`*Subplot mint price cannot exceed ${MAX_SMP} ETH.`)
                validSmp = false

            }

        }

    }

    function blurSmpInput(){

        if(!smp)

            smp = origSmp


    }

    async function save(){

        try {
            
            load = true

            if(smpChanged){

                await WalletConnection.setSmp(editingPlot.id, smp)
                origSmp = smp
                smpChanged = false

            }

            if(changed){

                const payload = new FormData()
                const encoded = encodePlotData({
                    name, 
                    desc, 
                    link, 
                    linkLabel, 
                    buildData
                })
                payload.append("plotData", new Blob([encoded]))

                if(buildData){

                    const p = preprocessPNG(await MyPlot.getMesh(buildData))
                    payload.append("png", new Blob([p]))

                }

                const message = "Your signature is used to verify your ownership of the plot you are trying to update. This allows us to authenticate you without saving any sensitive information."
                const signature = await WalletConnection.getSignature(message)

                payload.append("signedMessage", new Blob([JSON.stringify({ message, signature })]))
                
                //update
                await fetch(`https://update-plot.trraform.com/${editingPlot.id.string()}`, { 
                    method: "POST",
                    body: payload, 
                })
                    
                editingPlot.name = name
                editingPlot.desc = desc
                editingPlot.link = link
                editingPlot.linkLabel = linkLabel
                editingPlot.buildData = buildData
                editingPlot.imgUrl = imgUrl

            }

            editingPlot = null

            pushNotification(notification, "Plot updated", "Updates may take some time to appear. Check back later!")

        } catch(e) {

            console.log(e)
            pushNotification(notification, "Something went wrong..", `Plot ${id} could not be updated.`)
            
        }

        load = false

    }


</script>


<input bind:this={buildInput} on:input={changeBuild} type="file" class="hidden">
<div class="w-full h-full overflow-x-hidden overflow-y-scroll hide-scrollbar">
    <div class="flex flex-row flex-wrap justify-center gap-3 px-1 py-3">
        <div class="relative flex-none overflow-hidden w-60 h-80 rounded-2xl outline-1 outline outline-zinc-800 bg-zinc-900 group">
            <img src={editingPlot.imgUrl} alt="build"/> 
            <div class="absolute bottom-0 flex flex-col w-full gap-0.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <PlotWidgetOption on:click={loadFromEditor} src="/floppy.svg" alt="load" text="Load from editor"/>
                <PlotWidgetOption on:click={buildInput.click} src="/upload.svg" alt="upload" text="Upload build file"/>
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
                <h2 class="inline text-sm">Link</h2>
                <input bind:value={link} class="w-full {validUrl ? "outline-zinc-800" : "outline-red-500"}" type="text" maxlength={LINK_FIELD_MAXLEN + 1} placeholder="url">
            </div>
            <div class="flex items-baseline gap-3">
                <div class="w-1/2">
                    <div class="flex items-center gap-1">
                        <h2 class="inline text-sm">Link Label</h2>
                        <Tip text="Give your link"/> 
                    </div>
                    <input bind:value={linkLabel} type="text" class="block w-full hide-number-arrows outline-zinc-800" maxlength={LINK_LABEL_FIELD_MAXLEN} placeholder="e.g. My Website">
                </div>
                <div class="w-1/2 {depth < 2 ? "" : "opacity-50 pointer-events-none select-none"}">
                    <div class="items-baseline gap-1">
                        <div class="flex items-center gap-1">
                            <h2 class="inline text-sm">Subplot Mint Price (ETH)</h2>
                            <Tip addedClasses="bottom-0 right-0 -translate-y-4" text="You recieve 70% of the value you set when a subplot is minted. Changing this incurs a gas fee. This value has a maximum precision of 18 decimals."/>
                        </div>
                    </div>
                    <input bind:value={smp} on:blur={blurSmpInput} type="number" class="block w-full hide-number-arrows {validSmp ? "outline-zinc-800" : "outline-red-600"}" maxlength="6" placeholder="Ether">
                </div>
            </div>
            <button on:click={save} class="mt-1 button0 { ( (changed || smpChanged) && validSmp && validUrl ) ? "pointer-events-auto" : "pointer-events-none opacity-50" }">Save</button>
        </div>
        <ul class="w-full text-sm">
            <li class="text-zinc-300">*After updating, make sure to refresh this plot's metadata on any marketplaces where you've listed it.</li>
            {#each errors as error}
                <li class="text-red-500">{error}</li>
            {/each}
        </ul>
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