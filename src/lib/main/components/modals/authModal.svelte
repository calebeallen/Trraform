

<script>
    
    import Modal from "$lib/common/components/modal.svelte";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { API_ORIGIN } from "$lib/common/constants"
    import { page } from "$app/stores"
    import { showResetPasswordModal, loadScreenOpacity, tempEmail, showSendVerificationEmailModal, user, modalsShowing } from "$lib/main/store"
    import isEmail from "validator/lib/isEmail";

    const USERNAME_MAX_LEN = 32
    const EMAIL_MAX_LEN = 254
    const PASSWORD_MAX_LEN = 128

    const dispatch = createEventDispatcher()

    let header = ""
    let mode = "createacc"

    let usernameValue = ""
    let emailValue = ""
    let passwordInput
    let passwordValue = ""

    let credentialError = null
    let usernameError = ""
    let emailError = ""
    let passwordError = ""
    let googleError = ""

    let cfTurnstileError = ""
    let disableSubmit = false

    let showPassword = false
    let cfToken = null

    $:header = mode === "login" ? "Log In" : "Create Account"

    onMount(() => {

        if($page.url.searchParams.get("showLogin") == "true")
            mode = "login"

        $modalsShowing++

        google.accounts.id.initialize({
            client_id: "505214281747-g26m4g2lv692ff819neq6pbus4q6f36f.apps.googleusercontent.com",
            callback: googleLogIn
        })

        google.accounts.id.renderButton(
            document.getElementById("google-login-btn"),
            { theme: "filled_black", text: "continue_with" } 
        )

    })

    onDestroy(() => $modalsShowing--)

    async function CFTurnstile(){

        let resolve
        const promise = new Promise(res => resolve = res)

        const id = turnstile.render("#cf-turnstile-0", {
            sitekey: "0x4AAAAAABD14SF04aEcSB49",
            callback: token => {
                turnstile.remove(id)
                resolve(token)
            }
        }) 

        return promise

    }

    function isUsername(username){

        const re = /^[a-zA-Z0-9._]{3,32}$/;
        return re.test(username);
        
    }

    function isPassword(password){

        const re = /^[A-Za-z0-9~`!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/]{8,128}$/;
        return re.test(password);

    }

    function switchMode(newMode){

        mode = newMode
    
        passwordValue = passwordInput.value = ""
        emailValue = ""
        usernameValue = ""

        emailError = passwordError = usernameError = cfTurnstileError = credentialError = googleError = ""
        showPassword = false

        disableSubmit = false

    }

    async function submit(){

        // clear errors
        emailError = passwordError = usernameError = cfTurnstileError = credentialError = googleError = ""
        passwordValue = passwordInput.value

        // copy values so that user cannot modify them while the below promise is waiting
        // server checks for validity, but just to be safe
        const email = emailValue.toLowerCase().trim()
        const password = passwordInput.value
        
        disableSubmit = true
        if(mode === "login")
            await passwordLogIn(email, password)
        else if(mode === "createacc"){
            const username = usernameValue
            await createAccount(username, email, password)
        }
        disableSubmit = false
        
    }

    async function createAccount(username, email, password){
        
        usernameError = isUsername(username) ? "" : "Invalid username"
        emailError = isEmail(email) ? "" : "Invalid email"
        passwordError = isPassword(password) ? "" : "Invalid password"

        if(usernameError || emailError || passwordError)
            return
            
        // do bot check
        if(!cfToken){
            disableSubmit = true
            cfToken = await CFTurnstile()
            disableSubmit = false
        }

        $loadScreenOpacity = 50

        try{

            const payload = {
                username,
                email,
                password,
                cfToken
            }

            const res = await fetch(`${API_ORIGIN}/auth/create-account`, {
                method: "POST",
                body: JSON.stringify(payload)
            })
            const { data, message } = await res.json()

            if (!res.ok) {

                if(data?.invalidCfToken)
                    cfTurnstileError = "Verification failed, please try again."

                if(data?.usernameConflict)
                    usernameError = "Username taken"

                if(data?.emailConflict)
                    emailError = "Email already registered"

                throw new Error(message)

            }

            $tempEmail = email
            $showSendVerificationEmailModal = true
            dispatch("close")

        } catch {
            cfToken = null
        } finally {
            $loadScreenOpacity = 0
        }

    }

    async function passwordLogIn(email, password){

        // do a basic format check first
        if(!isEmail(email) || !isPassword(password)){
            credentialError = "Invalid email/password"
            return
        }

        $loadScreenOpacity = 50

        try {

            const res = await fetch(`${API_ORIGIN}/auth/password-login`, {
                method: "POST",
                body: JSON.stringify({ email, password })
            })
            const { data, message } = await res.json()

            if(!res.ok){
                
                if(data?.credentialError)
                    credentialError = "Invalid email/password"
            
                if(data?.needsVerification){
                    $tempEmail = email
                    $showSendVerificationEmailModal = true
                    dispatch("close")
                }

                throw new Error(message)

            }
            
            //otherwise user is authorized. save jwt, get user data
            await getUserData(data.token)

            $tempEmail = ""
            dispatch("close")

        } catch(e) {
            console.error(e)
        } finally {
            $loadScreenOpacity = 0
        }
        
    }

    async function googleLogIn(response) {

        googleError = ""

        $loadScreenOpacity = 50

        try {

            const res = await fetch(`${API_ORIGIN}/auth/google-login`, {
                method: "POST",
                body: JSON.stringify({ token: response.credential })
            })
            const { data, message } = await res.json()

            if(!res.ok)
                throw new Error(message)

            await getUserData(data.token)
            dispatch("close")

        } catch {
            googleError = "Error logging in with google."
        } finally {
            $loadScreenOpacity = 0
        }
       
    }

    async function getUserData(token){

        localStorage.setItem("auth_token", token)

        try {

            const res = await fetch(`${API_ORIGIN}/user`, {
                headers: {
                    Authorization: token
                }
            })
            const { data, error, message } = await res.json()

            if(error)
                throw new Error(message)

            data.plotIds = data.plotIds.map(plotId => ({ plotId, isNew: false }))
            $user = data

        } catch {}

    }

</script>



<Modal class="max-w-sm" closeOnClickOutside={false} bind:header on:close>
    <div class="flex flex-col gap-4 mt-4">
        <div class="w-full">
            <button class="w-full rounded outline outline-1 outline-zinc-700" id="google-login-btn"></button>
            {#if googleError}
                <div class="text-xs text-red-500">{googleError}</div>  
            {/if}
        </div>
        <div class="flex items-center gap-3">
            <div class="w-full h-px bg-zinc-700"></div>
            <div class="text-sm text-zinc-500">Or</div>
            <div class="w-full h-px bg-zinc-700"></div>
        </div>
        <form class="flex flex-col gap-4 p-0 m-0" on:submit|preventDefault={submit}>
            <!-- username -->
            {#if mode === "createacc"}
                <div>
                    <div class="input-container">
                        <input bind:value={usernameValue} class="" type="text" placeholder="Username" maxlength={USERNAME_MAX_LEN}>
                    </div>
                    <div class="mt-1 text-xs space-y-0.5">
                        <div class="text-zinc-400">3–32 characters. Letters, numbers, _ and . only.</div>
                        {#if usernameError}
                            <div class="text-red-500">{usernameError}</div>  
                        {/if}
                    </div>
                </div>
            {/if}
            <!-- email -->
            <div>
                {#if credentialError}
                    <div class="mb-1 text-xs text-red-500">{credentialError}</div>
                {/if}
                <div class="input-container">
                    <input bind:value={emailValue} class="" type="text" placeholder="Email" maxlength={EMAIL_MAX_LEN}>
                </div>
                {#if emailError}
                    <div class="mt-1 text-xs text-red-500">{emailError}</div>
                {/if}
            </div>
            <!-- password -->
            <div>
                <div class="input-container">
                    <input bind:this={passwordInput} type={showPassword ? "text" : "password"} placeholder="Password" maxlength={PASSWORD_MAX_LEN}>
                    <button type="button" on:click={() => showPassword = !showPassword}>
                        {#if showPassword}
                            <img class="w-4 rounded opacity-50 aspect-square" src="/eyeSlashed.svg" alt="">
                        {:else}
                            <img class="w-4 rounded opacity-50 aspect-square" src="/eye.svg" alt="">
                        {/if}
                    </button>
                </div>
                {#if mode === "login"}
                    <button on:click={() => $showResetPasswordModal = true} type="button" class="mt-0.5 transition-colors text-zinc-400 hover:text-zinc-300 text-xs">Forgot password?</button>
                {:else if mode === "createacc"}
                    <div class="mt-1 text-xs space-y-0.5">
                        <div class="text-zinc-400">8-128 characters. Letters, numbers, and symbols only. No whitespace.</div>
                        {#if passwordError}
                            <div class="mt-1 text-xs text-red-500">{passwordError}</div>  
                        {/if}
                    </div>
                {/if}
            </div>
            <!-- CF Turnstile -->
            {#if mode === "createacc"} 
                <div>
                    <div id="cf-turnstile-0"></div>
                    <div class="text-xs text-red-500 mt-0.5">{cfTurnstileError}</div>
                </div>
            {/if}
            <div>
                <button type="submit" class="w-full button0 {disableSubmit ? "pointer-events-none opacity-50" : ""}">{#if mode === "login"}Log in{:else if mode === "createacc"}Create account{/if}</button>
                <button type="button" on:click={() => {
                    if(mode === "login")
                        switchMode("createacc")
                    else if (mode === "createacc")
                        switchMode("login")
                }} class="mt-2 text-xs transition-colors text-zinc-400 hover:text-zinc-300">
                    {#if mode === "login"}
                        Don't have an account? Sign up here.
                    {:else if mode === "createacc"}
                        Already have an account? Log in here.
                    {/if}
                </button>
            </div>
        </form>
        <div class="w-full h-px bg-zinc-700"></div>
        <div class="text-xs text-zinc-400">By creating an account or signing in, you agree to our <a href="/terms-of-service" target="_blank"><strong>Terms of Service</strong></a> and <a href="/privacy-policy" target="_blank"><strong>Privacy Policy</strong></a>.</div>
    </div>
</Modal>


<style lang="postcss">

    .input-container{

        @apply flex gap-1 items-center bg-zinc-900 outline-zinc-700 outline-1 outline p-1.5 rounded-lg;

    }

    input{
        @apply p-0 m-0 text-sm bg-transparent focus:outline-none w-full;
    }

</style>