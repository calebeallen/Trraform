

<script>
    
    import Modal from "$lib/common/components/modal.svelte";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { API_ORIGIN } from "$lib/common/constants"
    import { showResetPasswordModal, loadScreenOpacity, tempEmail, showSendVerificationEmailModal, user, modalsShowing } from "$lib/main/store"
    import isEmail from "validator/lib/isEmail";

    const USERNAME_MAX_LEN = 48
    const EMAIL_MAX_LEN = 254
    const PASSWORD_MIN_LEN = 8
    const PASSWORD_MAX_LEN = 128

    const dispatch = createEventDispatcher()

    let header = "Log In"
    let mode = "login"

    let usernameValue = ""
    let emailValue = ""
    let passwordInput
    let passwordValue = ""

    let usernameError = ""
    let emailError = ""
    let passwordError = ""
    let googleError = ""

    let showPassword = false

    $:header = mode === "login" ? "Log In" : "Create Account"

    onMount(() => {

        $modalsShowing++

        google.accounts.id.initialize({
            client_id: "505214281747-g26m4g2lv692ff819neq6pbus4q6f36f.apps.googleusercontent.com",
            callback: googleLogIn
        })

        google.accounts.id.renderButton(
            document.getElementById("google-login-btn"),
            { theme: "filled_black", text: "continue_with" } 
        )

        google.accounts.id.prompt()

    })

    onDestroy(() => $modalsShowing--)

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

        emailError = passwordError = usernameError = ""
        showPassword = false

    }

    async function submit(){

        // clear errors
        emailError = passwordError = usernameError = ""
        passwordValue = passwordInput.value

        $loadScreenOpacity = 50
        
        if(mode === "login")
            await passwordLogIn()
        else if(mode === "createacc")
            await createAccount()

        $loadScreenOpacity = 0
        
    }

    async function createAccount(){

        const email = emailValue.toLowerCase().trim()
        
        usernameError = isUsername(usernameValue) ? "" : "Invalid username"
        emailError = isEmail(email) ? "" : "Invalid email"
        passwordError = isPassword(passwordValue) ? "" : "Invalid password"

        if(usernameError || emailError || passwordError)
            return

        const payload = {
            username: usernameValue,
            email: email,
            password: passwordValue
        }
        const res = await fetch(`${API_ORIGIN}/auth/create-account`, {
            method: "POST",
            body: JSON.stringify(payload)
        })
        const { data, error } = await res.json()

        usernameError = data?.usernameExist ? "Username taken" : ""
        emailError = data?.emailExist ? "Email already registered" : ""
        
        if(error || usernameError || emailError)
            return

        $tempEmail = email
        $showSendVerificationEmailModal = true
        dispatch("close")

    }

    async function passwordLogIn(){

        const email = emailValue.toLowerCase().trim()

        emailError = isEmail(email) ? "" : "Invalid email"
        passwordError = isPassword(passwordValue) ? "" : "Invalid password"

        if(emailError || passwordError)
            return

        const payload = {
            email: email,
            password: passwordValue
        }
        const res = await fetch(`${API_ORIGIN}/auth/password-login`, {
            method: "POST",
            body: JSON.stringify(payload)
        })
        const { data, error } = await res.json()

        if(data === null && error)
            throw new Error("Unknown error")

        if(error){
            
            if(!data.userExists){
                emailError = "Invalid email"
                return
            }
            
            if(!data.passwordCorrect){
                passwordError = "Invalid password"
                return
            }
        
            if(!data.emailVerified){
                $tempEmail = email
                $showSendVerificationEmailModal = true
                dispatch("close")
                return
            }

        }
        
        //otherwise, save jwt, get user data
        await getUserData(data.token)

        $tempEmail = ""
        dispatch("close")

        
    }

    async function googleLogIn(response) {

        $loadScreenOpacity = 50
        googleError = ""

        try {

            const res = await fetch(`${API_ORIGIN}/auth/google-login`, {
                method: "POST",
                body: JSON.stringify({ token: response.credential })
            })
            const { data, error, message } = await res.json()

            if(error)
                throw new Error(message)

            await getUserData(data.token)

        } catch {
            googleError = "Error logging in with google."
        }

        $loadScreenOpacity = 0
        dispatch("close")

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
                            <img class="w-5 rounded aspect-square" src="/eyeGif.gif" alt="">
                        {/if}
                    </button>
                </div>
                {#if mode === "login"}
                    <div class="flex justify-between mt-1 text-xs">
                        <div class="text-xs text-red-500">{passwordError}</div>
                        <button on:click={() => $showResetPasswordModal = true} type="button" class="transition-colors text-zinc-400 hover:text-zinc-300">Forgot password?</button>
                    </div>
                {:else if mode === "createacc"}
                    <div class="mt-1 text-xs space-y-0.5">
                        <div class="text-zinc-400">8-128 characters. Letters, numbers, and symbols only. No whitespace.</div>
                        {#if passwordError}
                            <div class="mt-1 text-xs text-red-500">{passwordError}</div>  
                        {/if}
                    </div>
                {/if}
            </div>
            <div>
                <button type="submit" class="w-full button0">{#if mode === "login"}Log in{:else if mode === "createacc"}Create account{/if}</button>
                <button type="button" on:click={() => {
                    if(mode === "login")
                        switchMode("createacc")
                    else if (mode === "createacc")
                        switchMode("login")
                }} class="mt-2 text-xs text-zinc-400 hover:text-zinc-300 transition-color">
                    {#if mode === "login"}
                        Don't have an account? Sign up here.
                    {:else if mode === "createacc"}
                        Already have an account? Log in here.
                    {/if}
                </button>
            </div>
        </form>
        <div class="w-full h-px bg-zinc-700"></div>
        <div class="text-xs text-zinc-400">By creating an account or signing in, you agree to our <a href="/"><strong>Terms of Service</strong></a> and <a href="/"><strong>Privacy Policy</strong></a>.</div>
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