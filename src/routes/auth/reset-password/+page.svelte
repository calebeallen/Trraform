
<script>

    import { API_ORIGIN } from "$lib/common/constants"
    import { loadScreenOpacity } from "../store";
    import { page } from "$app/stores"

    let state = null

    let password0, password1
    let showPassword = false
    let password0Error = ""
    let password1Error = ""
    let resetError = ""

    function isPassword(password){

        const re = /^[A-Za-z0-9~`!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/]{8,128}$/;
        return re.test(password);

    }

    async function resetPassword(){

        password0Error = password1Error = resetError = ""
        const password = password0.value
        const confirm = password1.value

        if(!isPassword(password)){
            password0Error = "Invalid password"
            return
        }

        if(password !== confirm){
            password1Error = "Passwords do not match"
            return
        }

        const searchParams = $page.url.searchParams
        const token = decodeURIComponent(searchParams.get("token") || "")
        const email = decodeURIComponent(searchParams.get("email") || "")

        $loadScreenOpacity = 50

        try {

            const payload = {
                token,
                email,
                newPassword: password
            }
            const res = await fetch(`${API_ORIGIN}/auth/reset-password`, {
                method: "POST",
                body: JSON.stringify(payload)
            })

            const { error, message } = await res.json()

            if(error)
                throw new Error(message)

            state = "reset"

        } catch {

            resetError = "An error occured, please request a new link."

        }

        $loadScreenOpacity = 0

    }

</script>


{#if state === "reset"}
    <div class="w-full px-2 space-y-4 max-w-80">
        <h1 class="text-xl font-semibold sm:text-2xl">Password Reset!</h1>
        <div class="text-xs sm:text-sm">You can now log in.</div>
        <a href="/?showLogin=true" class="block w-full mt-4 button0">Go home</a>
    </div>
{:else}
    <div class="w-full max-w-sm p-4 bg-zinc-800 outline-zinc-700 outline-1 outline rounded-2xl">
        <h1 class="text-xl font-bold">Reset password</h1>
        <form on:submit|preventDefault={resetPassword} class="mt-4 space-y-4">
            <div>
                <div class="input-container">
                    <input bind:this={password0} type={showPassword ? "text" : "password"} placeholder="New password">
                </div>
                <div class="mt-1 text-xs text-zinc-400">8-128 characters. Letters, numbers, and symbols only. No whitespace.</div>
                {#if password0Error}
                    <div class="text-xs text-red-500 mt-0.5">{password0Error}</div>
                {/if}
            </div>
            <div>
                <div class="input-container">
                    <input bind:this={password1} type={showPassword ? "text" : "password"} placeholder="Confirm password">
                    <button type="button" on:click={() => showPassword = !showPassword}>
                        {#if showPassword}
                            <img class="w-4 rounded opacity-50 aspect-square" src="/eyeSlashed.svg" alt="">
                        {:else}
                            <img class="w-5 rounded aspect-square" src="/eyeGif.gif" alt="">
                        {/if}
                    </button>
                </div>
                {#if password1Error}
                    <div class="text-xs text-red-500 mt-0.5">{password1Error}</div>
                {/if}
            </div>
            <div>
                <button class="w-full button0" type="submit">Reset password</button>
                {#if resetError}
                    <div class="text-xs text-red-500 mt-0.5">{resetError}</div>
                {/if}
            </div>
        </form>
    </div>
{/if}

<style lang="postcss">

    .input-container{

        @apply flex gap-1 items-center bg-zinc-900 outline-zinc-700 outline-1 outline p-1.5 rounded-lg;

    }

    input{
        @apply p-0 m-0 text-sm bg-transparent focus:outline-none w-full;
    }

</style>