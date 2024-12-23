

<script>

    import Modal from "../modal.svelte";
    import { ErrorSVG }  from "@packages/ui";
    import { showConnectErrorModal } from "../../store";

</script>

<Modal header="Wallet Connection Error" addClasses="max-w-80" xCallback={() => $showConnectErrorModal = false}>
    <div class="mt-4 space-y-4">
        <div class="flex justify-center w-full">
            <div class="w-20 h-20 stroke-red-400">
                <ErrorSVG/>
            </div>
        </div>
        <div class="text-sm">For troubleshooting options, follow the connection instructions given by your wallet provider.</div>
        <button on:click={() => $showConnectErrorModal = false} class="w-full button1">Ok</button>  
    </div>
</Modal>