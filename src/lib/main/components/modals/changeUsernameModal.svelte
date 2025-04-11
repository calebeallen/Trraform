
<script>

    import { createEventDispatcher, onMount } from "svelte";
    import { user, loadScreenOpacity } from "$lib/main/store"
    import { API_ORIGIN } from "$lib/common/constants"
    import Modal from "../../../common/components/modal.svelte";
  
    const dispatch = createEventDispatcher()
    let newUsername = ""
    let usernameError = ""

    onMount(() => {

        newUsername = $user.username

    })

    function isUsername(username){

        const re = /^[a-zA-Z0-9._]{3,32}$/;
        return re.test(username);

    }

    async function changeUsername(){

        usernameError = ""

        if(!isUsername(newUsername)){
            usernameError = "Invalid username"
            return
        }

        $loadScreenOpacity = 50

        const res = await fetch(`${API_ORIGIN}/user/change-username`, {
            method: "POST",
            headers: {
                "Authorization": localStorage.getItem("auth_token"),
                "Content-type": "application/json"
            },
            body: JSON.stringify({ newUsername })
        })
        const { data } = await res.json()

        if(res.ok)
            dispatch("close")

        else if(data?.usernameTaken)
            usernameError = "Username taken"

        $loadScreenOpacity = 0

    }
    
</script>

<Modal class="max-w-sm" header="Change username" on:close>
    <div class="space-y-4">
        <div class="text-xs sm:text-sm">Note: your new username will not appear on your plots until you update them.</div>
        <form on:submit|preventDefault={changeUsername}>
            <input bind:value={newUsername} class="w-full std-input" type="text" placeholder="New username"> 
            <div class="mt-1 text-xs text-zinc-400">3–32 characters. Letters, numbers, _ and . only.</div>
            {#if usernameError}
                <div class="text-xs text-red-500 mt-0.5">{usernameError}</div>
            {/if}
            <button class="w-full mt-4 button0 {newUsername === $user?.username ? "opacity-50 pointer-events-none" : ""}">Change</button>
        </form>
    </div>
</Modal>