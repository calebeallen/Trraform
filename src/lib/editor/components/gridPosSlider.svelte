
<script>

    import Slider from "$lib/common/components/slider.svelte"
    import { GRID_Y_POS, BUILD_SIZE, REFS } from "$lib/editor/store"

    let max = 0

    $:if(REFS.grid){
        max = $BUILD_SIZE - 1
        REFS.grid.position.y = $GRID_Y_POS
    }

</script>

<div class="fixed -rotate-90 translate-x-1/2 right-8 top-1/2 w-96">
    <Slider bind:max={max} bind:value={$GRID_Y_POS} />
</div>
