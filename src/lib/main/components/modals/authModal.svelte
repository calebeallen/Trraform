

<script>
    
    import Modal from "$lib/common/components/modal.svelte";
    import CheckBox from "$lib/common/components/checkBox.svelte";
    import { createEventDispatcher } from "svelte";
    import { showResetPasswordModal } from "$lib/main/store"
    import isEmail from "validator/lib/isEmail";

    let mode = "login"
    let emailValue = ""
    let passwordInput
    let passwordValue = ""
    let tosChecked = false
    let emailError = ""
    let passwordError = ""
    let tosError = ""
    let showPassword = false
    let header = "Log in"

    const dispatch = createEventDispatcher()

    $:{

        header = mode === "login" ? "Log In" : "Sign Up"

    }

    function submit(){

        let err = false
        emailError = passwordError = tosError = ""
        passwordValue = passwordInput.value

        if(!isEmail(emailValue)){
            err = true
            emailError = "Invalid email"
        }

        if(passwordValue.length < 8 || passwordValue.length > 128){
            err = true
            if(mode === "login")
                passwordError = "Invalid password"
            else if(mode === "signup")
                passwordError = "Must be between 8 and 128 characters."
        } 

        if(mode === "signup" && !tosChecked){
            err = true
            tosError = "Must check the box to sign up."
        }

        if(err)
            return

        //make login/sign up request, display errors if necessary

    }

    function switchMode(newMode){

        mode = newMode

        passwordValue = passwordInput.value = ""
        emailValue = ""
        tosChecked = false

        emailError = passwordError = tosError = ""
        showPassword = false

    }

</script>

<Modal class="max-w-sm" closeOnClickOutside={false} bind:header on:close>
    <div class="flex flex-col gap-4 mt-4">
        <form class="flex flex-col gap-4 p-0 m-0" on:submit|preventDefault={submit}>
            <div>
                <div class="input-container">
                    <input bind:value={emailValue} class="" type="text" placeholder="Email">
                </div>
                {#if emailError}
                    <div class="mt-1 text-xs text-red-500">{emailError}</div>
                {/if}
            </div>
            <div>
                <div class="input-container">
                    <input bind:this={passwordInput} type={showPassword ? "text" : "password"} placeholder="Password">
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
                        <div class="mt-1 text-xs text-red-500">{passwordError}</div>  
                        <button on:click={() => $showResetPasswordModal = true} type="button" class="transition-colors text-zinc-400 hover:text-zinc-300">Forgot password?</button>
                    </div>
                {:else if mode === "signup" && passwordError}
                    <div class="mt-1 text-xs text-red-500">{passwordError}</div>   
                {/if}
            </div>
            {#if mode === "signup"}
                <div>
                    <div class="flex items-center gap-2">
                        <CheckBox bind:checked={tosChecked}/>
                        <button type="button" on:click={() => tosChecked = !tosChecked} class="text-sm select-none text-zinc-400">I have read and agree to the <a href="/terms-of-service"><strong>Terms of Service</strong></a></button>
                    </div>
                    {#if tosError}
                        <div class="mt-1 text-xs text-red-500">{tosError}</div>
                    {/if}
                </div>
            {/if}
            <div>
                <button type="submit" class="w-full button0">{#if mode === "login"}Log in{:else if mode === "signup"}Sign up{/if}</button>
                <button type="button" on:click={() => {
                    if(mode === "login")
                        switchMode("signup")
                    else if (mode === "signup")
                        switchMode("login")
                }} class="mt-2 text-xs text-zinc-400 hover:text-zinc-300 transition-color">
                    {#if mode === "login"}
                        Don't have an account? Sign up here.
                    {:else if mode === "signup"}
                        Already have an account? Log in here.
                    {/if}
                </button>
            </div>
        </form>
        <div class="flex items-center gap-3">
            <div class="w-full h-px bg-zinc-700"></div>
            <div class="text-sm text-zinc-500">Or</div>
            <div class="w-full h-px bg-zinc-700"></div>
        </div>
        <button class="flex items-center justify-center gap-3 p-2 rounded-xl bg-zinc-900 outline-zinc-700 outline outline-1">
            <img class="w-7 aspect-square" src="/google.png" alt="">
            <div class="text-sm font-semibold">Continue with Google</div>
        </button>
    </div>
</Modal>


<style lang="postcss">

    .input-container{

        @apply flex gap-1 items-center bg-zinc-900 outline-zinc-700 outline-1 outline p-1.5 rounded-xl;

    }

    input{
        @apply p-0 m-0 text-sm bg-transparent focus:outline-none w-full;
    }

</style>