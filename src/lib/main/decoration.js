import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, MeshBasicMaterial, Object3D, Spherical, Uint16BufferAttribute, Vector3, BufferAttribute, Points, ShaderMaterial } from "three";
import { refs } from "./store";
import { disposeMesh } from "@packages/global/functions";

function confetti(pos, buildSize){

    const count = 100
    const geometry = new BufferGeometry()

    geometry.setAttribute("position", new Float32BufferAttribute([
        -0.5, -1, 0,
        0.5, -1, 0,
        0.5,  1, 0,
        -0.5,  1, 0,
    ], 3))
    geometry.setIndex(new Uint16BufferAttribute([
        0, 1, 2,
        2, 3, 0,
    ], 1))

    const scale = buildSize / 80
    geometry.scale(scale,scale,scale)
    geometry.computeVertexNormals()

    const mesh = new InstancedMesh(geometry, new MeshBasicMaterial({ side: DoubleSide }), count)
    const obj = new Object3D()
    const vrts = []

    const spread = Math.PI * 0.2
    const gravity = 9.8
    const dragCoef = 2
    const dtms = 6
    const dt = dtms / 1000

    const origin = pos.clone()
    origin.x += buildSize / 2
    origin.z += buildSize / 2

    mesh.frustumCulled = false

    for(let i = 0; i < count; i++){

        mesh.setColorAt(i, new Color(Math.random(), Math.random(), Math.random()))

        vrts.push({

            pos: origin.clone(),
            vel: new Vector3().setFromSphericalCoords( 1, Math.random() * spread, Math.random() * Math.PI * 2 ).multiplyScalar( ( Math.random() * 0.9 + 0.1 ) * 50 ),
            aPos: new Spherical(1, Math.random() * Math.PI, Math.random() * Math.PI * 2),
            aVel: new Spherical(1, Math.random() * Math.PI, Math.random() * Math.PI * 2)

        })

    }

    let t = 0

    refs.scene.add(mesh)

    const interval = setInterval(() => {

        for(let i = 0; i < vrts.length; i++){

            const v = vrts[i]

            const drag = v.vel.length() * dragCoef
            const acc = v.vel.clone().multiplyScalar(-drag)
            acc.y -= gravity

            v.vel.add(acc.multiplyScalar(dt))
            v.pos.add(v.vel.clone().multiplyScalar(dt * buildSize))

            v.aPos.theta += v.aVel.theta * dt
            v.aPos.phi += v.aVel.phi * dt

            const lookAt = new Vector3().setFromSpherical(v.aPos)
            lookAt.add(v.pos)

            obj.position.copy(v.pos)
            obj.lookAt(lookAt)
            obj.updateMatrix()

            mesh.setMatrixAt(i, obj.matrix)

        }

        mesh.instanceMatrix.needsUpdate = true

        t += dtms

        if(t > 2000){

            clearInterval(interval) 
            refs.scene.remove(mesh)
            disposeMesh(mesh)

        }

    }, dtms)

}


function stars(){

    const count = 250
    const position = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const vect = new Vector3()

    for(let i = 0; i < count; i++){

        vect.random().subScalar(0.5).normalize().multiplyScalar(1e5)

        position[i*3] = vect.x
        position[i*3+1] = vect.y
        position[i*3+2] = vect.z
        
        size[i] = Math.random() * 4 + 0.3

    }

    const geom = new BufferGeometry()
    geom.setAttribute("position", new BufferAttribute(position, 3))
    geom.setAttribute("size", new BufferAttribute(size, 1))

    const material = new ShaderMaterial({
        uniforms: {
            color: { value: new Color(0xffffff) }
        },
        vertexShader: `

            attribute float size;

            void main() {

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size;
                gl_Position = projectionMatrix * mvPosition;

            }

        `,
        fragmentShader: `

            uniform vec3 color;

            void main() {

                vec2 coord = gl_PointCoord - vec2(0.5, 0.5);
                float distance = length(coord);

                if (distance > 0.5) 

                    discard;

                gl_FragColor = vec4(color, 1.0);

            }

        `
    })

    return new Points( geom, material )

}

export{ confetti, stars }