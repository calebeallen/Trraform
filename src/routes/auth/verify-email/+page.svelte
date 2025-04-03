
<script>

    import { onMount } from "svelte";

    let loading = true
    let message = ""

    onMount(() => {

        //testing
        message = "Email Verified!"
        setTimeout(() => loading = false, 1000)

    })

</script>

<div>
    <h1 class="text-2xl font-semibold">{message}</h1>
    <a href="/?showLogin=true" class="block w-full mt-4 button0">Home</a>
</div>
