
<script>

    //TODO

    import "../../main.css"
	import { LinearSRGBColorSpace, Scene, Sphere, Spherical, Vector3, WebGLRenderer } from "three"
    import MobileDetect from "mobile-detect"
	import { onMount } from "svelte"
    import { page } from "$app/stores"
    import { goto } from '$app/navigation';
    import Camera from "$lib/common/camera"
    import Loading from "$lib/common/components/loading.svelte"
    import Notification from "$lib/common/components/notification.svelte";
    import PlotId from "$lib/common/plotId"
    import { isMobileBrowser, insideOf, refs, settings, notification, loadScreenOpacity, showSettingsModal, showHowItWorksModal, leaderboard, showNextStepsModal, showAuthModal, showResetPasswordModal, showSendVerificationEmailModal, user, showUserWidget, modalsShowing, showClaimModal, showShareModal, showReportModal, inputFocused, showChangeUsernameModal, stripe, showCartWidget, paymentSession, cart } from "$lib/main/store"
    import { MAX_DEPTH, API_ORIGIN } from "$lib/common/constants"
    import RootPlot from "$lib/main/plot/rootPlot"
    import { stars } from "$lib/main/decoration"
    import RenderManager from "$lib/main/renderManager"
    import { pushNotification } from "$lib/common/utils"
    import HeaderBar from "$lib/main/components/headerBar.svelte"
    import SettingsModal from "$lib/main/components/modals/settingsModal.svelte";
    import HowItWorksModal from "$lib/main/components/modals/howItWorksModal.svelte"
    import NextStepsModal from "$lib/main/components/modals/nextStepsModal.svelte";
    import AuthModal from "$lib/main/components/modals/authModal.svelte";
    import ResetPasswordModal from "../../lib/main/components/modals/resetPasswordModal.svelte";
    import UserWidget from "../../lib/main/components/userWidget/userWidget.svelte";
    import SendVerificationEmailModal from "../../lib/main/components/modals/sendVerificationEmailModal.svelte";
    import { fly } from "svelte/transition";
    import ClaimModal from "../../lib/main/components/modals/claimModal.svelte";
    import ShareModal from "../../lib/main/components/modals/shareModal/shareModal.svelte";
    import ReportModal from "../../lib/main/components/modals/reportModal.svelte";
    import ChangeUsernameModal from "../../lib/main/components/modals/changeUsernameModal.svelte";
    import { loadStripe } from "@stripe/stripe-js";
    import CartWidget from "../../lib/main/components/cartWidget/cartWidget.svelte";
    import PaymentModal from "../../lib/main/components/modals/paymentModal.svelte";
    import { handleStripeIntent } from "$lib/main/handleStripeIntent"
    
    let rootPlot
    let glCanvas
    let tagContainer
    let t1 = 0
    let tags = {}
    let ismousedown = false
    let leaderboardPlots = []
    let lastTouches = []
    
    onMount(async () => {
        
        const stored = localStorage.getItem("settings")
        if(stored)
            Object.assign(settings, JSON.parse(stored))

        const mobileDetect = new MobileDetect(navigator.userAgent)

        $isMobileBrowser = mobileDetect.mobile()

        /* set up scene */  
        refs.scene = new Scene()
        refs.scene.add(stars())
        refs.camera = new Camera(settings.fov, new Sphere(new Vector3(65,65,65), 800))

        refs.renderer = new WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: true, logarithmicDepthBuffer: true })
        refs.renderer.outputColorSpace = LinearSRGBColorSpace

        resize()

        refs.renderManager = new RenderManager(refs.scene)

        /* root plot */
        rootPlot = new RootPlot()
        refs.rootPlot = rootPlot
        await rootPlot.load()
        await refs.renderManager.renderStatic(rootPlot)

        //set initial position
        refs.camera.position.setFromSphericalCoords(rootPlot.boundingSphere.radius * 2, Math.PI * 0.5, 0).add(rootPlot.boundingSphere.center)
        refs.camera.target.copy(rootPlot.boundingSphere.center)
        refs.camera.lookAt(rootPlot.boundingSphere.center)
        refs.camera.updateSphere()
        refs.camera.update = refs.camera.autoRotate

        // listen for page route change events
        page.subscribe(handleNavigate)

        // get user data
        const authToken = localStorage.getItem("auth_token")

        if(authToken){

            const res = await fetch(`${API_ORIGIN}/user`, {
                headers: { Authorization: authToken }
            })
            const { data, error } = await res.json()
            
            if(!error){
                data.plotIds = data.plotIds.map(plotId => ({ plotId, isNew: false }))
                $user = data
                localStorage.setItem("auth_token", data.token)
                const cartSave = localStorage.getItem("cart")
                if(cartSave !== "null")
                    $cart = JSON.parse(cartSave)
                else
                    $cart = {}

            }

        }


        $stripe = await loadStripe('pk_test_51RCYJGGgpUJInHeUFiJ7rMaDW6ScPPU8Git55wQkr13bAzHOqs0w5yUMRwqXxdTFSgzrelQNXVIV5rXlpAm8mV8500dr0ExiFj')

        /* begin rendering */
        refs.renderer.setAnimationLoop(renderLoop)
        refs.renderer.render(refs.scene, refs.camera)
        updateBg()

        if($page.url.searchParams.get("showLogin") == "true")
            $showAuthModal = true

        // if user was redirected after payment
        const resumePayment = $page.url.searchParams.get("payment_intent_client_secret")
        if(resumePayment)
            handleStripeIntent(resumePayment)

        $loadScreenOpacity = 0

        refreshLeaderboard()
        
    })

    async function refreshLeaderboard(){

        const res = await fetch(`${API_ORIGIN}/leaderboard`)
        const { data } = await res.json()

        const loadPlots = data.map( ({ id }) => {
            const plotId = PlotId.fromHexString(id)
            return loadPlot(plotId)
        })
        
        leaderboardPlots = await Promise.all(loadPlots)
        const lb = []

        for(let i = 0; i < data.length; i++){

            const plot = leaderboardPlots[i]
            const { id, votes, dir } = data[i]
            lb.push({ 
                plotId: id,
                name:  plot.name || `Plot 0x${id}`, 
                verified: plot.verified,
                votes,
                dir
            })

        }

        $leaderboard = lb

    }

    function renderLoop(t2){

        const dt = (t2 - t1) / 1000
        t1 = t2
        
        refs.renderManager.update(dt)
        refs.camera.update(dt)

        if(refs.camera.update === refs.camera.autoRotate){

            const sortedPlots = new Array(leaderboardPlots.length)
            for(let i = 0; i < leaderboardPlots.length; i++){
                const plot = leaderboardPlots[i]
                const dist = plot.boundingSphere.center.distanceTo(refs.camera.position)
                sortedPlots[i] = { plot, dist }
            }

            sortedPlots.sort((a, b) => b.dist - a.dist)

            updateTags(dt, sortedPlots, false)
            refs.renderer.render( refs.scene, refs.camera )
            updateBg()
            return
            
        }
            
        const insideArr = [rootPlot]

        for(let i = 0; i < MAX_DEPTH; i++){

            const last = insideArr[insideArr.length - 1]
            const contains = last.getClosestContains(refs.camera.position, 1)
            if(contains === null)
                break

            insideArr.push(contains)

        }

        let inside = insideArr[insideArr.length - 1]
        
        //handle routing and ui updates if camera in standard update mode (wasd move)
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

        // if the lowest depth plot that camera is inside of has no children, use next depth up for tags and rendering
        if(inside.children.length === 0)
            inside = insideArr[insideArr.length - 2]

        //update speed
        const speedRefs = inside.getKClosest(5, refs.camera.position)
        let distSum = 0
        for(const ref of speedRefs)
            distSum += ref.dist

        distSum /= speedRefs.length
        refs.camera.accelerationMagnitude = distSum * 10

        //get k closest plots
        const plots = inside.getKClosestWithHeuristic(25, refs.camera, 0.5)

        // update scene
        updateTags(dt, plots, true)
        refs.renderer.render( refs.scene, refs.camera )
        updateBg()

        //update tags
        if(plots.length == 0)
            return

        // //render plots
        // const plotIdSet = new Set(plots.map(a => a.plot.id.id))
        // for(let i = plots.length - 1; i >= 0; i--){

        //     if(!refs.renderManager.hasAvailability())
        //         break

        //     refs.renderManager.managedRender(plots[i].plot, refs.camera, plotIdSet)

        // }
    
    }

    function updateTags(dt, plots, attenuate){
        
        dt = dt * 10

        //apply tag count setting
        const n = Math.min(plots.length, settings.tagCount)
        const lb = plots.length - n
        const temp = new Array(n)
        for(let i = lb; i < plots.length; i++)
            temp[i - lb] = plots[i]
        plots = temp

        const plotSet = new Set(plots.map(a => a.plot))
    
        //update tags that no longer exist
        for(const key of Object.keys(tags)){

            const tag = tags[key]
            if(!plotSet.has(tag.plot)){
                tag.t -= dt
                tag.z = 0
            }

            if(tag.t < 0){
                delete tags[key]
                tagContainer.removeChild(tag.elem)
            } else
                updateTag(tag, true)

        }

        let z = 1
        for(const { plot, dist } of plots){

            const key = plot.id.string()
            if(!(key in tags)){

                const elem = document.createElement("button")
                elem.classList.add("plot-tag")
                elem.name = key
                elem.innerText = plot.name || key
                elem.tabIndex = -1
                elem.onclick = handleTagClick
                tagContainer.appendChild(elem)

                tags[key] = {
                    plot, 
                    elem,
                    dist,
                    t: 0,
                    zIndex: 0
                }

            }
            
            const tagData = tags[key]
            tagData.zIndex = z
            tagData.t = Math.min(tagData.t + dt, 1)
            tagData.dist = dist / plot.parent.blockSize
            z++
            updateTag(tags[key], attenuate)

        }

    }

    const quad = t => 1 - (t - 1)**2
    function updateTag({plot, elem, dist, t, zIndex}, attenuate){

        const v4 = plot.tagPosition.clone()
        v4.applyMatrix4(refs.camera.viewMatrix)

        const x = (v4.x / v4.w * 0.5 + 0.5) * window.innerWidth
        const y = (-v4.y / v4.w * 0.5 + 0.5) * window.innerHeight
        const z = v4.z / v4.w

        if (z >= 1) {
            elem.style.transform = `scale(0)`;
            return
        }

        const MIN_SCALE = 0.25
        const MIN_OPACITY = 0.1

        let a = 1 / Math.max(dist, 1)
        let opacity, scale 
        if(attenuate){
            opacity = Math.max(Math.min(a + 0.5, 1), MIN_OPACITY)
            scale = Math.max(Math.min(a, 1), MIN_SCALE) * quad(t) * settings.tagSize / 2
        } else {
            opacity = 1
            scale = quad(t) * settings.tagSize / 5
        }
        
        elem.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
        elem.style.opacity = opacity
        elem.style.zIndex = zIndex

    }

    function handleTagClick(e){

        const plotId = PlotId.fromHexString(e.srcElement.getAttribute("name"))

        //update page route if there was a change
        const plotIdParam = $page.url.searchParams.get("plotId")
        if(!plotIdParam || !PlotId.fromHexString(plotIdParam).equals(plotId.id))
            goto(`/world?plotId=${plotId.string()}`)

    }

    async function handleNavigate(to){

        const route = to.route.id

        //if navigation not in world, or if already inside of plot, return
        if (route === "/(app)") {

            moveToPlot(rootPlot)
            $insideOf = null

        } else if (route === "/(app)/world") {

            const { searchParams } = to.url
            const plotIdParam = searchParams.get("plotId")
            
            if(!plotIdParam)
                return

            let plotId 
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
            const plot = await loadPlot(plotId)

            $insideOf = plot
            moveToPlot(plot)

        }
 

    }

    async function loadPlot(plotId){

        const ids = plotId.split()
        let plot = rootPlot
        
        for(const id of ids){

            if(!plot.children.length)
                break

            plot = plot.children[id - 1] 
            await plot.load()
            await refs.renderManager.render(plot)

        }

        return plot

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

    function resize(){

        refs.renderer.setPixelRatio(window.devicePixelRatio)
        refs.renderer.setSize(window.innerWidth, window.innerHeight, false)

        refs.camera.aspect = window.innerWidth / window.innerHeight
        refs.camera.updateProjectionMatrix()

    }

    /* user interaction */

    function mousedown(){

        ismousedown = true

        if( $page?.route?.id === "/(app)/world" && refs.camera.update === refs.camera.autoRotate )
            refs.camera.update = refs.camera.orbit

    }

    function mousecancel(e){

        ismousedown = false

    }

    function mousemove(e){

        if(ismousedown && (refs.camera.update === refs.camera.orbit || refs.camera.update === refs.camera.standard)){

            refs.camera.angularVelocityDamping = 1e-6
            refs.camera.angularVelocity.theta += - e.movementX / window.innerWidth * settings.sensitivity * 10
            refs.camera.angularVelocity.phi += e.movementY / window.innerHeight * settings.sensitivity * 10

        }

    }

    function keydown(e){

        if($inputFocused || $modalsShowing > 0)
            return

        const key = e.key.toLowerCase()

        if(key === "w" || key === "a" || key === "s" || key === "d"){

            if($page?.route?.id !== "/(app)/world")
                goto("/world")

            refs.camera.update = refs.camera.standard

        }

        switch(key){

            case "w":

                refs.camera.forward = true
                break

            case "s":

                refs.camera.backward = true
                break

            case "d":

                refs.camera.right = true
                break

            case "a":

                refs.camera.left = true
                break
            
            case "shift":   
                
                refs.camera.accelerationMultiplier = 4
                break

        }

    }

    function keyup(e){

        const key = e.key.toLowerCase()

        switch(key){

            case "w":

                refs.camera.forward = false
                break

            case "s":

                refs.camera.backward = false
                break

            case "d":

                refs.camera.right = false
                break

            case "a":

                refs.camera.left = false
                break

            case "shift":

                refs.camera.accelerationMultiplier = 1
                break

        }

    }

    function cancelKeyEvent(){

        if(refs.camera){

            refs.camera.forward = refs.camera.backward = refs.camera.right = refs.camera.left = false
            refs.camera.accelerationMultiplier = 1

        }

    }

    function mousewheel(e){

        if( $inputFocused || $modalsShowing > 0  )

            return

        if(refs.camera.update === refs.camera.autoRotate)

            refs.camera.update = refs.camera.orbit

        refs.camera.scrollVelocity -= e.deltaY / 100

    }

    function touchevent(e){ 

        if( $inputFocused || $modalsShowing > 0 || refs.camera.update === refs.camera.standard )

            return

        refs.camera.update = refs.camera.orbit

        const { touches } = e

        if(lastTouches.length === 1){

            const lastTouch = lastTouches[0]

            //there may be multiple new touches, but they will be new touch events if last touches has length is 1
            for(const touch of touches){

                if(touch.identifier === lastTouch.identifier){

                    const touchPos = { x: touch.clientX, y: touch.clientY }
                    const lastTouchPos = { x: lastTouch.clientX, y: lastTouch.clientY }

                    const dx = touchPos.x - lastTouchPos.x
                    const dy = touchPos.y - lastTouchPos.y

                    const { route } = $page

                    if( route?.id === "/(app)/[id]" && refs.camera.update === refs.camera.autoRotate)

                        refs.camera.update = refs.camera.orbit

                    refs.camera.angularVelocityDamping = 1e-6
                    refs.camera.angularVelocity.theta += - dx / window.innerWidth * Math.PI * 20
                    refs.camera.angularVelocity.phi += dy / window.innerHeight * Math.PI * 20

                }

            }

        } else if (lastTouches.length === 2) {

            let sameTouches = 0

            for(const lastTouch of lastTouches)
            for(const touch of touches)

                if(touch.identifier == lastTouch.identifier)

                    sameTouches++

            if(sameTouches === 2){

                const len1 = Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY)
                const len2 = Math.hypot(lastTouches[1].clientX - lastTouches[0].clientX, lastTouches[1].clientY - lastTouches[0].clientY)

                refs.camera.scrollVelocity -= (len2 - len1) / 10

            }

        }

        lastTouches = touches

    }

    function focusin(e){

        if (e.target.matches('input[type="text"], textarea'))
            $inputFocused = true

    }

    function focusout(e){

        if (e.target.matches('input[type="text"], textarea'))
            $inputFocused = false

    }

</script>

<svelte:document
    on:keydown={keydown}
    on:keyup={keyup}
/>

<svelte:window 
    on:resize={resize} 
    on:mouseup={mousecancel} 
    on:mouseleave={mousecancel}
    on:blur={() => { mousecancel(); cancelKeyEvent() }}
    on:contextmenu={() => { mousecancel(); cancelKeyEvent() }}
    on:visibilitychange={() => { mousecancel(); cancelKeyEvent() }}
    on:focusin={focusin}
    on:focusout={focusout}
/>

<canvas bind:this={glCanvas} class="fixed top-0 left-0 w-screen h-screen" style="will-change: background;"></canvas>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    bind:this={tagContainer} 
    on:mousedown={mousedown} 
    on:mousemove={mousemove}
    on:touchstart|passive={touchevent} 
    on:touchmove|passive={touchevent} 
    on:touchend|passive={touchevent} 
    on:mousewheel|passive={mousewheel} 
    class="fixed top-0 left-0 w-screen h-screen select-none">
</div>

<slot/>

<div class="fixed top-0 right-0 flex items-center justify-between w-full p-2 pointer-events-none">
    <a class="flex-shrink-0 w-6 m-2 opacity-50 pointer-events-auto select-none sm:w-7 aspect-square focus:outline-none" href="/">
        <img src="/logo.svg" alt="">
    </a>
    <HeaderBar/>
</div>
{#if $showUserWidget}
    <div transition:fly={{ x: 600, opacity: 1 }} class="widget-container">
        <UserWidget/>
    </div>
{/if}

{#if $showCartWidget}
    <div transition:fly={{ x: 600, opacity: 1 }} class="widget-container">
        <CartWidget/>
    </div>
{/if}

<!-- Modals -->
{#if $showClaimModal}
    <ClaimModal on:close={() => $showClaimModal = false}/>
{/if}

{#if $showShareModal}
    <ShareModal on:close={() => $showShareModal = false}/>
{/if}

{#if $showReportModal}
    <ReportModal on:close={() => $showReportModal = false}/>
{/if}

{#if $showSettingsModal}
    <SettingsModal on:close={() => $showSettingsModal = false}/>
{/if}

{#if $showHowItWorksModal}
    <HowItWorksModal on:close={() => $showHowItWorksModal = false}/>
{/if}

{#if $showNextStepsModal}
    <NextStepsModal on:close={() => $showNextStepsModal = false}/>
{/if}

{#if $showAuthModal}
    <AuthModal on:close={() => $showAuthModal = false}/>
{/if}

{#if $showSendVerificationEmailModal}
    <SendVerificationEmailModal on:close={() => $showSendVerificationEmailModal = false}/>
{/if}

{#if $showResetPasswordModal}
    <ResetPasswordModal on:close={() => $showResetPasswordModal = false}/>
{/if}

{#if $showChangeUsernameModal}
    <ChangeUsernameModal on:close={() => $showChangeUsernameModal = false}/>
{/if}

{#if $paymentSession}
    <PaymentModal/>
{/if}   

{#if $loadScreenOpacity !== 0}
    <Loading bind:opacity={$loadScreenOpacity}/>
{/if}
        
<Notification store={notification}/>


<style lang="postcss">

    :global(.plot-tag) {
        @apply absolute px-1 py-0.5 bg-zinc-900 rounded-lg text-sm;
    }
    
    .widget-container{

        @apply fixed sm:h-[calc(100%-68px)] h-[calc(100%-66px)] pointer-events-none top-14 sm:mt-1 right-0 px-2
    
    }

</style>
