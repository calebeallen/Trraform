
<script>

    import { onMount, createEventDispatcher } from "svelte";
    import { refs } from "$lib/main/store"

    const dispatch = createEventDispatcher();

    export let data
    let fov, velocity

    onMount(() => {

        fov = data.fov
        velocity = data.velocity

    })

    function setFromCamera(){

        data.pos.copy(refs.camera.position)
        dispatch("change")

    }

    function del(){

        data.deleted = true
        dispatch("change")

    }

    function updateFov(){

        data.fov = fov

    }

    function updateVelocity(){

        data.velocity = velocity
        
    }

</script>

<div class="p-2 space-y-1 bg-zinc-900">
    <div class="flex gap-2">
        <div>FOV</div>
        <input bind:value={fov} on:change={updateFov} type="number">
    </div>
    <div class="flex gap-2">
        <div>Speed</div>
        <input bind:value={velocity} on:change={updateVelocity} type="number">
    </div>
    <button on:click={del} class="w-full bg-zinc-600">Delete</button>
    <button class="w-full bg-zinc-600" on:click={setFromCamera}>Set From Camera</button>
    <button class="w-full bg-zinc-600">Load From Camera</button>
</div>