

<script>

    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { refs, walletAddress } from "$lib/main/store";
    import { goto } from '$app/navigation'
    import WalletConnection from "$lib/main/walletConnection"
    import ConnectWalletModal from "$lib/main/components/connectWallet/connectWalletModal.svelte";
    import PlotsList from "$lib/main/components/myPlots/plotsList.svelte";
    import EditPlot from "$lib/main/components/myPlots/editPlot.svelte";

    let connected = false
    let showConnectModal = false
    let editingPlot = null

    onMount(async () => {

        if(WalletConnection.isConnected || await WalletConnection.reconnect())
    
            connected = true

        else 

            showConnectModal = true

    })

    function connectionCancel(){

        showConnectModal = false
        goto(`/${refs.lastPlotVisited || "0x00"}`)

    }

    function connectionSuccess(){

        showConnectModal = false
        connected = true

    }

    function back(){

        if(editingPlot)

            editingPlot = null

        else

            goto(`/${refs.lastPlotVisited || "0x00"}`)
            
    }

</script>


<div transition:fade class="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50">
    {#if connected}
        <div class="flex flex-col w-full h-full max-w-screen-md px-2 mx-auto">
            <div class="flex flex-row items-center justify-between gap-6 py-2 border-b">
                <h1 class="text-xl font-bold">My Plots</h1>
                    {#if $walletAddress}
                        <div class="flex flex-row items-center justify-center w-20 max-w-sm gap-1 grow">
                            <div class="relative w-3 h-3 shrink-0 group">
                                <span class="absolute p-1 text-xs font-semibold transition-opacity delay-100 -translate-y-1/2 rounded-lg opacity-0 top-1/2 right-4 whitespace-nowrap bg-zinc-900 group-hover:opacity-100">Wallet Connected</span>
                                <span class="absolute w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
                                <span class="absolute w-3 h-3 bg-blue-500 rounded-full"></span>
                            </div>
                            <div class="text-sm truncate max-w-32">{$walletAddress}</div>
                        </div>
                    {/if}
                <button on:click={back} class="w-20 button0">Back</button>
            </div>
            {#if editingPlot === null}
                <PlotsList bind:editingPlot/>
            {:else}
                <EditPlot bind:editingPlot/>
            {/if}
        </div>
    {/if}
</div>

{#if showConnectModal}
    <ConnectWalletModal on:cancel={connectionCancel} on:success={connectionSuccess}/>
{/if}

