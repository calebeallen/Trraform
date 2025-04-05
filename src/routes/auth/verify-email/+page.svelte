
<script>

    import { onMount } from "svelte";
    import { loadScreenOpacity } from "../store"
    import { page } from "$app/stores"
    import { API_ORIGIN } from "$lib/common/constants"

    let state = null

    async function verifyEmail(){

        $loadScreenOpacity = 50

        const searchParams = $page.url.searchParams
        const token = decodeURIComponent(searchParams.get("token") || "")
        const email = decodeURIComponent(searchParams.get("email") || "")

        try{

            const res = await fetch(`${API_ORIGIN}/auth/verify-email`, {
                method: "POST",
                body: JSON.stringify({ token, email })
            })
            const { data, error } = await res.json()

            if(error)
                throw new Error(data.message)

            state = "verified"

        } catch {
            state = "error"
        }   

        $loadScreenOpacity = 0

    }

</script>

<div class="w-full px-2 space-y-4 max-w-80">
    {#if state === "error"}
        <h1 class="text-2xl font-semibold">Error</h1>
        <div class="text-sm">Email could not be verified, please request a new link.</div>
    {:else if state === "verified"}
        <h1 class="text-xl font-semibold sm:text-2xl">Email Verified!</h1>
        <div class="text-xs sm:text-sm">You can now log in.</div>
        <a href="/?showLogin=true" class="block w-full mt-4 button0">Go home</a>
    {:else}
        <h1 class="text-2xl font-semibold">Almost There...</h1>
        <button on:click={verifyEmail} class="block w-full mt-4 button0">Verify email</button>
    {/if}
</div>