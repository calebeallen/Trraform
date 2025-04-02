
<script>

    export let checked 

</script>

<div class="sm:w-4 w-3.5 aspect-square ">
    <label class="relative flex items-center cursor-pointer">
        <input bind:checked type="checkbox" class="transition-all rounded shadow appearance-none cursor-pointer outline-1 outline peer sm:w-4 w-3.5 aspect-square  hover:shadow-md outline-zinc-700 bg-zinc-800 checked:outline-blue-600 checked:bg-blue-700" id="check"/>
        <span class="absolute text-white transform -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none peer-checked:opacity-100 top-1/2 left-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" stroke-width="1">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
        </span>
    </label>
</div>