
<script>

    import Modal from "$lib/common/components/modal.svelte"
    import { createEventDispatcher } from "svelte"
    import { loadScreenOpacity, notification } from "$lib/main/store"
    import { pushNotification } from "$lib/common/utils"

    const dispatch = createEventDispatcher()

    export let plotIdStr
    let message = ""
    let charCount

    $: charCount = message.trim().length - 250

    async function submit(){

        $loadScreenOpacity = 50

        try {

            await fetch( `/api/report-plot`, { 
                method: "POST",
                body: JSON.stringify({ plotId: plotIdStr, message }),
                headers: { "Content-Type" : "application/json" }
            })

            pushNotification(notification, "Plot reported", "We received your report and are looking into it.")

        } catch {

            pushNotification(notification, "Something went wrong..", "There was an error while processing your report.")

        }

        dispatch("close")
        pushNotification(notification, "Plot reported", "We received your report and are looking into it.")
        $loadScreenOpacity = 0
 
    }

</script>


<Modal class="max-w-screen-sm" header="Report Plot {plotIdStr}?" on:close>
    <div class="space-y-3 text-sm">
        <p>We appreciate your help with make Trraform a better place for everyone. <b>We do not take actions on reports unless they are highly serious. </b>Spam and abuse of our report system will be automatically filtered.</p>
        <p>Describe your report in detail. If this report involves your personal information, please provide your Discord username.</p>
        <div class="relative w-full">
            <textarea maxlength="500" bind:value={message} class="w-full p-1 m-0 mt-1 text-sm align-top transition-colors rounded-lg resize-none outline outline-1 outline-zinc-800 bg-zinc-900" rows="6" placeholder="Minimum 250 characters, maximum 500 characters."></textarea>
            <span class="absolute text-xs opacity-50 bottom-1 right-1 {charCount >= 0 ? "text-green-500" : ""}">{charCount}</span>
        </div>
        <button on:click={submit} class="button0 w-full {charCount < 0 ? "pointer-events-none opacity-50" : ""}">Submit</button>
    </div>
</Modal>