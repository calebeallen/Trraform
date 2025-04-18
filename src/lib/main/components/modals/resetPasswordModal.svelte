<script>

    import Modal from "$lib/common/components/modal.svelte";
    import isEmail from "validator/lib/isEmail";
    import { API_ORIGIN } from "$lib/common/constants"
    import { loadScreenOpacity, modalsShowing } from "$lib/main/store"
    import { onDestroy, onMount } from "svelte";

    let cooldown = 0
    let cooldownInterval = null

    let sendError = ""
    let emailError = ""
    let emailValue = ""

    let cfTurnstileError = ""
    let cfToken = null

    let disableSubmit = false

    onMount(() => $modalsShowing++)
    onDestroy(() => $modalsShowing--)

    async function CFTurnstile(){

        let resolve
        const promise = new Promise(res => resolve = res)

        const id = turnstile.render("#cf-turnstile-1", {
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

        sendError = emailError = cfTurnstileError = ""

        const email = emailValue.toLowerCase().trim()

        if(!isEmail(email)){
            emailError = "Invalid email"
            return
        }

        // do bot check
        if(!cfToken){
            disableSubmit = true
            cfToken = await CFTurnstile()
            disableSubmit = false
        }

        $loadScreenOpacity = 50

        try {

            const res = await fetch(`${API_ORIGIN}/auth/send-password-reset-email`, {
                method: "POST",
                body: JSON.stringify({ email, cfToken })
            })
            const { data, message } = await res.json()

            if(!res.ok){

                if(data?.invalidCfToken){

                    cfTurnstileError = "Verification failed, please try again."
                    cfToken = null
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

        } catch {
            sendError = "An error occurred, email may not be registered."
        } finally {
            $loadScreenOpacity = 0
        }

    }
    
</script>

<Modal class="max-w-sm" header="Reset Password" on:close>
    <div class="text-xs sm:text-sm">Enter your email and we'll send you a link to reset your password.</div>
    <form on:submit|preventDefault={sendLink} class="mt-4 space-y-4">
        <div>  
            <input bind:value={emailValue} class="bg-zinc-900 outline-zinc-700 outline-1 outline p-1.5 rounded-lg w-full text-sm" type="text" placeholder="Email">
            {#if emailError}
                <div class="mt-1 text-xs text-red-500">{emailError}</div>
            {/if}
        </div>
        <div>
            <div id="cf-turnstile-1"></div>
            <div class="text-xs text-red-500 mt-0.5">{cfTurnstileError}</div>
        </div>
        {#if cooldown > 0}
            <div>
                <div class="w-full p-1.5 text-center text-xs sm:text-sm outline outline-1 outline-zinc-700 rounded-lg text-zinc-400">Resend in {cooldown} seconds</div>
                <div class="mt-1 text-xs text-green-500">Link sent! Make sure to check your spam or junk folder.</div>
            </div>
        {:else}
            <div>
                <button type="submit" class="w-full button0 {disableSubmit ? "pointer-events-none opacity-50": ""}">Send link</button>
                {#if sendError}
                    <div class="mt-1 text-xs text-red-500">{sendError}</div>
                {/if}
            </div>
        {/if}
        
    </form>
</Modal>


