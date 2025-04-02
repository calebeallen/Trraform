
<script>

    import Modal from "../../../common/components/modal.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher()

</script>

<Modal header="Next steps" class="max-w-lg" on:close>
    <div class="flex flex-col gap-5 mt-2">
        <section class="flex items-center gap-2">
            <img class="icon" src="/blockGroup.svg" alt="">
            <div>
                <h1>Build</h1>
                <p>Head over to the <a class="font-bold" href="/editor" target="_blank">editor</a> and build something for your new plot. You can also use the editor to place subplots anywhere within your build.</p>
            </div>
        </section>
        <section class="flex items-center gap-2">
            <img class="icon" src="/pen.svg" alt="">
            <div>
                <h1>Customize your plot</h1>
                <p>Click the <img class="w-4 aspect-square" src="/plot1.svg" alt="" style=" display: inline; vertical-align: text-center;"> icon in the top right to view your plots. From here you can set your plot's build, name, description, and link.</p>
            </div>
        </section>
        <section class="flex items-center gap-2">
            <img class="icon" src="/share.svg" alt="">
            <div>
                <h1>Share!</h1>
                <p>Share your plot on <img class="w-3 aspect-square" src="/x.svg" alt="" style=" display: inline; vertical-align: text-baseline;"> to show the world what you've built!</p>
            </div>
        </section>
        <button on:click={() => dispatch("close")} class="w-full button0">Got it!</button>
    </div>
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