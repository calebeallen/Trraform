
<script>

    import { Vector2, Vector3, Raycaster } from "three";
    import { REFS, GRID_Y_POS } from "$lib/editor/store";
	import { onMount } from "svelte";
	import { fly } from "svelte/transition";

    export let s = 100

    let ismousedown = false
    let canvas, ctx
    let lastMousePos = null

    const normal = new Vector3()
    const camPos = new Vector3() //cant be at origin due to depth sorting
    const subVect = new Vector3()
    const up = new Vector3(0,1,0)
    const raycaster = new Raycaster()

    onMount( () => {

        ctx = canvas.getContext("2d")
        ctx.lineWidth = 3
        ctx.font = "bold 9pt arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

    })

    REFS.updateCameraControls = () => {

        if(!REFS.camera)

            return

        const s2 = s / 2
        const offset = s / 10

        const points = []

        REFS.camera.getWorldDirection(normal)

        camPos.copy(normal).multiplyScalar(-1)

        ctx.clearRect(0,0,s,s)

        for(let i = 0; i < 3; i++){

            let point, axis

            switch(i){

                case 0:

                    axis = "X"
                    point = new Vector3(1,0,0)
                    break

                case 1:

                    axis = "Y"
                    point = new Vector3(0,1,0)
                    break

                case 2:    
                
                    axis = "Z"
                    point = new Vector3(0,0,1)
                    break

            }

            point.sub(camPos)

            subVect.copy(point)
            subVect.projectOnVector(normal)
            
            point.add(camPos).sub(subVect)

            const u = normal.clone().cross(up).normalize()
            const v = normal.clone().cross(u)
            
            points.push({ x: point.dot(u), y: point.dot(v), d: subVect.length(), a: axis })

        }

        points.sort( (a, b) => b.d - a.d )

        points.forEach( p => {

            const x = (p.x + 1) * (s2 - offset) + offset
            const y = (p.y + 1) * (s2 - offset) + offset

            switch(p.a){

                case "X":

                    ctx.fillStyle = "red"
                    break

                case "Y":

                    ctx.fillStyle = "green"
                    break

                case "Z":

                    ctx.fillStyle = "blue"
                    break

            }

            ctx.strokeStyle = ctx.fillStyle

            ctx.beginPath();
            ctx.arc(x, y, s / 13, 0, Math.PI * 2)
            ctx.fill()
            ctx.moveTo(s2, s2)
            ctx.lineTo(x, y)
            ctx.stroke()

            ctx.fillStyle = "white"
            ctx.fillText(p.a, x, y + 1);

        })
       
    }

    function mousedown(e){

        const x = e.clientX / window.innerWidth * 2 - 1
        const y = 1 - e.clientY / window.innerHeight * 2

        const center = new Vector3(1,0,1).multiplyScalar(REFS.buildSize / 2)
        center.y = $GRID_Y_POS

        lastMousePos = { x, y }

        if(e.which > 1){

            raycaster.setFromCamera( new Vector2(x, y), REFS.camera )

            const dir = raycaster.ray.direction.clone()
            const normal = new Vector3()

            REFS.camera.getWorldDirection(normal)

            REFS.camera.target.copy( dir.multiplyScalar( center.clone().sub( REFS.camera.position ).dot(normal) / dir.dot(normal) ).add( REFS.camera.position ) )

        } else 

            REFS.camera.target.copy(center)

    }

    function mousemove(e){

        if(lastMousePos)

            if(e.which === 1){
        
                REFS.camera.angularVelocity.theta += -e.movementX / window.innerWidth * 500
                REFS.camera.angularVelocity.phi += e.movementY / window.innerHeight * 500

            } else {

                const x = lastMousePos.x += e.movementX / 100
                const y = lastMousePos.y -= e.movementY / 100

                raycaster.setFromCamera(new Vector2(x,y), REFS.camera)

                const ray = raycaster.ray.direction.clone()
                const normal = new Vector3()
                REFS.camera.getWorldDirection(normal)

                //ray scalar for plane intersection
                const t = REFS.camera.target.clone().sub(REFS.camera.position).dot(normal) / ray.dot(normal)
                const intersection = ray.multiplyScalar(t).add(REFS.camera.position)

                REFS.camera.position.add(REFS.camera.target.clone().sub(intersection))

            }

    }



</script>

<svelte:window

    on:mouseup={() => lastMousePos = null}
    on:mousemove={mousemove}

/>

<div transition:fly={{x: 200, duration: 200}} class="fixed select-none right-10 top-10 rounded-full bg-white hover:bg-opacity-20 {ismousedown ? "bg-opacity-20" : "bg-opacity-0"} transition-all" style="width: {s}px; height: {s}px">
    <canvas on:mousedown={mousedown} bind:this={canvas} width={s}, height={s} on:contextmenu|preventDefault></canvas>   
</div>
