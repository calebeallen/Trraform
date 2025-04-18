
<script>

    import Modal from "../../../common/components/modal.svelte";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { modalsShowing, showSubscriptionModal } from "$lib/main/store"

    const dispatch = createEventDispatcher()

    onMount(() => $modalsShowing++)
    onDestroy(() => $modalsShowing--)

</script>

<Modal header="Next steps" class="max-w-sm" on:close>
    <div class="flex flex-col gap-5 mt-2">
        <section>
            <img class="icon" src="/blockGroup.svg" alt="">
            <div>
                <h1>Build</h1>
                <p>Head over to the <a class="font-bold" href="/editor" target="_blank">editor</a> and build something for your new plot. You can also use the editor to place subplots anywhere within your build.</p>
            </div>
        </section>
        <section>
            <img class="icon" src="/pen.svg" alt="">
            <div>
                <h1>Customize your plot</h1>
                <p>Upload your build and give your plot a name, description, and link (for subscription users).</p>
            </div>
        </section>
        <section>
            <img class="icon" src="/share.svg" alt="">
            <div>
                <h1>Share!</h1>
                <p>Share your plot on to show the world what you've built!</p>
            </div>
        </section>
        <button on:click={() => {
            $showSubscriptionModal = true
            dispatch("close")
            }} class="w-full button0">Got it!</button>
    </div>
</Modal>

<style lang="postcss">

    section{

        @apply flex w-full gap-4;

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