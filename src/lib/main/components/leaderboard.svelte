
<script>

    import { onMount } from "svelte";
    import PlotId from "$lib/common/plotId"
    import { D0_PLOT_COUNT } from "$lib/common/constants"
    import { fly } from "svelte/transition";

    let leaderboard = null

    onMount( async () => {

        const res = await fetch("http://localhost:8080/leaderboard")
        const { data } = await res.json()
        
        leaderboard = data.map( ({ id, votes }) => {
            const plotId = new PlotId(id)
            return { plotId: plotId.string(), votes: votes.toLocaleString() }
        })

        const remaining = 10 - leaderboard.length
        for(let i = 0; i < remaining; i++){

            const randId = Math.floor(Math.random() * D0_PLOT_COUNT) + 1;
            const plotId = new PlotId(randId)
            leaderboard.push({ plotId: plotId.string(), votes: 0 })
        
        }


    })

</script>

<div transition:fly={ { x: 500, opacity: 1, delay: 50 } } class="p-2.5 bg-zinc-900 space-y-1 outline-1 outline outline-zinc-800 rounded-2xl w-72">
    <div class="font-semibold">🔥Leaderboard🔥</div>
    <div class="flex items-center gap-2 py-1 justify-evenly">
        <div class="flex-1 h-px bg-zinc-600"></div>
        <div class="text-xs text-zinc-400">Ranked by votes</div>
        <div class="flex-1 h-px bg-zinc-600"></div>
    </div>
    <div>
        {#if leaderboard === null}
            {#each new Array(10) as _, i }
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
            {#each leaderboard as { plotId, votes }, i }
                <button class="flex items-center gap-1 p-0.5 text-sm w-full hover:bg-zinc-800 transition-colors rounded-lg focus:outline-none focus:bg-zinc-800">
                    <div class="w-5 font-semibold text-center">
                        {#if i == 0}🥇
                        {:else if i == 1}🥈
                        {:else if i == 2}🥉
                        {:else}{i + 1}.
                        {/if}
                    </div>
                    <div class="flex-1 text-left">Plot {plotId}</div>
                    <div class="px-1 text-right">{votes}</div>
                </button>
            {/each}
        {/if}
    </div>
</div>

<style lang="postcss">



</style>
