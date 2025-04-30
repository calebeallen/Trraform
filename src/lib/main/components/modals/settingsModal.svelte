

<script>

    import { refs, settings, defaultSettings, modalsShowing } from "$lib/main/store"
    import Modal from "$lib/common/components/modal.svelte";
    import Slider from "$lib/common/components/slider.svelte";
    import Tip from "$lib/common/components/tip.svelte";
    import { onDestroy, onMount } from "svelte";

    const FOV_MIN = 30, FOV_MAX = 160
    const SENSITIVITY_MIN = 1, SENSITIVITY_MAX = 20
    const TAG_COUNT_MIN = 0, TAG_COUNT_MAX = 25
    const TAG_SIZE_MIN = 1, TAG_SIZE_MAX = 10
    const RENDER_LIMIT_MIN = 150_000, RENDER_LIMIT_MAX = 10_000_000

    let fovValue, sensitivityValue, tagCountValue, tagSizeValue, renderLimitValue
    let fovDisplay, sensitivityDisplay, tagCountDisplay, tagSizeDisplay, renderLimitDisplay

    onMount(() => {

        $modalsShowing++

        fovValue = settings.fov
        sensitivityValue = settings.sensitivity
        tagCountValue = settings.tagCount
        tagSizeValue = settings.tagSize
        renderLimitValue = settings.renderLimit

    })

    onDestroy(() => $modalsShowing--)

    function formatNumber(num) {

        num = parseInt(num)
        if (num < 1000) 
            return num.toString()

        const suffixes = ["", "k", "M", "B", "T"]
        let magnitude = Math.floor(Math.log10(num) / 3)
        let shortValue = (num / Math.pow(10, magnitude * 3)).toFixed(1)
        
        shortValue = shortValue.replace(/\.0$/, "")

        return shortValue + suffixes[magnitude]
        
    }

    function save(){

        settings.fov = refs.camera.fov = parseInt(fovValue)
        settings.sensitivity = parseInt(sensitivityValue)
        settings.tagCount = parseInt(tagCountValue)
        settings.tagSize = parseInt(tagSizeValue)
        settings.renderLimit = parseInt(renderLimitValue)

        refs.camera.updateProjectionMatrix()

        localStorage.setItem("settings_0", JSON.stringify(settings))

    }

    function reset(){

        fovValue = defaultSettings.fov
        sensitivityValue = defaultSettings.sensitivity
        tagCountValue = defaultSettings.tagCount
        tagSizeValue = defaultSettings.tagSize
        renderLimitValue = defaultSettings.renderLimit

    }

    $:{
        fovDisplay = formatNumber(fovValue)
        sensitivityDisplay = formatNumber(sensitivityValue)
        tagCountDisplay = formatNumber(tagCountValue)
        tagSizeDisplay = formatNumber(tagSizeValue)

        if(renderLimitValue == RENDER_LIMIT_MAX)
            renderLimitDisplay = "None"
        else
            renderLimitDisplay = formatNumber(renderLimitValue)

    }

</script>

<Modal class="max-w-lg" header="Settings" on:close>
    <div class="grid grid-cols-[auto_1fr_auto] items-center gap-4 text-xs sm:text-sm mt-4">

        <div>FOV</div>
        <Slider bind:value={fovValue} min={FOV_MIN} max={FOV_MAX}/>
        <div class="text-center w-14">{fovDisplay}</div>

        <div>Sensitivity</div>
        <Slider bind:value={sensitivityValue} min={SENSITIVITY_MIN} max={SENSITIVITY_MAX}/>
        <div class="text-center w-14">{sensitivityDisplay}</div>

        <div>Tag count</div>
        <Slider bind:value={tagCountValue} min={TAG_COUNT_MIN} max={TAG_COUNT_MAX}/>
        <div class="text-center w-14">{tagCountDisplay}</div>

        <div>Tag size</div>
        <Slider bind:value={tagSizeValue} min={TAG_SIZE_MIN} max={TAG_SIZE_MAX}/>
        <div class="text-center w-14">{tagSizeDisplay}</div>

        <div class="flex items-center gap-1">
            <span>Render limit</span>
            <Tip class="bottom-0 left-0 translate-x-4" text="The target maximum number of faces to leave rendered at once."/>
        </div>
        <Slider bind:value={renderLimitValue} min={RENDER_LIMIT_MIN} max={RENDER_LIMIT_MAX}/>
        <div class="text-center w-14">{renderLimitDisplay}</div>

    </div>
    <div class="flex w-full gap-3 mt-6">
        <button on:click={save} class="w-full button0">Save</button>
        <button on:click={reset} class="w-full button0">Reset</button>
    </div>
</Modal>