
<script>    

    import { showSubscriptionModal } from "$lib/main/store"
    import SmokeBg from "./smokeBg.svelte";


</script>


<button on:click={() => {
    $showSubscriptionModal = true
}} class="relative w-full p-3 overflow-hidden text-sm transition-colors bg-black hover:bg-zinc-950 outline-zinc-700 outline-1 outline rounded-2xl">
    <SmokeBg/>
    <div class="relative text-base font-extrabold">Consider Supporting?</div>
    <div class="relative mt-1 font-semibold">Get <b>6 more plots</b> PLUS <b> 8x greater</b> build space, <b>verified badges</b> <img class="w-3.5 aspect-square inline" src="/verified.svg" alt="">, <b>links</b>, and more on <b>ALL</b> plots!</div>
   
</button>