

<script>

    import { leaderboard } from "$lib/main/store"
    import { goto } from "$app/navigation"

</script>


<div class="w-full p-3 ml-auto space-y-2 pointer-events-auto max-w-96 rounded-2xl bg-zinc-900 outline-1 outline outline-zinc-800">
    <div class="font-bold">Top plots</div>
    <div class="flex items-center w-full gap-2">
        <div class="w-full h-px bg-zinc-800"></div>
        <div class="flex-shrink-0 text-xs text-zinc-600 w-max">Ranked by votes</div>
        <div class="w-full h-px bg-zinc-800"></div>
    </div>
    {#each $leaderboard as { plotId, name, verified, votes, dir }, i }
        <button on:click={() => goto(`/world?plotId=${plotId}`)} class="flex items-center justify-between w-full p-px text-sm">
            <div class="flex items-center w-full gap-0.5">
                {#if dir == 1}
                    <img class="w-4 aspect-square" src="/up-green.svg" alt="">
                {:else if dir == -1}
                    <img class="w-4 aspect-square" src="/down-red.svg" alt="">
                {:else if dir == 0}
                    <img class="w-4 aspect-square" src="/grey-neutral.svg" alt="">
                {/if}
                <div class="font-semibold truncate w-max max-w-40">{i+1}. {name}</div>
                {#if verified}
                    <img class="w-3.5 aspect-square" src="/verified.svg" alt="">
                {/if}
            </div>
            <div>{votes}</div>
        </button>
    {/each}
</div>

