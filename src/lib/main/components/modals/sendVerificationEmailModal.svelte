
<script>

    import Modal from "$lib/common/components/modal.svelte"
    import { API_ORIGIN } from "$lib/common/constants"
    import { tempEmail, loadScreenOpacity, modalsShowing } from "$lib/main/store"
    import { onDestroy, onMount } from "svelte";

    let cooldown = 0
    let cooldownInterval = null
    let sendError = ""

    let cfTurnstileError = ""
    let turnstileId = null
    let cfToken = null
    let disableSubmit = false

    onMount(() => $modalsShowing++)
    onDestroy(() => $modalsShowing--)


    async function CFTurnstile(){

        let resolve
        const promise = new Promise(res => resolve = res)

        const id = turnstile.render("#cf-turnstile-2", {
            sitekey: "0x4AAAAAABD14SF04aEcSB49",
            callback: token => {
                turnstile.remove(id)
                resolve(token)
            }
        }) 

        return promise

    }

    async function sendLink(){

        if(cooldown > 0)
            return

        sendError = cfTurnstileError = ""

        // do bot check
        if(!cfToken){
            disableSubmit = true
            cfToken = await CFTurnstile()
            disableSubmit = false
        }

        // do bot check
        if(!cfToken){
            disableSubmit = true
            cfToken = await CFTurnstile()
            disableSubmit = false
        }

        $loadScreenOpacity = 50

        try { 

            const res = await fetch(`${API_ORIGIN}/auth/send-verification-email`, {
                method: "POST",
                body: JSON.stringify({ email: $tempEmail, cfToken })
            })
            const { data, message } = await res.json() 

            if(!res.ok){

                if(data?.invalidCfToken){
                    cfToken = null
                    cfTurnstileError = "Verification failed, please try again."
                    return
                }

                throw new Error(message)
                
            }

            cooldown = data?.cooldown ?? 0
            cooldownInterval = setInterval(() => {

                cooldown--
                
                if(cooldown <= 0){
                    cfToken = null
                    clearInterval(cooldownInterval)
                }

            }, 1000)

        } catch(e) {
            console.error(e)
            sendError = "An error occurred, email may already be verified."
        } finally {
            $loadScreenOpacity = 0
        }

    }   

</script>

<Modal class="max-w-sm" header="One more step..." on:close>
    <div class="space-y-4">
        <div class="text-xs sm:text-sm">We need to verify your email. We'll send a confirmation link to <strong>{$tempEmail}</strong>.</div>
        <div>
            <div id="cf-turnstile-2"></div>
            <div class="text-xs text-red-500 mt-0.5">{cfTurnstileError}</div>
        </div>
        {#if cooldown > 0}
            <div>
                <div class="w-full p-1.5 text-center text-xs sm:text-sm outline outline-1 outline-zinc-700 rounded-lg text-zinc-400">Resend in {cooldown} seconds</div>
                <div class="mt-1 text-xs text-green-500">Link sent! Make sure to check your spam or junk folder.</div>
            </div>
        {:else}
            <div>
                <button class="w-full button0 {disableSubmit ? "pointer-events-none opacity-50": ""}" on:click={sendLink}>Send link</button>
                {#if sendError}
                    <div class="mt-1 text-xs text-red-500">{sendError}</div>
                {/if}
            </div>
        {/if}
        <div class="flex justify-center w-full">
            <a class="flex items-center justify-center gap-1.5 opacity-75" href="https://discord.gg/KGYYePyfuQ" target="_blank">
                <img class="w-5 aspect-square" src="/discord.svg" alt="discord">
                <div class="text-xs sm:text-sm">Having issues?</div>
            </a>
        </div>
    </div>
</Modal>