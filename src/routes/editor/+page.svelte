
<script>

    //TODO FOR BETA
    //intro loading animation

    //MAYBE ADD/ADD LATER
    //update mesh with ranges

    import { onMount } from "svelte";
    import { goto } from "$app/navigation"
    import { WebGLRenderer, Scene, Color, LineSegments, MeshBasicMaterial, Vector3, LinearSRGBColorSpace, Vector2, Spherical, Raycaster, Sphere, SRGBColorSpace } from "three";
    import { BUILD_SIZE, COLOR_INDEX, COLOR_SELECT, EYEDROP, GRID_SIZING, MODE, ModifyEvent, OBJECT_SELECT, OVERLAP, REFS, addEvent, LOADING, SHOW_ONBOARDING_MODAL } from "$lib/editor/store";
    import { GridGeometry } from "$lib/editor/geometries/gridGeometry" 
    import Build from "$lib/editor/build"
    import Octree from "$lib/editor/structures/octree"
    import { P2I } from "$lib/common/utils";
    import { EDITOR_VERSION, PLOT_COUNT } from "$lib/common/constants"
    import Camera from "$lib/common/camera"
    import MobileDetect from "mobile-detect";
    import { refs } from "../../lib/main/store";
    
    const raycaster = new Raycaster()

    let canvas, octree, grid

    let t1 = 0

    onMount( () => {
        
        const mobileDetect = new MobileDetect(navigator.userAgent)

        if(mobileDetect.mobile())

            goto("/")

        REFS.renderer = new WebGLRenderer({ 

            canvas,
            logarithmicDepthBuffer: true,
            antialias: true,

        })

        REFS.renderer.outputColorSpace = LinearSRGBColorSpace
        REFS.renderer.autoClear = false
        REFS.renderer.setAnimationLoop(renderloop)

        REFS.camera = new Camera(70, new Sphere(new Vector3(0,0,0), 800))
        REFS.camera.update = REFS.camera.orbit
        REFS.camera.angularVelocityDamping = 1e-11
        REFS.camera.position.setFromSphericalCoords(1, Math.PI * 2/5, Math.PI / 4)
        
        //load last build data
        let save = localStorage.getItem("editorSave")

        REFS.newBuild(save ? save.split(",").map(x => parseInt(x)) : [0,REFS.buildSize])

        window.onresize = resize

        resize()
        
        const lastVersion = localStorage.getItem("lastVersion")

        if(lastVersion !== EDITOR_VERSION){

            localStorage.setItem("lastVersion", EDITOR_VERSION)
            $SHOW_ONBOARDING_MODAL = true

        }

        $LOADING = false

    })

    REFS.newBuild = data => {

        if(REFS.transform)

            REFS.transform.removeFromScene()

        if(REFS.build)

            REFS.build.dispose()

        REFS.scene1 = new Scene()
        REFS.scene1.background = new Color( 0x111111 )

        REFS.scene2 = new Scene()

        REFS.buildSize = data[1]
        $BUILD_SIZE = data[1]
        REFS.build = new Build(data)

        REFS.eventQueue = []
        REFS.eventIndex = -1

        REFS.transform = null

        octree = new Octree( REFS.buildSize, REFS.build.opaque.attributes.position.array, REFS.build.opaque.index.array, REFS.camera )

        const gridGeom = new GridGeometry(REFS.buildSize, 1)
        const gridMat =  new MeshBasicMaterial( { transparent: true, opacity: 0.2 } )
        grid = new LineSegments(gridGeom, gridMat)
        grid.position.set(REFS.buildSize / 2, 0, REFS.buildSize / 2)
        REFS.scene1.add(grid)

        const spherical = new Spherical().setFromVector3(REFS.camera.position)
        spherical.radius = REFS.buildSize * 1.3
        REFS.camera.position.setFromSpherical(spherical).add(grid.position)
        REFS.camera.target.copy(grid.position)
        REFS.camera.lookAt(grid.position)
        REFS.camera.updateSphere()

        $MODE = "place"

    }

    REFS.clearBuild = () => {

        REFS.build.dispose()
        REFS.build = null
        
        if(REFS.transform)

            REFS.transform.removeFromScene()

        REFS.transform = null

        REFS.eventQueue = []
        REFS.eventIndex = -1

    }

    function renderloop(t2){

        const dt = (t2 - t1) / 1000

        if($GRID_SIZING){

            REFS.camera.update(dt)
            REFS.renderer.clear()
            REFS.renderer.render(REFS.gridSizingScene, REFS.camera)

        } else {

            REFS.renderer.clear()
            REFS.renderer.render( REFS.scene1, REFS.camera )
            REFS.build.updatePlotRotation()

            if($MODE === "transform-object" || $MODE === "transform-glb" || $MODE === "transform-glb-object" || $MODE === "transform-imported-object"){

                REFS.renderer.clearDepth()
                REFS.renderer.render( REFS.scene2, REFS.camera )

            } 

            if(REFS.transform)

                REFS.transform.updateControlsScale()

            if(REFS.updateCameraControls)

                REFS.updateCameraControls()

            REFS.camera.update(dt)

        }

        t1 = t2

    }

    function resize(){

        REFS.renderer.setSize(window.innerWidth, window.innerHeight, false)
        REFS.renderer.setPixelRatio(window.devicePixelRatio)

        REFS.camera.aspect = window.innerWidth / window.innerHeight
        
        REFS.camera.updateProjectionMatrix()

    }

    function wheel(e){

        if($GRID_SIZING)

            return

        const x = e.clientX / window.innerWidth * 2 - 1
        const y = 1 - e.clientY / window.innerHeight * 2

        const res = octree.raycast( x, y )

        if(res)

            REFS.camera.target.copy(res.point) 

        REFS.camera.scrollVelocity += -e.deltaY / 100

    }

    /* Mouse Events */

    function mousedown (e) {

        if($GRID_SIZING)

            return

        const x = e.clientX / window.innerWidth * 2 - 1
        const y = 1 - e.clientY / window.innerHeight * 2

        if( REFS.transform && !e.ctrlKey && !e.metaKey && !e.shiftKey && !$EYEDROP )

            REFS.transform.startTransform( new Vector2(x, y) )

        else {

            let res = octree.raycast( x, y )

            if(res){
            
                if(!e.shiftKey && !e.ctrlKey && !e.metaKey)

                    modify( res, e.which )

                REFS.camera.target = res.point

            } else {

                const dir = octree.raycaster.ray.direction.clone()
                const center = new Vector3(1,1,1).multiplyScalar(REFS.buildSize / 2)
                const normal = new Vector3()

                REFS.camera.getWorldDirection(normal)

                REFS.camera.target.copy( dir.multiplyScalar( center.clone().sub( REFS.camera.position ).dot(normal) / dir.dot(normal) ).add( REFS.camera.position ) )

            }

        }

    }

    function mousemove(e){

        if($GRID_SIZING)

            return

        const x = e.clientX / window.innerWidth * 2 - 1
        const y = 1 - e.clientY / window.innerHeight * 2

        if(e.which !== 0 && e.ctrlKey || e.which !== 0 && e.metaKey){

            raycaster.setFromCamera(new Vector2(x,y), REFS.camera)

            const ray = raycaster.ray.direction.clone()
            const normal = new Vector3()
            REFS.camera.getWorldDirection(normal)

            //ray scalar for plane intersection
            const t = REFS.camera.target.clone().sub(REFS.camera.position).dot(normal) / ray.dot(normal)
            const intersection = ray.multiplyScalar(t).add(REFS.camera.position)

            REFS.camera.position.add(REFS.camera.target.clone().sub(intersection))

        }else if(e.which !== 0 && e.shiftKey){

            REFS.camera.angularVelocity.theta += -e.movementX / window.innerWidth * 200
            REFS.camera.angularVelocity.phi += e.movementY / window.innerHeight * 200

        }else if(e.which === 1 && REFS.transform)

            REFS.transform.updateTransform( new Vector2(x, y) )

    }

    function mouseup(){

        if(REFS.transform){

            const evn = REFS.transform.endTransform()

            if(evn !== null)

                addEvent([evn], $MODE)

        }
            
    }

    function modify( res, button ){

        const colorSelect = $COLOR_SELECT
        const overlap = $OVERLAP

        const f = res.face 
        const color = $MODE === "delete" ? 0 : $COLOR_INDEX 

        const target = res.point.clone().addScalar(0.001).floor()
        const position = target.clone()   

        target.x -= f.x > 0 ? 1 : 0
        target.y -= f.y > 0 ? 1 : 0
        target.z -= f.z > 0 ? 1 : 0

        if($EYEDROP){

            const ind = P2I(target, REFS.buildSize)

            if(ind === null)

                return

            if(REFS.build.blocks[ind][0] > PLOT_COUNT){
            
                REFS.setColorFromIndex(REFS.build.blocks[ind][0])

                $EYEDROP = false
            
            }

            return

        }

        position.x -= f.x < 0 ? 1 : 0
        position.y -= f.y < 0 ? 1 : 0
        position.z -= f.z < 0 ? 1 : 0

        const affected = []
        const before = []
        const after = []

        if( color > 0 && color <= PLOT_COUNT ){

            const ind = P2I( position, REFS.buildSize )

            if(ind === null)
            
                return

            const prev = REFS.build.blocks[ind][0]

            if(prev > 0 && prev <= PLOT_COUNT){

                affected.push(ind)
                before.push([ prev, false ])
                after.push([0, false])

                REFS.build.modifyByIndex(ind, 0)

            }else{

                const currentInd = REFS.build.plotIndicies[color - 1]

                //if plot is already placed
                if(currentInd !== -1){

                    affected.push(currentInd)
                    before.push([ color, false ])
                    after.push([0, false])

                }

                affected.push(ind)
                before.push([prev, false])
                after.push([ color, false ])

                REFS.build.modifyByIndex(ind, color)

            }

        } else {
            
            let allAffected
            
            const pos = $MODE === "place" && button !== 3 ? position : target

            const firstInd = P2I( pos, REFS.buildSize )

            if(firstInd === null)

                return

            const first = Array.from(REFS.build.blocks[firstInd])

            if(REFS.diameter === 1 && (!$OBJECT_SELECT || $MODE === "place"))
        
                allAffected = [firstInd]

            else

                allAffected = $OBJECT_SELECT ? getObject(target) : getInRange(res.point.addScalar(0.001)) //get affected block indicies

            if(button === 1) {

                if ($MODE === "place"){

                    for(let i = 0; i < allAffected.length; i++){

                        const _i = allAffected[i]
                        const blk = REFS.build.blocks[_i]

                        if(!overlap){

                            //if no block already here, modify
                            if(blk[0] === 0){

                                affected.push(_i)
                                REFS.build.modifyByIndex( _i, color )

                            }
                            
                        } else if( blk[0] !== color ) { 

                            affected.push(_i)
                            before.push([ blk[0], false ]) //push a copy of block (its color index and select value)
                            REFS.build.modifyByIndex( _i, color )

                        }
                        
                    }

                    //if overlap is false, only blocks with 0 color index will be affected
                    if(!overlap)

                        before.push([ 0, false ])

                    after.push([color, false])

                } else if($MODE === "paint" || $MODE === "delete") {

                    for(let i = 0; i < allAffected.length; i++){

                        const _i = allAffected[i]
                        const blk = REFS.build.blocks[_i]

                        //if block is different and opaque
                        if( blk[0] !== color && blk[1] === 2 ){

                            if( colorSelect && blk[0] !== first[0] )

                                continue

                            affected.push(_i)
                            before.push([ blk[0], false ]) //push a copy of block (its color index and select value)
                            REFS.build.modifyByIndex( _i, color )

                        }

                    }

                    after.push( [ color, false ] )

                } else if($MODE === "select") {

                    for(let i = 0; i < allAffected.length; i++){

                        const _i = allAffected[i]
                        const blk = REFS.build.blocks[_i]

                        //if block exist and is not selected
                        if( blk[0] !== 0 && blk[1] !== 1 ){

                            if( colorSelect && blk[0] !== first[0] )

                                continue

                            affected.push(_i)
                            before.push([ blk[0], false ]) //push a copy of block (its color index and select value)\
                            after.push([ blk[0], true ])

                            REFS.build.modifyByIndex( _i, blk[0], true )

                        }

                    }

                }

            }
            
            if( button === 3 && $MODE === "place" ){

                for(let i = 0; i < allAffected.length; i++){

                    const _i = allAffected[i]
                    const blk = REFS.build.blocks[_i]

                    //if block is different and opaque
                    if( blk[0] !== 0 && blk[1] === 2 ){

                        if( colorSelect && blk[0] !== first[0] )

                            continue

                        affected.push(_i)
                        before.push([ blk[0], false ]) //push a copy of block (its color index and select value)
                        REFS.build.modifyByIndex( _i, 0 )

                    }

                }

                after.push( [ 0, false ] )

            }

        }

        if(affected.length > 0)

            addEvent( [new ModifyEvent(affected, before, after)], $MODE )

        REFS.build.update()

    }

    function getObject(pos){

        const selected = [P2I(pos, REFS.buildSize)]
        const selectedMap = []

        const processNext = (arr) => {

            const nextBlocks = []

            if(arr.length == 0)

                return

            for(var i = 0; i < arr.length; i++){

                for(var z = -1; z <= 1; z++)
                for(var y = -1; y <= 1; y++)
                for(var x = -1; x <= 1; x++){

                    const compPos = new Vector3(x,y,z)
                    compPos.add(arr[i])

                    let index = P2I(compPos, REFS.buildSize)

                    if(index === null)

                        continue

                    const block = REFS.build.blocks[index]

                    if(!selectedMap[index] && block[0] > PLOT_COUNT && block[1] === 2){

                        selectedMap[index] = true
                        selected.push(index)
                        nextBlocks.push(compPos)

                    }

                }

            }

            processNext(nextBlocks)

        }

        selectedMap[P2I(pos, REFS.buildSize).toString()] = true

        processNext([pos])

        return selected

    }

    function getInRange(p){

        const indicies = []

        const r = (REFS.diameter - 1) / 2
        const min = p.clone().subScalar(r).floor().addScalar(0.5)
        const max = p.clone().addScalar(r).ceil().addScalar(0.5)

        for(let y = min.y; y < max.y; y++)
        for(let z = min.z; z < max.z; z++)
        for(let x = min.x; x < max.x; x++){

            const pos = new Vector3(x,y,z)
    
            if(REFS.blockType != 0)
            if(pos.distanceTo(p) > REFS.diameter / 2)

                continue

            const ind = P2I(pos.floor(), REFS.buildSize)

            if(ind === null)

                continue

            indicies.push(ind)
    
        }

        return indicies

    }

    function mousewheel(e){

        if(e.ctrlKey) 
        
            e.preventDefault()

    }
    

</script>

<svelte:window  

    on:mousewheel|nonpassive={mousewheel}
    on:mouseup={mouseup}
    on:mousemove={mousemove}

/>

<canvas bind:this={canvas} on:contextmenu|preventDefault on:mousedown={mousedown} on:wheel|passive={wheel} class="fixed top-0 left-0 w-screen h-screen"></canvas>