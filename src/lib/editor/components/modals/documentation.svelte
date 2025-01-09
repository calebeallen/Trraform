
<script>

    import Modal from "./modal.svelte"
    import { DiscordSVG } from "@packages/ui";

</script>

<Modal header="Documentation" addedClasses="max-w-screen-lg" on:close>
    <div class="px-4 flex flex-col gap-3 overflow-y-scroll max-h-[calc(100vh-200px)]">
        <h2>Camera Controls</h2>
        <section>
            <h3>Rotate Camera</h3>
            <p>Click and drag with the <span class="highlight">left mouse button</span> on the camera controller (top right) to pivot around the center of the grid. To pivot around a specific point, click on the point while holding <span class="highlight">Shift</span> and dragging your mouse.</p>
            <h3>Pan Camera</h3>
            <p>Click and drag with the <span class="highlight">right mouse button</span> on the camera controller to pan the camera. To pan from a specific point, click on the point while holding <span class="highlight">Ctrl</span> and dragging your mouse.</p>
            <h3>Zoom</h3>
            <p>Scroll to zoom in and out. You can position your cursor to determine the focal point of the zoom.</p>
        </section>
        <h2>3D Model Conversion (Beta)</h2>
        <section>
            <p>You can import 3D models in the GLB format and use our converter tool to resize and reposition your model before transforming it into blocks. This feature is currently in beta, so if you encounter any issues, we’d greatly appreciate your bug reports via Discord.</p>
            <p>If your 3D model isn’t in GLB format, we recommend using a tool like <a class="font-semibold" target="_blank" href="https://www.blender.org">Blender</a> for conversion. Simply import your file into Blender and export it as a .glb. Ensure that textures are included in the exported file.</p>
            <p>For models relying on lighting effects, <b>you’ll need to bake those effects into the model’s textures</b>, as our converter currently does not compute lighting and will remove any lighting information from the file. Blender can also be used to bake lighting effects into textures before conversion.</p>
        </section>
        <h2>Block Panel</h2>
        <section>
            <span class="text-sm text-zinc-200">Click the cube icon at the bottom of the toolbar to expand the block panel. You can drag it to a different position if you'd like.</span>
            <h3>Size Parameter <span class="font-normal highlight">&lt;size&gt;</span></h3>
            <p>The radius of affected blocks for actions such as placing, deleting, painting, and selecting.</p>
            <h3>Type Parameter (Cube)</h3>
            <p>Actions like placing, deleting, painting, and selecting will affect blocks within a cube-shaped volume with radius of <span class="highlight">&lt;size&gt;</span>.</p>
            <h3>Type Parameter (Sphere)</h3>
            <p>Actions such as placing, deleting, painting, and selecting will affect blocks within a spherical volume with radius of <span class="highlight">&lt;size&gt;</span>.</p>
            <h3>Type Parameter (Subplot)</h3>
            <p>You can choose where subplots are positioned by manually placing them anywhere within your build. When you upload your build to a plot, subplots will automatically be repositioned to these spots. Any subplot not manually placed will be given a default position.</p>
            <div class="documentation-tip">
                <h3>Tip</h3>
                <p>You can leverage manual plot placement to build some really cool, intricate, and collaborative builds that span over multiple plots.</p>
            </div>
            <div class="documentation-note">
                <h3>Note</h3>
                <p>You can determine the plot id of a subplot by appending the subplot's subscript (found on the block panel) with the plot id of the plot you upload the build to. For example, if you place the subplot with the subscript 0x02 in your build, then upload your build to plot 0x1A2B, the resulting id of that subplot will be 0x021A2B.</p>
            </div>
        </section>
        <h2>Toolbar: Tools</h2>
        <section>
            <h3>New Build</h3>
            <p>Clear your current build and start fresh or import a .trra build file from your computer. When creating a new build, you can choose a grid size from 6x6x6 up to 64x64x64 blocks.</p>
            <div class="documentation-note">
                <h3>Note</h3>
                <p>There are size constraints for what builds can be uploaded to certain plots depending on the depth of the plot. Depth 0 plots cannot exceed 32x32x32, depth 1 plots cannot exceed 48x48x48, and depth 2 plots cannot exceed 64x64x64.</p>
            </div>
            <h3>Download</h3>
            <p>You can download your build as a .trra file to either save it for later or to upload it to a plot.</p>
            <h3>Import</h3>
            <p>Importing files with this tool will insert them into your current build. It will not clear your build in the same way importing from the New Build tool will. You can upload .trra or .glb files.</p>
            <div class="documentation-tip">
                <h3>Tip</h3>
                <p>You can drag and drop files anywhere to import them into your build.</p>
            </div>
            <h3>Undo</h3>
            <p>Keyboard shortcut <span class="highlight">Ctrl + Z</span>.</p>
            <h3>Redo</h3>
            <p>Keyboard shortcut <span class="highlight">Ctrl + Shift + Z</span>.</p>
        </section>
        <h2>Toolbar: Modes</h2>
        <section>
            <h3>Place</h3>
            <p>The mode for placing blocks. It is not an explicit option on the toolbar, but is the default mode when no other mode is selected.</p>
            <p><b>With Overlap On:</b> Placed blocks will replace any existing blocks occupying the same positions.</p>
            <h3>Delete</h3>
            <p><b>With Color Select On:</b> Blocks within the affected area will be deleted if they match the color of the block that was clicked.</p>
            <p><b>With Object Select On:</b> All blocks connected to the block that was clicked will be deleted.</p>
            <p><b>With Color Select and Object Select On:</b> All blocks connected to and of the same color as the block that was clicked will be deleted.</p>
            <h3>Paint</h3>
            <p>Change the color of existing blocks.</p>
            <p><b>With Color Select On:</b> Blocks within the affected area will be painted if they match the color of the block that was clicked.</p>
            <p><b>With Object Select On:</b> All blocks connected to the block that was clicked will be painted.</p>
            <p><b>With Color Select and Object Select On:</b> All blocks connected to and of the same color as the block that was clicked will be painted.</p>
            <h3>Select</h3>
            <p>Works in conjunction with the transform tool.</p>
            <p><b>With Color Select On:</b> Blocks within the affected area will be selected if they match the color of the block that was clicked.</p>
            <p><b>With Object Select On:</b> All blocks connected to the block that was clicked will be selected.</p>
            <p><b>With Color Select and Object Select On:</b> All blocks connected to and of the same color as the block that was clicked will be selected.</p>
            <h3>Transform</h3>
            <p>Translate, rotate, or duplicate selected blocks.</p>
            <p><b>With Overlap On:</b> Duplicating or confirming a transformed structure will replace any existing blocks that overlap with the structure.</p>
        </section>
        <a href="/" class="mx-auto documentation-note">
            <h2>Have Questions? Feel free to ask on our Discord!</h2>
            <div class="w-8 h-8 mx-auto">
                <DiscordSVG/>
            </div>
        </a>
    </div>
</Modal>

<style>

    h2 {

        @apply font-bold;

    }

    h3 {

        @apply font-bold text-sm;

    }

    p {

        @apply text-sm ml-2 text-zinc-200;

    }
    
    section {

        @apply flex flex-col gap-1 pl-2;

    }

    .documentation-tip {

        @apply my-2 p-2 max-w-max outline outline-1 outline-orange-600 bg-orange-600 bg-opacity-30 rounded-md;

    }

    .documentation-note {

        @apply my-2 p-2 max-w-max outline outline-1 outline-blue-600 bg-blue-600 bg-opacity-30 rounded-md;

    }

    .highlight {

        @apply px-0.5 rounded bg-zinc-400 bg-opacity-30;

    }

</style>
