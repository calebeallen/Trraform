
<script>

    import { SHOW_DOCUMENTATION } from "$lib/editor/store"
    import Modal from "$lib/common/components/modal.svelte"
    import { createEventDispatcher } from "svelte"

    const dispatch = createEventDispatcher()

    function showDocs(){

        dispatch("close")
        $SHOW_DOCUMENTATION = true

    }

</script>

<Modal class="max-w-lg" header="Trraform Editor" on:close>
    <div class="space-y-3">
        <div class="flex items-center gap-2 justify-evenly">
            <div class="flex-1 h-px bg-zinc-600"></div>
            <div class="text-xs text-zinc-400">Version 1.0</div>
            <div class="flex-1 h-px bg-zinc-600"></div>
        </div>
        <p class="text-sm"><b>Welcome to the Trraform Editor!</b> Here, you can create builds for your plots, or just mess around. We recommend you get started by reviewing the docs.</p>
        <img class="rounded-lg" src="/editor.png" alt="editor preview">
        <div class="flex items-center gap-2 justify-evenly">
            <div class="flex-1 h-px bg-zinc-600"></div>
            <div class="text-xs text-zinc-400">Get Started</div>
            <div class="flex-1 h-px bg-zinc-600"></div>
        </div>
        <div class="space-y-2">
            <button class="option" on:click={showDocs}>
                <span>Read the docs</span>
                <img class="w-5 h-5" src="./arrowRightDown.svg" alt="right arrow down">
            </button>
            <a class="option" target="_blank" href="https://discord.gg/KGYYePyfuQ">
                <span>Join the Discord</span>
                <img class="w-5 h-5" src="./arrowRightDown.svg" alt="right arrow down">
            </a>
        </div>
    </div>
</Modal>

<style>

    .option{

        @apply flex justify-between items-center w-full p-2 outline outline-1 outline-zinc-700 rounded-lg text-sm font-semibold transition-colors bg-black bg-opacity-0 hover:bg-opacity-10;

    }

</style>

