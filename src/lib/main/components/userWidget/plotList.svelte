
<script>

    import PlotWidget from "./plotWidget.svelte";
    export let editingPlot

</script>

<div class="grid grid-cols-1 gap-2 p-px mx-auto sm:grid-cols-2 w-max">
    <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
    <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
    <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
    <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
    <PlotWidget bind:editingPlot plot={{}}></PlotWidget>
</div>