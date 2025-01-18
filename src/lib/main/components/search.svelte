
<script>

    import { fly } from "svelte/transition";
    import { goto } from "$app/navigation"
    import { page } from "$app/stores"
    import { pushNotification } from "$lib/common/utils";
    import { notification, isMobileBrowser } from "$lib/main/store"
    import AvailablePlots from "$lib/main/availablePlots"
    import PlotId from "$lib/common/plotId"

    export let searchFocused = false
    export let options = ["Depth 0", "Depth 1", "Depth 2"]
    export let selectedIndex = 0

    let searchValue

    
    async function search() {

        if(!searchValue)

            return

        try {

            const searchPlotId = PlotId.fromHexString(searchValue)

            if(!searchPlotId.verify())

                throw new Error()

            const plotIdParam = $page.url.searchParams.get("plotId")

            if(!plotIdParam || !searchPlotId.equals(PlotId.fromHexString(plotIdParam)))

                goto(`/world?plotId=${searchPlotId.string()}`)

        } catch(e) {

            console.log(e)
            pushNotification(notification, "Plot not found", `Plot "${searchValue}" does not exist.`)

        }

    }


</script>

<div class="grid grid-flow-col grid-rows-[auto_auto] gap-y-1 gap-x-4 grid-cols-[auto_auto] select-none">
    <h2 class="text-sm font-semibold">Search</h2>
    <div class="flex items-stretch overflow-hidden rounded-lg outline outline-1 outline-zinc-700">
        <input bind:value={searchValue} on:focus={() => searchFocused = true} on:blur={() => searchFocused = false} type="text" placeholder="Plot id" maxlength="10" class="w-32 px-1 py-1 text-sm bg-transparent border-r rounded-none bg-zinc-800 focus:outline-none border-zinc-700">
        <button on:click={search} class="px-1 transition-colors bg-zinc-800 hover:bg-zinc-900 {searchValue ? "pointer-events-auto" : "pointer-events-none"}">
            <img class="w-5 h-5  {searchValue ? "" : "opacity-50"}" src="/navigate.svg" alt="search">
        </button>
    </div>
</div>
