

<script>

    import "../../main.css"
    import { onMount } from "svelte";
    import Loading from "$lib/common/components/loading.svelte";
    import { goto } from "$app/navigation"
    import { page } from "$app/stores"
    import isUUID from "validator/lib/isUUID";
    import isEmail from "validator/lib/isEmail";
    import { loadScreenOpacity } from "./store"

    onMount(() => {

        const searchParams = $page.url.searchParams
        const token = decodeURIComponent(searchParams.get("token") || "")
        const email = decodeURIComponent(searchParams.get("email") || "")

        if(!isEmail(email) || !isUUID(token)){
            goto("/")
            return
        }
        
        $loadScreenOpacity = 0

    })

</script>


<div class="fixed top-0 left-0 w-full h-full bg-zinc-900">   
    <div class="absolute w-full -translate-y-1/2 top-1/2">
        <div class="flex justify-center w-full">
            <slot/>
        </div>
        <div class="flex justify-center w-full py-4">
            <a class="flex items-center justify-center gap-1 opacity-75" href="https://discord.gg/KGYYePyfuQ" target="_blank">
                <img class="w-5 aspect-square" src="/discord.svg" alt="discord">
                <div class="text-xs sm:text-sm">Having issues?</div>
            </a>
        </div>
    </div>
</div>

<img class="fixed opacity-50 left-4 top-4 w-7 aspect-square" src="/logo.svg" alt="">

{#if $loadScreenOpacity !== 0}
    <Loading bind:opacity={$loadScreenOpacity}/>
{/if}
        
