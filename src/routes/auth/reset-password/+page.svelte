
<script>

    import { onMount } from "svelte";

    let loading = true
    let message = ""

    let password0, password1
    let showPassword0 = false, showPassword1 = false


    onMount(() => {

        //testing
        message = "Email Verified!"
        setTimeout(() => loading = false, 1000)

    })

</script>


<div class="w-full max-w-sm p-4 bg-zinc-800 outline-zinc-700 outline-1 outline rounded-2xl">
    <h1 class="text-xl font-bold">Reset password</h1>
    <form class="mt-4 space-y-4">
        <div class="input-container">
            <input bind:this={password0} type={showPassword0 ? "text" : "password"} placeholder="New password">
            <button type="button" on:click={() => showPassword0 = !showPassword0}>
                {#if showPassword0}
                    <img class="w-4 rounded opacity-50 aspect-square" src="/eyeSlashed.svg" alt="">
                {:else}
                    <img class="w-5 rounded aspect-square" src="/eyeGif.gif" alt="">
                {/if}
            </button>
        </div>
        <div class="input-container">
            <input bind:this={password1} type={showPassword1 ? "text" : "password"} placeholder="Confirm password">
            <button type="button" on:click={() => showPassword1 = !showPassword1}>
                {#if showPassword1}
                    <img class="w-4 rounded opacity-50 aspect-square" src="/eyeSlashed.svg" alt="">
                {:else}
                    <img class="w-5 rounded aspect-square" src="/eyeGif.gif" alt="">
                {/if}
            </button>
        </div>
        <button class="w-full button0" type="submit">Reset password</button>
    </form>
</div>


<style lang="postcss">

    .input-container{

        @apply flex gap-1 items-center bg-zinc-900 outline-zinc-700 outline-1 outline p-1.5 rounded-xl;

    }

    input{
        @apply p-0 m-0 text-sm bg-transparent focus:outline-none w-full;
    }

</style>