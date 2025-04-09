
<script>

    import Modal from "$lib/common/components/modal.svelte";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { modalsShowing } from "$lib/main/store"

    const dispatch = createEventDispatcher()

    onMount(() => $modalsShowing++)
    onDestroy(() => $modalsShowing--)

</script>

<Modal header="How it works" class="max-w-lg" on:close>
    <div class="flex flex-col items-center gap-5 mt-2">
        <section class="flex items-center gap-2">
            <img class="icon" src="/search.svg" alt="">
            <div>
                <h1>What is Trraform?</h1>
                <p>Trraform is a communal fractal voxel world where anyone can build and explore. It is one of the most unique spaces for you to show the world anything you want.</p>
            </div>
        </section>
        <section class="flex items-center gap-2">
            <img class="icon" src="/search.svg" alt="">
            <div>
                <h1>Explore</h1>
                <p>Fly around and check out what people are building! Explore inside builds to discover even more builds.</p>
            </div>
        </section>
        <section>
            <img class="icon" src="/flag.svg" alt="">
            <div>
                <h1>Claim your spot</h1>
                <p>Find any open plot and make it yours. Every user can claim 2 plots for free.</p>
            </div>
        </section>
        <section>
            <img class="icon" src="/blockGroup.svg" alt="">
            <div>
                <h1>Build something</h1>
                <p>Use the <a class="font-semibold" href="/editor" target="_blank">Editor</a> to create anything.</p>
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