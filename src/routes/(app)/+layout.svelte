
<script>

    //TODO
    //Settings
    //if inside of plot while it is popped off of rendered queue, push it to the back of queue
    //update plots
    //add a maximum scroll/ fly distance
    //add mobile controls

    import "../../main.css"
	import { LinearSRGBColorSpace, Scene, Sphere, Spherical, Vector3, Vector4, WebGLRenderer } from "three"
    import MobileDetect from "mobile-detect"
	import { onMount } from "svelte"
    import { page } from "$app/stores"
    import { goto } from '$app/navigation';
    import Camera from "$lib/common/camera"
    import Loading from "$lib/common/components/loading.svelte"
    import Notification from "$lib/common/components/notification.svelte";
    import PlotId from "$lib/common/plotId"
    import { isMobileBrowser, insideOf, refs, settings, notification, loadScreenOpacity } from "$lib/main/store"
    import RootPlot from "$lib/main/plot/rootPlot"
    import MaxHeap from "$lib/main/structures/maxHeap"
    import { stars } from "$lib/main/decoration"
    import RenderManager from "$lib/main/renderManager"
    import { pushNotification } from "$lib/common/utils"

    let rootPlot
    let canvasContainer, glCanvas, tagCanvas, tagCtx
    let t1 = 0
    let tagData = [], tags = {}, tagBounds = []
    let ismousedown = false

    onMount(async () => {
        
        const stored = localStorage.getItem("settings")
        if(stored)

            Object.assign(settings, JSON.parse(stored))

        const mobileDetect = new MobileDetect(navigator.userAgent)

        $isMobileBrowser = mobileDetect.mobile()
    
        /* set up scene */  
        refs.scene = new Scene()
        refs.scene.add(stars())
        refs.camera = new Camera(settings.general.fov, new Sphere(new Vector3(65,65,65), 800))
        
        tagCtx = tagCanvas.getContext("2d")

        refs.renderer = new WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: true, logarithmicDepthBuffer: true })
        refs.renderer.outputColorSpace = LinearSRGBColorSpace

        resize()

        refs.renderManager = new RenderManager(refs.scene)

        /* root plot */
        rootPlot = new RootPlot()
        await rootPlot.load()
        await refs.renderManager.renderStatic(rootPlot)

        //set initial position
        refs.camera.position.setFromSphericalCoords(rootPlot.boundingSphere.radius * 2, Math.PI * 0.5, 0).add(rootPlot.boundingSphere.center)
        refs.camera.target.copy(rootPlot.boundingSphere.center)
        refs.camera.lookAt(rootPlot.boundingSphere.center)
        refs.camera.updateSphere()
        refs.camera.update = refs.camera.autoRotate

        $insideOf = rootPlot

        // //listen for page route change events
        page.subscribe(handleNavigate)

        /* begin rendering */
        refs.renderer.setAnimationLoop(renderLoop)
        refs.renderer.render(refs.scene, refs.camera)
        updateBg()

        $loadScreenOpacity = 0

    })


    function renderLoop(t2){

        const dt = (t2 - t1) / 1000
        t1 = t2

        const route = $page.route.id
        if(route !== "/(app)/world" && route !== "/(app)")

            return
        
        refs.renderManager.update(dt)
        refs.camera.update(dt)
            
        const insideArr = [rootPlot]

        //find a plot that contains the camera
        while(true){

            const l = insideArr.length - 1

            //get child plots that contains camera
            const insideOf = insideArr[l].getContains(refs.camera.position)

            let minDist = Infinity
            let closest = null

            for(let i = 0; i < insideOf.length; i++){

                const dist = insideOf[i].sphere.center.distanceToSquared(refs.camera.position)

                if(dist < minDist){

                    minDist = dist
                    closest = insideOf[i]

                }

            }

            if(closest === null)

                break

            insideArr.push(closest)

        }

        //by default, camera is inside the smallest plot of all that contain it
        let inside = insideArr[insideArr.length - 1]

        //handle routing if camera in standard update mode (wasd move)
        if(refs.camera.update === refs.camera.standard){

            if(inside instanceof RootPlot){

                if($insideOf !== rootPlot)
                
                    $insideOf = rootPlot
            
            } else {

                if(inside !== $insideOf){
                
                    $insideOf = inside   

                    //update page route if there was a change
                    const plotIdParam = $page.url.searchParams.get("plotId")

                    if(!plotIdParam || !PlotId.fromHexString(plotIdParam).equals(inside.id))

                        goto(`/world?plotId=${inside.id.string()}`)

                }
            
            }
            
        }

        //if the lowest depth plot that camera is inside of has no children, use next depth up for tags and loading
        if(!inside.children.length && insideArr.length && !inside.minted)
        
            inside = insideArr[insideArr.length - 2]

        //update camera speed
        const heap = new MaxHeap()
        inside.getKClosest(refs.camera.position, 3, heap)

        //average of closest plots
        if(heap.length > 0){

            let distSum = 0

            for(const elem of heap)

                distSum += elem.dist

            refs.camera.accelerationMagnitude = distSum / heap.length * 10

        } else {

            refs.camera.accelerationMagnitude = inside.blockSize * 150

        }

        //update tags
        const r = 15 * inside.blockSize
        const plots = inside instanceof RootPlot ? inside.withinRadius(refs.camera.position, r) : inside.withinView()
        const needsRender = new Array(plots.length)

        for(let i = 0; i < plots.length; i++)

            needsRender[i] = {
                plot : plots[i],
                dist : refs.camera.position.distanceTo(plots[i].pos)
            }

        //sort by closest to camera
        needsRender.sort((a, b) => a.dist - b.dist)

        //set tags, compute distance to look direction projected on sphere
        const len = Math.min(needsRender.length, settings.general.maxTags)
        const target = new Vector3()
        refs.camera.getWorldDirection(target)
        target.multiplyScalar(r).add(refs.camera.position)

        tagData = new Array(len)

        const a = 0.7, b = 0.3
        for(let i = 0; i < needsRender.length; i++){

            needsRender[i].dist = needsRender[i].dist * a + target.distanceTo(needsRender[i].plot.pos) * b
        
            if(i < len)

                tagData[i] = needsRender[i].plot

        }

        //sort by closest to look direction projection
        needsRender.sort((a, b) => a.dist - b.dist)

        //render plots
        for(let i = 0; i < needsRender.length; i++){

            if(!refs.renderManager.hasAvailablility())

                break

            if(inside instanceof RootPlot)

                refs.renderManager.render(needsRender[i].plot)

            else if(needsRender[i].plot.pos.distanceTo(refs.camera.position) <= r)
            
                refs.renderManager.render(needsRender[i].plot)

        }

        updateTags(dt)
        updateBg()

        /* render scene */
        refs.renderer.render( refs.scene, refs.camera )

    }

    async function handleNavigate(to){

        const route = to.route.id

        //if navigation not in world, or if already inside of plot, return
        if (route === "/(app)") {

            moveToPlot(rootPlot)
            $insideOf = rootPlot

        } else if (route === "/(app)/world") {

            const { searchParams } = to.url
            const cameraParam = searchParams.get("camera")

            if(cameraParam){

                refs.camera.setFromB64URI(cameraParam)
                refs.camera.update = refs.camera.standard
                return

            }


            const plotIdParam = searchParams.get("plotId")
            let plotId 

            if(!plotIdParam)

                return

            try { 

                plotId = PlotId.fromHexString(plotIdParam) 

            } catch { 
                
                pushNotification(notification, "Invalid plot id", `Plot "${plotIdParam}" does not exist.`)
                return 

            }

            // if already inside plot or plot id is 0
            if(plotId.equals($insideOf?.id))

                return

            /* load plot */
            //check that plot exist
            const ids = plotId.split()
            let plot = rootPlot

            for(const id of ids){

                await plot.load()
                await refs.renderManager.render(plot)

                if(!plot.children.length)

                    break

                plot = plot.children[id - 1] 
    
            }

            $insideOf = plot
            moveToPlot(plot)

        }
 

    }

    function moveToPlot(plot) {
        
        if(plot instanceof RootPlot){

            const center = plot.boundingSphere.center
            const v1 = refs.camera.position.clone().sub(center)

            const s1 = new Spherical().setFromVector3(v1)
            const s2 = new Spherical(plot.boundingSphere.radius * 2, Math.PI * 0.5, s1.theta)

            refs.camera.moveTo(s1, s2, center, center, refs.camera.autoRotate, 1, 6)

        } else {

            const parentSphere = plot.parent.boundingSphere
            const childSphere = plot.boundingSphere

            //get vectors relative to parent plot center
            const v1 = refs.camera.position.clone().sub(parentSphere.center)
            const v2 = childSphere.center.clone().sub(parentSphere.center)
            const v3 = childSphere.center.clone().sub(refs.camera.position)

            //adjust v2 so that it is on the surface of the child bounding sphere
            const s = new Spherical().setFromVector3(v3.negate())
            s.radius = childSphere.radius * 1.5
            s.phi = Math.PI * 0.4
            v2.add(new Vector3().setFromSpherical(s))

            const s1 = new Spherical().setFromVector3(v1)
            const s2 = new Spherical().setFromVector3(v2)

            let timeScale = plot.parent.blockSize / v3.length() * 10

            timeScale = timeScale < 0.9 ? 0.9 : timeScale > 3 ? 3 : timeScale

            refs.camera.moveTo(s1, s2, parentSphere.center, childSphere.center, refs.camera.orbit, timeScale)

        }

    }

    function updateBg(){

        if(!glCanvas.style)

            return
        
        const t = refs.camera.sphere.phi / Math.PI

        glCanvas.style.background = `linear-gradient(to top, rgba(26, 36, 66, ${t}), rgba(26, 36, 66, ${t * 0.5}))`

    }

    function updateTags(dt){

        const tagDataKeys = new Set()
        const v4 = new Vector4()
        const quad = t => 1 - (t - 1) ** 2

        tagCtx.textAlign = "center"
        tagCtx.textBaseline = "middle"
        tagCtx.clearRect(0, 0, window.innerWidth, window.innerHeight)

        for (let i = 0; i < tagData.length; i++) {

            const plot = tagData[i]
            const id = tagData[i].id.string()

            if(!tags[id])

                tags[id] = { t: 0, plot }

            tagDataKeys.add(id)

        }

        tagBounds = []

        Object.keys(tags).forEach( key => {

            const tag = tags[key]
            const center = tag.plot.boundingSphere.center.clone()

            if(tag.plot.hasGeometry)

                center.add(new Vector3(0,0.8,0).multiplyScalar(tag.plot.boundingSphere.radius))

            const hasKey = tagDataKeys.has(key)

            tag.t += (hasKey ? dt : -dt) * 10

            v4.set(center.x, center.y, center.z, 1) 
            v4.applyMatrix4(refs.camera.viewMatrix)

            let content = tag.plot.name || `Plot ${key}`

            if (content.length > 15)

                content = content.slice(0, 12) + '...'

            const z = v4.z / v4.w

            if(tag.t <= 0 || z > 1){

                delete tags[key]
                return

            }

            tag.t = Math.min(tag.t, 1)

            const dist = refs.camera.position.distanceTo(center)
            
            const fontSize = 12
            const xPadding = 9
            const yPadding = 7
            
            const distRatio = tag.plot.sphere.radius / dist
            let scale = Math.max(distRatio, 0.1) * settings.general.tagSize / 2 * 2
            scale = scale * quad(tag.t)

            tagCtx.font = `${fontSize}px Arial`
            const textMeasure = tagCtx.measureText(content)
            const textHeight = textMeasure.actualBoundingBoxAscent + textMeasure.actualBoundingBoxDescent
            const textYAdjust = (textMeasure.actualBoundingBoxAscent - textMeasure.actualBoundingBoxDescent) / 2;

            tagBounds.push({ 
                
                plot: tag.plot,
                content,
                width2: (textMeasure.width / 2 + xPadding) * scale,
                height2: (textHeight / 2 + yPadding) * scale,
                fontSize: fontSize * scale,
                textYAdjust: textYAdjust * scale,
                a: distRatio * 2,
                x: (v4.x / v4.w + 1) / 2 * window.innerWidth, 
                y: (1 - (v4.y / v4.w + 1) / 2) * window.innerHeight, 
                z
            
            })

        })

        tagBounds.sort((a, b) => b.z - a.z)

        for(const bounds of tagBounds){

            const x = bounds.x
            const y = bounds.y
            const w2 = bounds.width2
            const h2 = bounds.height2
            const fs = bounds.fontSize
            const r = h2 / 1.2
            const a = bounds.a

            tagCtx.beginPath()
            tagCtx.moveTo(x - w2 + r, y + h2)
            tagCtx.lineTo(x + w2 - r, y + h2)
            tagCtx.quadraticCurveTo(x + w2, y + h2, x + w2, y + h2 - r)
            tagCtx.lineTo(x + w2, y - h2 + r)
            tagCtx.quadraticCurveTo(x + w2, y - h2, x + w2 - r, y - h2)
            tagCtx.lineTo(x - w2 + r, y - h2)
            tagCtx.quadraticCurveTo(x - w2, y - h2, x - w2, y - h2 + r)
            tagCtx.lineTo(x - w2, y + h2 - r)
            tagCtx.quadraticCurveTo(x - w2, y + h2, x - w2 + r, y + h2)
            tagCtx.closePath()

            tagCtx.globalAlpha = Math.min(a, 1);
            tagCtx.fillStyle = "#18181b"
            tagCtx.fill()

            tagCtx.globalAlpha = 1;
            tagCtx.fillStyle = "#ffffff"
            tagCtx.font = `normal ${fs}px Arial`
            tagCtx.fillText(bounds.content, x, y + bounds.textYAdjust)

        }
    
    }

    function resize(){

        const { width, height } = canvasContainer.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1

        refs.renderer.setPixelRatio(window.devicePixelRatio)
        refs.renderer.setSize(width, height, false)

        tagCanvas.width = width * dpr
        tagCanvas.height = height * dpr
        
        tagCtx.scale(dpr, dpr)

        refs.camera.aspect = width / height
        refs.camera.updateProjectionMatrix()

    }

    let tagClickedPlot

    function getTagClicked(x, y){

        for(let i = tagBounds.length - 1; i >= 0; i--){
            
            const t = tagBounds[i]

            const xMin = t.x - t.width2
            const xMax = t.x + t.width2
            const yMin = t.y - t.height2
            const yMax = t.y + t.height2

            if(x > xMin && x < xMax && y > yMin && y < yMax)

                return t.plot

        }
        
        return null

    }

    function mousedown(e){

        tagClickedPlot = getTagClicked(e.x, e.y)
        ismousedown = true

        if( $page?.route?.id === "/(app)/world" && refs.camera.update === refs.camera.autoRotate )

            refs.camera.update = refs.camera.orbit

    }

    function mousecancel(e){

        if(tagClickedPlot !== null && tagClickedPlot === getTagClicked(e.x, e.y)){

            if($insideOf !== tagClickedPlot){

                $insideOf = tagClickedPlot
                moveToPlot(tagClickedPlot)

            }

            const searchParam = $page.url.searchParams.get("plotId")

            //push browser state if change
            if(!searchParam || !PlotId.fromHexString(searchParam).equals(tagClickedPlot.id))

                goto(`/world?plotId=${tagClickedPlot.id.string()}`)

        }
            
        tagClickedPlot = null
        ismousedown = false

    }

    function mousemove(e){

        if(refs.disabled)

            return        

        if(ismousedown && (refs.camera.update === refs.camera.orbit || refs.camera.update === refs.camera.standard)){

            refs.camera.angularVelocityDamping = 1e-6
            refs.camera.angularVelocity.theta += - e.movementX / window.innerWidth * Math.PI * settings.general.lookSens
            refs.camera.angularVelocity.phi += e.movementY / window.innerHeight * Math.PI * settings.general.lookSens

        }

    }

</script>

<svelte:window on:resize={resize} on:mouseup={mousecancel} on:mouseleave={mousecancel} on:blur={mousecancel}/>

<div bind:this={canvasContainer} class="fixed top-0 left-0 w-screen h-screen {$page?.route?.id === "/(app)/myplots" ? "blur-xl" : ""}">
    <canvas bind:this={glCanvas} class="absolute top-0 left-0 w-full h-full"></canvas>
    <canvas bind:this={tagCanvas} on:mousedown={mousedown} on:mousemove={mousemove} class="absolute top-0 left-0 w-full h-full"></canvas>
</div>

<slot/>

{#if $loadScreenOpacity !== 0}
    <Loading bind:opacity={$loadScreenOpacity}/>
{/if}

<Notification store={notification}/>
