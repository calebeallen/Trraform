
<script>

    import Modal from "../../../common/components/modal.svelte"
    import ConnectOption from "./connectOption.svelte";
    import { onMount, createEventDispatcher } from "svelte";
    import { pushNotification } from "../../../common/utils";
    import { notification } from "../../../main/store";
    import WalletConnection from "../../walletConnection"

    const dispatchEvent = createEventDispatcher()

    let connectors = []
    let connectedId = null
    let connectingId = null

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
            pushNotification(notification,)

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
                <ConnectOption 
                    on:click={click}
                    bind:connectedId 
                    bind:connectingId 
                    id={id} name={name} icon={icon} isLastConnected={isLastConnected}
                />
            {/each}
        </div>
        <p class="text-xs text-zinc-400">By connecting a wallet, you agree to our <a class="font-semibold" target="_blank" href="/terms-of-service">Terms of Service</a> and  <a class="font-semibold" target="_blank" href="/privacy-policy">Privacy Policy</a>.</p>
    </div>
</Modal>

