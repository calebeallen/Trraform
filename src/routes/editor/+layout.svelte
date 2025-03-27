
<script>

    import "../../editor.css";
	import BlockPanel from "$lib/editor/components/blockPanel.svelte"
    import Toolbar from "$lib/editor/components/toolbar.svelte"
    import TransformPanel from "$lib/editor/components/transformPanel.svelte"
    import CameraControls from "$lib/editor/components/cameraControls.svelte"
	import { MODE, NEW_BUILD_MODAL, GRID_SIZING, DOWNLOAD_MODAL, LOADING, NOTIFICATION, SHOW_DOCUMENTATION, SHOW_ONBOARDING_MODAL, BUILD_SIZE } from "$lib/editor/store";
	import NewBuildModal from "$lib/editor/components/modals/newBuildModal.svelte"
    import GridSizing from "$lib/editor/components/gridSizing.svelte"
	import DownloadModal from "$lib/editor/components/modals/downloadModal.svelte"
    import Notification from "$lib/common/components/notification.svelte"
    import Loading from "$lib/common/components/loading.svelte"
    import OnboardingModal from "$lib/editor/components/modals/onboardingModal.svelte";
    import Documentation from "$lib/editor/components/modals/documentation.svelte";
    import GridPosSlider from "$lib/editor/components/gridPosSlider.svelte";
    
</script>

<svelte:head>
            
    <!-- HTML Meta Tags -->
    <title>Trraform Editor</title>
    <meta name="description" content="Trraform Editor version 1.0 out now!">

    <!-- Facebook Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://trraform.com/editor">
    <meta property="og:title" content="Trraform Editor">
    <meta property="og:description" content="Trraform Editor version 1.0 out now!">
    <meta property="og:image" content="https://trraform.com/editor.png">

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta property="twitter:domain" content="trraform.com">
    <meta property="twitter:url" content="https://trraform.com/editor">
    <meta name="twitter:title" content="Trraform Editor">
    <meta name="twitter:description" content="Trraform Editor version 1.0 out now!">
    <meta name="twitter:image" content="https://trraform.com/editor.png">

</svelte:head>

<slot/>
<div class="fixed right-2 bottom-1">
    <a href="https://discord.gg/KGYYePyfuQ" target="_blank" class="relative inline-block mr-1 group">
        <img class="w-6 h-6 opacity-50 group-hover:opacity-70" src="/discord.svg" alt="Discord">
        <div class="absolute right-0 p-0.5 text-xs font-semibold transition-opacity rounded opacity-0 pointer-events-none group-hover:opacity-100 bottom-7 bg-zinc-800">Discord</div>
    </a>
    <button on:click={() => $SHOW_DOCUMENTATION = true} class="relative inline-block group">
        <img class="w-6 h-6 opacity-50 group-hover:opacity-70" src="/book.svg" alt="Book">
        <div class="absolute right-0 p-0.5 text-xs font-semibold transition-opacity rounded opacity-0 pointer-events-none group-hover:opacity-100 bottom-7 bg-zinc-800">Documentation</div>
    </button>
</div>
{#if !$GRID_SIZING}
    <CameraControls/>
    <Toolbar/>
    <GridPosSlider/>
    <div class="fixed text-xs opacity-50 pointer-events-none bottom-2 left-2">
        Build Size: {$BUILD_SIZE}x{$BUILD_SIZE}x{$BUILD_SIZE}
    </div>
    <BlockPanel/>
    {#if $MODE === "transform-object" || $MODE === "transform-glb" || $MODE === "transform-glb-object" || $MODE === "transform-imported-object"}
        <TransformPanel/>
    {/if}
    {#if $NEW_BUILD_MODAL}
        <NewBuildModal/>
    {/if}
    {#if $DOWNLOAD_MODAL}
        <DownloadModal/>
    {/if}
{:else}
    <GridSizing/>
{/if}
<a href="/" target="_self" class="fixed m-2 opacity-50 w-7 h-7 top-2 left-2">
    <img src="/logo.svg" alt="Logo">
</a>

{#if $SHOW_ONBOARDING_MODAL}
    <OnboardingModal on:close={() => $SHOW_ONBOARDING_MODAL = false}/>
{/if}

{#if $SHOW_DOCUMENTATION}
    <Documentation on:close={() => $SHOW_DOCUMENTATION = false}/>
{/if}

{#if $LOADING}
    <Loading/>
{/if}


<Notification store={NOTIFICATION}/>
