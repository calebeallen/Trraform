
<script>

    import Modal from "../../common/components/modal.svelte";

</script>

<Modal header="How it works" class="max-w-screen-md" on:close>
    <div class="flex items-center gap-2">
        <div class="space-y-2">
            <section>
                <h1>Explore</h1>
                <p>Fly around and check out what people are building! Explore inside of builds to discover even more builds.</p>
            </section>
            <section>
                <h1>Claim your spot</h1>
                <p>Want to add your creations? Connect a crypto wallet and claim as many plots as you want.</p>
            </section>
            <section>
                <h1>Build something</h1>
                <p>Use the <a class="font-semibold" href="/editor" target="_blank">editor</a> to build anything you want. Place subplots anywhere in your build. When you're finished, upload your build to your plot.</p>
            </section>
            <section>
                <h1>Earn royalties</h1>
                <p>If your plot has subplots (depth 0 and depth 1 plots), we give you 60% of the inital sale of these subplots.</p>
            </section>
            <section>
                <h1>Sell your plot</h1>
                <p>Every plot is a digital asset that can be sold on any marketplace that supports Polygon.</p>
            </section> 
        </div>
        <img class="hidden w-72 sm:block" src="/buildExample.png" alt="">
    </div>
</Modal>

<style lang="postcss">

    h1{
        @apply font-semibold sm:text-base text-sm;
    }

    p{
        @apply sm:text-sm text-xs text-zinc-300;
    }

</style>