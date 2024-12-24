
<script>
    
    import { fade } from "svelte/transition";
    import LogoAnimated from "./logoAnimated.svelte";

    export let opacity = 1

</script>

<div transition:fade class="fixed w-screen h-screen top-0 left-0 bg-black opacity-[{opacity}]">
    <div class="absolute min-w-10 max-w-20 w-[20%] aspect-square left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <LogoAnimated/>
    </div>
</div>