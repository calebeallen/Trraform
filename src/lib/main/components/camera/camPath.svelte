

<script>
    import { BoxGeometry, BufferAttribute, BufferGeometry, CatmullRomCurve3, Group, Line, LineBasicMaterial, MathUtils, Matrix4, Mesh, MeshBasicMaterial, Plane, Points, PointsMaterial, Quaternion, Raycaster, Spherical, Vector2, Vector3, Vector4 } from "three";
    import Point from "./point.svelte";
    import { refs, settings } from "$lib/main/store"
    import { onMount } from "svelte";
    import { NURBSCurve } from "three/examples/jsm/curves/NURBSCurve"


    let points = []

    const curveGeom = new BufferGeometry()
    const curveMat = new LineBasicMaterial({ color: 0xFFFFFF })
    const pointGeom = new BufferGeometry()
    const pointMat = new PointsMaterial({ 
        color: 0xFFFFFF,
        size: 10,
        radius: 10,
        sizeAttenuation: false 
    })
    const boxGeom = new BoxGeometry(1,1,1)
    const boxMat = new MeshBasicMaterial({color: 0xffffff})
    let catmullCurve, frames
    let pointObj
    let sceneObjs = []

    let updateFunction = null
    let lastTime = 0

    
    let boxGroup

    const segss = 300

    onMount(() => {

        const update = time => {

            if(boxGroup){

                for(const b of boxGroup.children){

                    const s = b.position.distanceTo(refs.camera.position) / 100

                    b.scale.set(s,s,s)

                }

            }

            if(updateFunction)

                updateFunction((time - lastTime) / 1000)

            lastTime = time

            requestAnimationFrame(update)

        }

        requestAnimationFrame(update)

    })

    function addPoint(){

        points.push({
            pos: refs.camera.position.clone(),
            fov: 135,
            velocity: 1,
            deleted: false
        })

        points = points

        update()

    }
    function generateUniformKnotVector(degree, numControlPoints) {
        // 'n' is the index of the last control point, so there are (n + 1) control points in total.
        const n = numControlPoints - 1;
        
        // The knot vector length is (n + p + 2), but we use 0-based indexing, so let m = n + p + 1.
        const m = n + degree + 1;
        
        const knotVector = [];

        for (let i = 0; i <= m; i++) {
            if (i <= degree) {
            // First 'degree + 1' knots are 0.
            knotVector.push(0);
            } else if (i >= m - degree) {
            // Last 'degree + 1' knots are 1.
            knotVector.push(1);
            } else {
            // Distribute remaining knots uniformly between 0 and 1.
            knotVector.push((i - degree) / (m - 2 * degree));
            }
        }
        
        return knotVector;
    }

    function update(){

        //delete points
        points = points.filter(p => !p.deleted)

        //clear scene
        for(const obj of sceneObjs)

            refs.scene.remove(obj)

        sceneObjs = []

        //draw points
        const vrts = points.map(p => p.pos)
        // const positions = new Float32Array(points.length * 3); // 3 values per point (x, y, z)
        boxGroup = new Group()

        for(let i = 0; i < vrts.length; i++){

            const mesh = new Mesh(boxGeom, boxMat)
            mesh.position.copy(vrts[i])
            mesh.pointIdx = i
            boxGroup.add(mesh)

        }

        refs.scene.add(boxGroup)
        sceneObjs.push(boxGroup)

        // pointGeom.setAttribute('position', new BufferAttribute(positions, 3));
        // pointGeom.setFromPoints(vrts)
        // pointGeom.attributes.position.needsUpdate = true
        // pointGeom.computeBoundingBox()
        // const pointsObj = pointObj = new Points(pointGeom, pointMat)
        // pointsObj.frustumCulled = false
        // refs.scene.add(pointsObj)
        // sceneObjs.push(pointsObj)
        
        //draw curve

        const degree = 4;
        if(points.length < degree + 1)

            return
            
        const nurbsControlPoints = vrts.map( p => new Vector4(p.x, p.y, p.z, 1) );

        const knots = generateUniformKnotVector(degree, nurbsControlPoints.length);

        catmullCurve = new NURBSCurve(degree, knots, nurbsControlPoints);

        catmullCurve.arcLengthDivisions = 10000;
        const pts = catmullCurve.getPoints( 500 );
        curveGeom.setFromPoints( pts );
        const curveObj = new Line( curveGeom, curveMat );
        curveObj.frustumCulled = false
        sceneObjs.push(curveObj)
        refs.scene.add(curveObj)

    }

    function run(){

        frames = catmullCurve.computeFrenetFrames(segss)

        const initp = catmullCurve.getPoint(0)
        refs.camera.position.copy(initp)
        refs.camera.lookAt(initp.clone().add(catmullCurve.getTangent(0)))
        refs.camera.updateSphere()

        const setCamera = u => {

            const t = Math.min(catmullCurve.getUtoTmapping(u), 1)
            
            //interpolate position and look direction
            const position = catmullCurve.getPoint(t)
            const tangent = catmullCurve.getTangent(t)
            // const binormal = refs.camera.up.clone().cross(tangent).negate()

            tangent.add(position)
            // binormal.add(position)
            // Create new quaternion for smooth transition
            // const newQuaternion = new Quaternion()
            // newQuaternion.setFromUnitVectors(new Vector3(0, 0, -1), tangent.normalize())

            // // Smoothly interpolate rotation using SLERP
            // refs.camera.quaternion.slerp(newQuaternion, 0.1);

            const lookat = new Vector3(71.07187222036504, 68.12406702750273, 100.42262270565995)

            refs.camera.position.copy(position)
            refs.camera.lookAt(lookat)
            refs.camera.updateSphere()

            return t

        }

        // setCamera(0.5)

        for(const obj of sceneObjs)

            refs.scene.remove(obj)

        let timeElapsed = 0

        const ease = t => 1 - (t - 1) ** 2

        const update = dt => {

            let t = setCamera(timeElapsed)
            t *= points.length - 1

            const p0 = points[Math.floor(t)]
            const p1 = points[Math.ceil(t)]
            const r = t % 1
            const r1 = ease(r)

            if(p0 && p1){

            
                const vel = p0.velocity * (1 - r) + p1.velocity * r
                const fov = p0.fov * (1 - r1) + p1.fov * r1

                refs.camera.fov = fov
                refs.camera.updateProjectionMatrix()
                
                timeElapsed += dt * vel / 10
                timeElapsed = Math.min(timeElapsed, 1)

            }

        }

        updateFunction = update

    }

    function cancel(){

        updateFunction = null

        for(const obj of sceneObjs)

            refs.scene.add(obj)

        refs.camera.fov = settings.general.fov

    }

    let origin = null, normal = null, targetBox = null

    const raycaster = new Raycaster()
    raycaster.params.Points.threshold = 1; 
    const mouse = new Vector2()

    function setRayCaster(e){

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, refs.camera);

    }

    function mousedown(e){
        
        if(!boxGroup)

            return

        setRayCaster(e)
        
        const intersects = raycaster.intersectObject(boxGroup, true);

       
        if(intersects.length){
            refs.disabled = true
            origin = intersects[0].object.position.clone()
            targetBox = intersects[0].object
            normal = raycaster.ray.direction.clone()

        }

    }




    function mousemove(e){

        if(normal === null)

            return

        setRayCaster(e)

        const plane = new Plane();
        plane.setFromNormalAndCoplanarPoint(normal, origin);

        const intersectionPoint = new Vector3()
        if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
           
            targetBox.position.copy(intersectionPoint)
            points[targetBox.pointIdx].pos.copy(intersectionPoint)
            update()

        }

    }


    function mouseup(){
        refs.disabled = false

        origin = normal = targetBox = null

    }

</script>

<svelte:window 
    on:mousedown={mousedown}
    on:mousemove={mousemove}
    on:mouseup={mouseup}
/>


<div class="fixed right-0 p-2 mr-2 space-y-1 text-xs -translate-y-1/2 bg-black select-none top-1/2">
    <div class="space-y-1 overflow-y-scroll max-h-96">
        {#each points as point}
            <Point data={point} on:change={update}/>
        {/each}
    </div>
    <button class="w-full bg-zinc-600" on:click={addPoint}>Add Point</button>
    <button class="w-full bg-zinc-600" on:click={run}>Run</button>
    <button class="w-full bg-zinc-600" on:click={cancel}>Cancel</button>
</div>