
<script>

    import { onMount } from "svelte"
    import { refs, settings, defaultSettings, isMobileBrowser } from "../../store"
    import WalletConnection from "../../walletConnection";
    import Modal from "../../../common/components/modal.svelte"
    import SliderSetting from "./sliderSetting.svelte";
    import OptionSetting from "./optionSetting.svelte";
    import Tip from "../../../common/components/tip.svelte";
    import DropDown from "./dropDown.svelte";
    import ConnectWalletModal from "../connectWallet/connectWalletModal.svelte";

    let selectedTab = 0
    let showConnectModal = false
    let fov, lookSens, maxTags, tagSize, antialias, limitType, vramLimit, renderLimit, renderDist, lowResDist
    let addressIndex = 0
    let addresses = []
    let providerName = ""
    let providerIcon = null

    onMount(() => {

        fov = settings.general.fov
        lookSens = settings.general.lookSens
        maxTags = settings.general.maxTags
        tagSize = settings.general.tagSize
        antialias = settings.render.antialias ? 0 : 1
        limitType = settings.render.limitType
        vramLimit = settings.render.vramLimit
        renderLimit = settings.render.renderLimit
        renderDist = settings.render.renderDist
        lowResDist = settings.render.lowResDist
        
    })

    function save(){

        settings.general.fov = refs.camera.fov = parseInt(fov)
        settings.general.lookSens = parseInt(lookSens)
        settings.general.maxTags = parseInt(maxTags)
        settings.general.tagSize = parseInt(tagSize)
        settings.render.limitType = parseInt(limitType)
        settings.render.vramLimit = parseInt(vramLimit)
        settings.render.renderLimit = parseInt(renderLimit)

        const newLowResDist = parseInt(lowResDist)
        refs.renderManager.setLodDistances( newLowResDist / settings.render.lowResDist )
        settings.render.lowResDist = newLowResDist

        refs.camera.updateProjectionMatrix(); // Apply the changes

        localStorage.setItem("settings", JSON.stringify(settings))

    }

    function loadDefault(){

        fov = defaultSettings.general.fov
        lookSens = defaultSettings.general.lookSens
        maxTags = defaultSettings.general.maxTags
        tagSize = defaultSettings.general.tagSize
        limitType = defaultSettings.render.limitType
        vramLimit = defaultSettings.render.vramLimit
        renderLimit = defaultSettings.render.renderLimit
        lowResDist = defaultSettings.render.lowResDist
        
    }

    async function changeTab(tab){

        showConnectModal = false

        if (tab === 1) {

            if(WalletConnection.isConnected || await WalletConnection.reconnect()){
    
                selectedTab = 1
                providerName = WalletConnection.connection.connector.name
                providerIcon = WalletConnection.connection.connector.icon
                addresses = WalletConnection.connection.addresses
                addressIndex = WalletConnection.connection.addressIndex

            } else 

                showConnectModal = true

        } else

            selectedTab = 0

    }

    async function disconnect() {
        
        await WalletConnection.disconnect()
        changeTab(0)

    }

</script>


<Modal on:close class="max-w-screen-md" header="Settings">
    <div class="flex flex-col items-stretch w-full gap-4 sm:flex-row">
        {#if !$isMobileBrowser}
            <div class="flex flex-row justify-between flex-none w-full gap-1 sm:justify-normal sm:flex-col sm:w-52 border-zinc-600">
                <button on:click={() => changeTab(0)} class="settings-button active:opacity-80 {selectedTab === 0 ? "bg-zinc-700" : "hover:bg-zinc-700"}">World Settings</button>
                <button on:click={() => changeTab(1)} class="settings-button active:opacity-80 {selectedTab === 1 ? "bg-zinc-700" : "hover:bg-zinc-700"}">Wallet Settings</button>
            </div>
            <div class="w-full h-px sm:h-auto sm:w-px bg-zinc-700"></div>
        {/if}
        {#if selectedTab === 0}
            <div class="flex flex-col justify-between flex-1 gap-3 min-h-96">
                <div class="settings-subsection">
                    <h1>General</h1>
                    <SliderSetting bind:value={fov} name="FOV" postfix="°" min={10} max={150}/>
                    <SliderSetting bind:value={lookSens} name="Sensitivity" min={1} max={50}/>
                    <SliderSetting bind:value={maxTags} name="Max Tags" max={100}/>
                    <SliderSetting bind:value={tagSize} name="Tag Size" min={1} max={10}/>
                </div>
                <div class="settings-subsection">
                    <h1>Render Settings</h1>
                    <OptionSetting bind:selected={limitType} name="Limit Metric" options={["VRAM", "Plots"]}>
                        <Tip text="The metric used to limit the amount of plots rendered. Note that the accompanying limits should be set based on your system's capabilities."/>
                    </OptionSetting>
                    {#if limitType === 0}
                        <SliderSetting bind:value={vramLimit} name="VRAM Limit" units={[" MB"," GB",""]} nolimit={true} min={100} max={24000}/>
                    {:else}
                        <SliderSetting bind:value={renderLimit} name="Max Rendered Plots" nolimit={true} min={100} max={75000}/>
                    {/if}
                    <SliderSetting bind:value={lowResDist} name="Low Resolution Distance" min={10} max={200}>
                        <Tip text="The distance from a plot that causes it to render in low resolution. Useful for reducing lag when rendering many plots."/>
                    </SliderSetting>
                </div>
                <div class="flex w-full gap-3">
                    <button on:click={save} class="flex-1 button0">Apply</button>
                    <button on:click={loadDefault} class="flex-1 button0">Load Default</button>
                </div>
            </div>
        {:else if selectedTab === 1}
            <div class="flex flex-col justify-between flex-1 w-full min-h-96">
                <div>
                    <div class="settings-subsection">
                        <h1>Wallet Provider</h1>
                        <div class="flex items-center gap-2">
                            <img class="w-6 h-6" src={providerIcon} alt="">
                            <div class="text-sm">{providerName}</div>
                        </div>
                    </div>
                    <div class="mt-3 settings-subsection">
                        <h1>Current Wallet</h1>
                        <DropDown on:change={e => WalletConnection.changeWallets(e.detail.index)} bind:options={addresses} bind:selectedIndex={addressIndex}/>
                    </div>
                </div>
                <div class="settings-subsection">
                    <button on:click={disconnect} class="px-2 py-1 text-sm font-semibold text-center transition-colors bg-red-600 rounded-lg hover:bg-red-500 active:bg-red-600">Disconnect Wallets</button>
                </div>
            </div>
        {/if}
    </div>
</Modal>

{#if showConnectModal}
    <ConnectWalletModal on:cancel={() => changeTab(0)} on:success={() => changeTab(1)}/>
{/if}


<style lang="postcss">

    .settings-button{

        @apply text-left w-full px-3 py-2 text-sm transition-all rounded-xl;

    }

    h1{

        @apply font-semibold text-sm;

    }

    .settings-subsection{

        @apply flex gap-3 flex-col;

    }

</style>