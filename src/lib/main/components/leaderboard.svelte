
<script>

    import { fly } from "svelte/transition";
    import { leaderboard } from "../store";
    import { goto } from "$app/navigation"

</script>

{#if $leaderboard instanceof Array && $leaderboard.length != 0}
<div transition:fly={ { x: 500, opacity: 1, delay: 50 } } class="p-2.5 bg-zinc-900 space-y-1 outline-1 outline outline-zinc-800 rounded-2xl w-72">
    <div class="font-semibold">🔥Leaderboard🔥</div>
    <div class="flex items-center gap-2 py-1 justify-evenly">
        <div class="flex-1 h-px bg-zinc-600"></div>
        <div class="text-xs text-zinc-400">Ranked by votes</div>
        <div class="flex-1 h-px bg-zinc-600"></div>
    </div>
    <div>
        {#if $leaderboard === null}
            {#each new Array(5) as _, i }
                <div class="flex gap-1 p-0.5 text-sm w-full">
                    <div class="w-5 font-semibold text-center shrink-0">
                        {#if i == 0}🥇
                        {:else if i == 1}🥈
                        {:else if i == 2}🥉
                        {:else}{i + 1}.
                        {/if}
                    </div>
                    <div class="w-full rounded-lg bg-zinc-800 animate-pulse"></div>
                    <div class="w-full"></div>
                    <div class="w-full rounded-lg bg-zinc-800 animate-pulse"></div>
                </div>
            {/each}
        {:else}
            {#each $leaderboard as { name, plotId, votes }, i }
                <button on:click={() => {
                    goto(`/world?plotId=${plotId}`)
                }} class="flex items-center gap-1 p-0.5 text-sm w-full hover:bg-zinc-800 transition-colors rounded-lg focus:outline-none ">
                    <div class="w-5 font-semibold text-center">
                        {#if i == 0}🥇
                        {:else if i == 1}🥈
                        {:else if i == 2}🥉
                        {:else}{i + 1}.
                        {/if}
                    </div>
                    <div class="flex-1 text-left">{name}</div>
                    <div class="px-1 text-right">{votes}</div>
                </button>
            {/each}
        {/if}
    </div>
</div>
{/if}
