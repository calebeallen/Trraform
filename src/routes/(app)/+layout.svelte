
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
    import { isMobileBrowser, insideOf, refs, settings, notification, loadScreenOpacity, myPlots } from "$lib/main/store"
    import RootPlot from "$lib/main/plot/rootPlot"
    import MaxHeap from "$lib/main/structures/maxHeap"
    import { stars } from "$lib/main/decoration"
    import RenderManager from "$lib/main/renderManager"
    import { pushNotification } from "$lib/common/utils"
    import MyPlot from "$lib/main/plot/myPlot"
    import CamPath from "$lib/main/components/camera/camPath.svelte";

    let rootPlot
    let canvasContainer, glCanvas, tagCanvas, tagCtx
    let t1 = 0
    let tagData = [], tags = {}, tagBounds = []
    let ismousedown = false

    const pids = ["0x07214a", "0x06214a", "0x05214a", "0x04214a", "0x03214a", "0x02214a", "0x01214a", "0x072148", "0x062148", "0x052148", "0x042148", "0x032148", "0x022148", "0x012148", "0x213b", "0x2148", "0x2149", "0x214a", "0x010123f2", "0x0823f2","0x0523f2","0x0223f2","0x0123f2", "0x09249f", "0x08249f", "0x07249f", "0x06249f", "0x05249f", "0x04249f","0x03249f", "0x02249f", "0x01249f", "0x249f", "0x23d3", "0x0a0722b6", "0x090722b6", "0x040722b6", "0x030722b6", "0x020722b6", "0x010722b6", "0x080722b6", "0x070722b6", "0x060722b6", "0x050722b6", "0x0722b6", "0x1422b6", "0x22b6", "0x020622bc", "0x010622bc", "0x0822bc", "0x0722bc", "0x0622bc", "0x0522bc", "0x0422bc", "0x0322bc", "0x0222bc", "0x0122bc", "0x22bc", "0x030122ca", "0x020122ca", "0x010122ca", "0x0122ca", "0x22ca", "0x0e0222ac", "0x22ac", "0x0201249d", "0x0101249d", "0x01249d", "0x249d", "0x0624a0", "0x0524a0", "0x0324a0", "0x0424a0", "0x24a0", "0x050206a2", "0x0506a2", "0x0406a2", "0x0206a2", "0x0106a2", "0x06a2", "0x1013213e","0x0f13213e","0x0e13213e", "0x0d13213e", "0x0c13213e","0x0b13213e","0x0a13213e","0x0913213e","0x0813213e","0x0713213e","0x0613213e","0x0513213e","0x0413213e", "0x0313213e", "0x0213213e", "0x0113213e", "0x13213e", "0x11213e", "0x12213e", "0x213e", "0x011523ee", "0x1523ee", "0x23ee", "0x23ef", "0x050a22c3", "0x040a22c3", "0x020a22c3", "0x030a22c3", "0x170a22c3", "0x160a22c3", "0x150a22c3", "0x140a22c3", "0x130a22c3", "0x120a22c3", "0x110a22c3", "0x100a22c3", "0x0f0a22c3","0x0e0a22c3","0x0d0a22c3","0x0c0a22c3","0x0b0a22c3","0x0a0a22c3","0x090a22c3","0x080a22c3", "0x0a22c3", "0x22c3", "0x22b6", "0x010923e6","0x020923e6","0x030923e6","0x050923e6","0x060923e6","0x070923e6", "0x0923e6","0x0723e6","0x0623e6","0x0423e6","0x0223e6","0x0323e6", "0x23ea", "0x23eb", "0x23e7", "0x23e6", "0x0601213e","0x0501213e","0x0401213e","0x0301213e","0x0201213e","0x0101213e", "0x0b213e","0x0a213e","0x09213e","0x05213e", "0x06213e", "0x07213e", "0x03213e", "0x02213e", "0x01213e", "0x2147", "0x2146", "0x213f", "0x22b9", "0x01042125", "0x02042125", "0x03042125", "0x04042125", "0x05042125", "0x06042125", "0x09042125", "0x08042125", "0x07042125", "0x122125", "0x112125", "0x102125", "0x0f2125", "0x0e2125", "0x0d2125", "0x0c2125", "0x0b2125", "0x0a2125", "0x092125", "0x082125", "0x072125", "0x062125", "0x052125", "0x042125", "0x032125", "0x022125", "0x012125", "0x2133", "0x2132", "0x2131", "0x2124", "0x2125", "0x2126", "0x2119", "0x211a", "0x211b", "0x010323f1", "0x0923f1","0x0823f1","0x0723f1","0x0623f1","0x0523f1","0x0423f1","0x0323f1","0x0223f1","0x0123f1","0x23f1","0x030222c3", "0x020222c3", "0x010222c3", "0x0922c3", "0x0822c3", "0x0722c3", "0x0622c3", "0x0522c3", "0x0422c3", "0x0322c3", "0x0222c3", "0x0122c3", "0x22c3", "0x0923f6", "0x0a23f6", "0x0b23f6", "0x0c23f6", "0x0f23f6", "0x0523f6", "0x0623f6", "0x0723f6", "0x0823f6", "0x0e23f6", "0x0123f6", "0x0223f6", "0x0d23f6", "0x0423f6", "0x0323f6", "0x23f6", "0x060523f2", "0x090523f2", "0x070523f2", "0x080523f2", "0x110523f2", "0x120523f2", "0x130523f2", "0x140523f2","0x150523f2", "0x160523f2", "0x23f2", "0x0c0422c9", "0x0a0422c9", "0x070422c9", "0x040422c9", "0x050422c9", "0x060422c9", "0x0822c9","0x0722c9", "0x0622c9","0x0522c9", "0x0422c9", "0x0322c9", "0x0122c9","0x0222c9", "0x090222c0", "0x080222c0", "0x070222c0", "0x010222c0", "0x020222c0", "0x030222c0", "0x060222c0", "0x050222c0", "0x040222c0", "0x0222c0", "0x0122c0", "0x22c0","0x22c1","0x22c9","0x22ca","0x22bb", "0x22bc", "0x010923ee", "0x0723ee", "0x0823ee", "0x0923ee", "0x0a23ee", "0x0523ee", "0x0623ee","0x0123ee","0x0223ee","0x0323ee","0x0423ee", "0x23ee", "0x0124a0", "0x0224a0","0x010124a0"]
    const pidSet = new Set(pids.map(hexStr => parseInt(hexStr, 16)))

    onMount(async () => {

        // document.body.style.cursor = "none";

        // const pids = ["22d4","22d3","22d6","22d5","0x0a22d6","0x0b22d6", "0x0122d6", "0x0222d6", "0x0522d6", "0x0d22d6", "0x0f22d6", "0x1022d6", "0x0622d3","0x23fc","0x0c22d6","0x0322d5","0x0222d5","0x0122d5","0x040122d5","0x0822d6","0x0422d6","0x0322d6","0x0722d6","0x1422d6","0x1322d6","0x1122d6","0x1222d6","0x0622d6","0x0b0322d5","0x0c0322d5","0x0d0322d5","0x070322d5","0x050322d5","0x090322d5","0x010322d5","0x030322d5","0x0e0322d5","0x100322d5","0x110322d5"]

        for(const pid of pids.slice(0,16)){

            const plotId = PlotId.fromHexString(pid)
            $myPlots.push(new MyPlot(plotId))

        }
        
        const stored = localStorage.getItem("settings")
        if(stored)

            Object.assign(settings, JSON.parse(stored))

        const mobileDetect = new MobileDetect(navigator.userAgent)

        $isMobileBrowser = mobileDetect.mobile()

        if($isMobileBrowser)

            pushNotification(notification, "Mobile browser detected", "For the best experience, please use a desktop browser.")

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

                if($insideOf !== null)
                
                    $insideOf = null
            
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

        refs.camera.accelerationMagnitude /= 2

        // const tar = new Vector3(69.474807189635, 69.90804980933032, 94.52555655544064)
        // refs.camera.accelerationMagnitude = refs.camera.position.distanceTo(tar) * 3

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

            if(pidSet.has(needsRender[i].plot.id.id))

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
            $insideOf = null

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
                
                pushNotification(notification, "Plot not found", `Plot "${plotIdParam}" does not exist.`)
                return 

            }

            // if already inside plot or plot id is 0
            if($insideOf !== null && plotId.equals($insideOf.id))

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

        const { width, height } = canvasContainer.getBoundingClientRect()

        tagCtx.textAlign = "center"
        tagCtx.textBaseline = "middle"
        tagCtx.clearRect(0, 0, width, height)

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
                x: (v4.x / v4.w + 1) / 2 * width, 
                y: (1 - (v4.y / v4.w + 1) / 2) * height, 
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

            // const { clientX, clientY } = e
            // const midX = - clientX / window.innerWidth + 0.5
            // const midY = clientY / window.innerHeight - 0.5
            
            // refs.camera.mouseVect.set(midX, midY).multiplyScalar(1000)

            refs.camera.angularVelocityDamping = 1e-4
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

<CamPath/>

<Notification store={notification}/>
