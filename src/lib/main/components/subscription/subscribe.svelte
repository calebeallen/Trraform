
<script>
    import { fade, fly } from "svelte/transition";


    import SmokeBg from "./smokeBg.svelte";

</script>


<div transition:fade={{duration: 150}} class="fixed top-0 left-0 grid w-full h-full px-2 overflow-auto bg-black bg-opacity-50 place-items-center">
    <div transition:fly={{duration: 150, y: 50}} class="relative w-full max-w-sm p-5 overflow-hidden bg-black shadow-2xl sm:p-5 shadow-black rounded-3xl">
        <SmokeBg/> 
        <div class="relative space-y-4 font-semibold sm:space-y-5">
            <div class="flex flex-wrap items-end gap-1 sm:gap-2">
                <h1 class="text-3xl font-extrabold w-44 sm:text-4xl sm:w-52">Build More & Stand Out</h1>
                <div class="text-zinc-200"><b class="text-lg sm:text-xl">$4.99</b>/mo</div>
            </div>
            <div class="text-sm sm:text-base">
                <b>Catch eyes</b> and <b>grow</b> your community, store, and/or personal brand with one of the most <b>unique platforms</b> to ever exist.
            </div>
            <ul class="p-4 space-y-3.5 overflow-hidden font-semibold bg-zinc-900 text-zinc-200 rounded-xl outline-fuchsia-400 outline outline-1 sm:text-base text-sm" style="box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.4);">
                <div class="font-extrabold">Here's what you'll get:</div>
                <li>
                    <div>🔥</div>
                    <div>
                        <b>Verified badges</b> <img class="w-3.5 aspect-square" src="/verified.svg" alt="" style=" display: inline; vertical-align: text-baseline;"> on <b>ALL</b> plots!
                    </div>
                </li>
                <li>
                    <div>🔥</div>
                    <div>
                        <b>8x greater</b> max build volume for <b>ALL</b> plots!
                    </div>
                </li>
                <li class="flex items-baseline gap-1">
                    <div class="shrink-0">🔥</div>
                    <div>
                        <b>Add links</b> to your plot profiles!
                    </div>
                </li>
                <li class="flex items-baseline gap-1">
                    <div class="shrink-0">🔥</div>
                    <div>
                        <b>Name tags</b> above <b>ALL</b> plots!
                    </div>
                </li>
                <li class="flex items-baseline gap-1">
                    <div class="pt-px shrink-0">🔥</div>
                    <div>
                        <b>BONUS:</b> One plot credit each month for the next <b>6 months!</b>
                    </div>
                </li>
                <button class="w-full p-2 font-extrabold rounded-lg bg-fuchsia-500">Try it!</button>
                <div class="text-xs font-normal"><a class="font-semibold" href="/terms-of-service" target="_blank">Terms</a> apply, cancel anytime.</div>
            </ul>
        </div>
    </div>
</div>


<style lang="postcss">

    b{
        @apply font-extrabold text-white;
    }

    li{
        @apply flex items-baseline gap-1;
    }

</style>