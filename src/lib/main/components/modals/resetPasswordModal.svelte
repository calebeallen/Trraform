<script>

    import Modal from "$lib/common/components/modal.svelte";
    import isEmail from "validator/lib/isEmail";

    let emailError = ""
    let emailValue = ""

    function submit(){

        if(!isEmail(emailValue)){
            emailError = "Invalid email"
            return
        }

    }

</script>

<Modal class="max-w-sm" header="Reset Password" on:close>
    <div class="text-sm">Enter your email and we'll send you a link to reset your password.</div>
    <form on:submit={submit} class="mt-4">
        <div>  
            <input bind:value={emailValue} class="bg-zinc-900 outline-zinc-700 outline-1 outline p-1.5 rounded-xl w-full text-sm" type="text" placeholder="Email">
            {#if emailError}
                <div class="mt-1 text-xs text-red-500">{emailError}</div>
            {/if}
        </div>
        <button type="submit" class="block w-full mt-4 button0">Send link</button>
    </form>
</Modal>


