
<script>

    import { walletConnection } from "$lib/main/store"
    import { createEventDispatcher } from "svelte";
    import { showConnectWalletModal } from "../store";

    const dispatch = createEventDispatcher()

    let disconnectAnimationInterval = null
    let disconnectAnimationt = 0

    let walletConnected = false
    let walletAddress, walletIcon

    function disconnectMousedown(){
        
        disconnectAnimationt = 0
        disconnectAnimationInterval = setInterval(() => {

            disconnectAnimationt += 0.01

            if(disconnectAnimationt >= 1){

                clearInterval(disconnectAnimationInterval)
                disconnectAnimationInterval = null

                $walletConnection.disconnect()
                .then(() => $walletConnection = null)
                
            }

        }, 10)

    }


    function mouseup(){

        clearInterval(disconnectAnimationInterval)
        disconnectAnimationInterval = null 
        disconnectAnimationt = 0

    }
    
    $:if($walletConnection === null){

        walletConnected = false

    } else {

        walletIcon = $walletConnection.connector.icon
        walletAddress = $walletConnection.address
        walletConnected = true

    }

</script>

<svelte:window on:mouseup={mouseup}/>

<div class="flex items-center gap-2 p-2 bg-zinc-900 outline-1 outline outline-zinc-800 rounded-2xl">
    {#if !walletConnected}
        <button on:click={() => $showConnectWalletModal = true} class="flex gap-1 py-1 px-1.5 items-center text-sm text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors">
            <img class="w-4 h-4" src="/power.svg" alt="">
            <span>Connect wallet</span>
        </button>
    {:else}
        <button on:mousedown={disconnectMousedown} class="relative flex gap-1 py-1 px-1.5 items-center text-sm text-zinc-400 rounded-lg transition-colors group">
            <img class="w-4 h-4" src={walletIcon} alt="">
            <div class="truncate max-w-20">{walletAddress}</div>
            <div class="absolute top-0 left-0 flex items-center justify-center w-full h-full overflow-hidden transition-opacity delay-100 bg-black rounded-lg opacity-0 bg-opacity-80 group-hover:opacity-100">
                <div class="absolute top-0 left-0 z-0 w-full h-full -translate-x-1/2 bg-red-500 opacity-40" style="transform: translateX(calc((1 - {disconnectAnimationt}) * -100%));"></div>
                <div class="absolute text-sm text-red-400">Disconnect</div>
            </div>
        </button>
        <button on:click={() => dispatch("openMyPlots")} class="transition-opacity opacity-50 w-7 h-7 hover:opacity-80">
            <img src="/plot1.svg" alt="">
        </button>
    {/if}
    <button on:click={() => dispatch("openSettings")} class="transition-opacity opacity-50 w-7 h-7 hover:opacity-80">
        <img src="/settings.svg" alt="">
    </button>
</div>