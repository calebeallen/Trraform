
<script>

    import Modal from "$lib/common/components/modal.svelte"
    import { createEventDispatcher, onDestroy, onMount } from "svelte"
    import { loadScreenOpacity, notification, modalsShowing, insideOf } from "$lib/main/store"
    import { pushNotification } from "$lib/common/utils"
    import { setCookie, getCookie } from "$lib/common/cookie"

    const dispatch = createEventDispatcher()

    let plotIdStr
    let message = ""
    let charCount

    $: charCount = message.trim().length - 250

    onMount(() => {

        $modalsShowing++

        plotIdStr = $insideOf.id.string()

    })
    onDestroy(() => $modalsShowing--)

    async function submit(){

        $loadScreenOpacity = 50

        if(getCookie("reported") == ""){

            try {

                await fetch( `https://api.trraform.com/report-plot?plotId=${plotIdStr}`, { 
                    method: "POST",
                    body: JSON.stringify({ reportMsg: message }),
                    headers: { "Content-Type" : "application/json" }
                })

                pushNotification(notification, "Plot reported", "We received your report and are looking into it.")

            } catch {

                pushNotification(notification, "Something went wrong..", "There was an error while processing your report.")

            }

        }

        setCookie("reported", "true", 0.1)

        dispatch("close")
        pushNotification(notification, "Plot reported", "We received your report and are looking into it.")
        $loadScreenOpacity = 0
 
    }

</script>


<Modal class="max-w-lg" header="Report Plot {plotIdStr}?" on:close>
    <div class="space-y-3 text-xs sm:text-sm">
        <p>We appreciate your help with make Trraform a better place for everyone. <b>We do not take actions on reports unless they are highly serious. </b>Spam and abuse of our report system will be automatically filtered.</p>
        <div class="relative w-full">
            <textarea maxlength="500" bind:value={message} class="w-full p-1 m-0 mt-1 text-xs align-top transition-colors rounded-lg resize-none sm:text-sm outline outline-1 outline-zinc-700 bg-zinc-900" rows="6" placeholder="Minimum 250 characters, maximum 500 characters."></textarea>
            <span class="absolute text-xs opacity-50 bottom-1 right-1 {charCount >= 0 ? "text-green-500" : ""}">{charCount}</span>
        </div>
        <button on:click={submit} class="button0 w-full {charCount < 0 ? "pointer-events-none opacity-50" : ""}">Submit</button>
    </div>
</Modal>