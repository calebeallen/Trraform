
<script>

    import Modal from "../../common/components/modal.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher()

</script>

<Modal header="How it works" class="max-w-lg" on:close>
    <div class="flex items-center gap-2">
        <div class="space-y-2">
            <section class="flex items-center gap-2">
                <img class="icon" src="/search.svg" alt="">
                <div>
                    <h1>Explore</h1>
                    <p>Fly around and check out what people are building! Each plot can hold a build and up to 24 subplots. There are 3 total nested layers of plots (depth 0 to 2).</p>
                </div>
            </section>
            <section>
                <img class="icon" src="/blockGroup.svg" alt="">
                <div>
                    <h1>Build something</h1>
                    <p>Use the <a class="font-semibold" href="/editor" target="_blank">editor</a> to build anything you want. Place subplots anywhere in your build.</p>
                </div>
            </section>
            <section>
                <img class="icon" src="/flag.svg" alt="">
                <div>
                    <h1>Claim your spot</h1>
                    <p>Connect a crypto wallet to store your plots, claim your favorite spot, then upload your build to it.</p>
                </div>
            </section>
            <section>
                <img class="icon" src="/crown.svg" alt="">
                <div>
                    <h1>Earn royalties</h1>
                    <p>If you plot has subplots and someone claims one, we give you <b class="font-bold text-white">60% of the sale</b>.</p>
                </div>
            </section>
            <section>
                <img class="icon" src="/sell.svg" alt="">
                <div>
                    <h1>Sell your plot</h1>
                    <p>Every plot is a digital asset that can be traded on nearly any crypto marketplace.</p>
                </div>
            </section> 
        </div>
    </div>
    <button on:click={() => dispatch("close")} class="w-full mt-4 button0">Got it!</button>
</Modal>

<style lang="postcss">

    section{

        @apply flex gap-4;

    }

    h1{
        @apply font-semibold sm:text-base text-sm;
    }

    p{
        @apply sm:text-sm text-xs text-zinc-300;
    }

    .icon{
        @apply w-6 aspect-square shrink-0
    }

</style>