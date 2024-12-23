
<script>

    import Modal from "../modal.svelte"
    import { ErrorSVG } from "@packages/ui"
    import Option from "./option.svelte";
    import { onMount, createEventDispatcher } from "svelte";
    import WalletConnection from "../../walletConnection"

    const dispatchEvent = createEventDispatcher()

    let connectors = []
    let connectedId = null
    let connectingId = null
    let showErrorModal = false

    onMount(() => {

        connectors = WalletConnection.getConnectors()

    })

    async function click(e){

        const { id } = e.detail
        const connector = connectors.find(c => c.id === id)

        //trigger awaiting connection ui
        connectingId = id
        
        if( await WalletConnection.connect(connector.connector) ){

            //trigger connected ui
            connectedId = id
            setTimeout(() => dispatchEvent("success"), 500)

        } else {

            //trigger connection failed ui
            connectedId = connectingId = null
            showErrorModal = true

        }
       
    }

</script>

<Modal class="max-w-sm" header="Connect Wallet" on:close={() => dispatchEvent("cancel")}>
    <div class="flex flex-col w-full gap-4">
        <div class="flex items-center gap-2 justify-evenly">
            <div class="flex-1 h-px bg-zinc-600"></div>
            <div class="text-xs text-zinc-400">Supported Wallets</div>
            <div class="flex-1 h-px bg-zinc-600"></div>
        </div>
        <div class="flex flex-col gap-2">
            {#each connectors as { id, name, icon, isLastConnected }}
                <Option 
                    on:click={click}
                    bind:connectedId 
                    bind:connectingId 
                    id={id} name={name} icon={icon} isLastConnected={isLastConnected}
                />
            {/each}
        </div>
        <p class="text-xs text-zinc-400">By connecting a wallet, you agree to our <a class="font-semibold" href="/">Terms of Service</a> and  <a class="font-semibold" href="/">Privacy Policy</a>.</p>
    </div>
</Modal>

{#if showErrorModal}
    <Modal header="Wallet Connection Error" class="max-w-80" on:close={() => showErrorModal = false}>
        <div class="mt-4 space-y-4">
            <div class="flex justify-center w-full">
                <div class="w-20 h-20 stroke-red-400">
                    <ErrorSVG/>
                </div>
            </div>
            <div class="text-sm">For troubleshooting options, follow the connection instructions given by your wallet provider.</div>
            <button on:click={() => showErrorModal = false} class="w-full button1">Ok</button>  
        </div>
    </Modal>
{/if}

