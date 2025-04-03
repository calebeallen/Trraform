
<script>

    import "../../main.css"
    import { onMount } from "svelte";
    import Loading from "$lib/common/components/loading.svelte";

    let loading = true
    let message = ""

    onMount(() => {

        //testing
        message = "Email Verified!"
        setTimeout(() => loading = false, 1000)

    })

</script>




<div class="fixed top-0 left-0 flex items-center justify-center w-full h-full p-2 bg-zinc-900">   
    <div>
        <div class="flex gap-2">
            <img src="/logo.svg" alt="" class="w-7 aspect-square">
            <h1 class="text-2xl font-semibold">{message}</h1>
        </div>
        <a href="/?showLogin=true" class="block w-full mt-4 button0">Home</a>
        <a class="flex items-center justify-center gap-1 mt-4 opacity-75" href="https://discord.gg/KGYYePyfuQ" target="_blank">
            <img class="w-5 aspect-square" src="/discord.svg" alt="discord">
            <div class="text-xs sm:text-sm">Having issues?</div>
        </a>
    </div>
</div>


{#if loading}
    <Loading/>
{/if}