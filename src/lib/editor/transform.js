import { CylinderGeometry, Euler, Group, Matrix4, Mesh, MeshBasicMaterial, Quaternion, Raycaster, TorusGeometry, Vector3 } from "three"
import ShellGeometry from "$lib/editor/geometries/shellGeometry"
import { P2I, disposeMesh } from "$lib/common/utils"
import { ConvertEvent, ModifyEvent, OVERLAP, REFS, TransformEvent } from "$lib/editor/store"
import { get } from "svelte/store"
import { condense } from "../common/utils"

const basicMaterial = new MeshBasicMaterial({ vertexColors: true })
const xMaterial = new MeshBasicMaterial({ color: 0xff0000 })
const yMaterial = new MeshBasicMaterial({ color: 0x00ff00 })
const zMaterial = new MeshBasicMaterial({ color: 0x0000ff })

class TransformableObject{

    constructor(){

        this.mesh = null
        this.pos = new Vector3()
        this.initPos = new Vector3()
        this.lastVect = new Vector3()
        this.blocks = null

        this.transControls = transformControls(true, false)
        this.rotControls = transformControls(false, true) 
        this.controls = new Group()
        this.meshGroup = new Group()
        this.controls.add(this.transControls)

        this.transformType = null
        this.transformAxis = new Vector3()

        this.raycaster = new Raycaster()

        this.animation = null

        this.updateUi = () => {}

        this.updateControlsScale()

    }

    updateControlsScale(){

        let scalar = REFS.camera.position.distanceTo(this.controls.position) / 50

        scalar = scalar < 0.1 ? 0.1 : scalar > 10 ? 10 : scalar

        this.controls.scale.set(scalar, scalar, scalar)

    }

    addToScene(){

        REFS.scene1.add(this.meshGroup)
        REFS.scene2.add(this.controls)

    }

    removeFromScene(){

        REFS.scene1.remove(this.meshGroup)
        REFS.scene2.remove(this.controls)

        disposeMesh(this.meshGroup)
        disposeMesh(this.controls)

    }

    init(blocks, autoPosition = true){

        this.blocks = []

        const min = new Vector3(Infinity, Infinity, Infinity)
        const max = min.clone().multiplyScalar(-1)

        //loop through blocks passed in, convert block index to vector, calculate bounding box
        for(let i = 0; i < blocks.length; i++){

            const pos = new Vector3( ...blocks[i][1] )

            min.min(pos)
            max.max(pos)

            this.blocks.push({ ci: blocks[i][0], p: pos })

        }

        if(autoPosition)

            this.pos.copy( min ).add( max.sub(min).addScalar(1).divideScalar(2).floor() )

        this.initPos = this.pos.clone()

        const obj = {}

        //subtract center of object to put object around origin
        for(let i = 0; i < this.blocks.length; i++){

            const p = this.blocks[i].p

            if(autoPosition)

                p.sub(this.pos)

            obj[`${p.x}.${p.y}.${p.z}`] = this.blocks[i].ci

        }

        //create mesh and transform controls
        this.mesh = new Mesh( new ShellGeometry( obj ), basicMaterial )
        this.meshGroup.add(this.mesh)

        this.meshGroup.position.copy(this.pos)
        this.controls.position.copy(this.pos)

        return this

    }

    applyTransformation( dP = null, dQ = null ){

        if(dP !== null){

            this.pos.add(dP)
            this.meshGroup.position.copy(this.pos)
            this.controls.position.copy(this.pos)

            this.updateUi(this.pos)

        }

        if(dQ !== null)

            this.mesh.quaternion.multiplyQuaternions(dQ, this.mesh.quaternion)

    }

    updateTranslateFromUi( tranX, tranY, tranZ ){

        const before = this.controls.position.clone()

        this.pos.set(tranX, tranY, tranZ)
        this.controls.position.copy(this.pos)
        this.meshGroup.position.copy(this.pos)

        return new TransformEvent(this.pos.clone().sub(before)) 

    }
    
    projectCameraRay(normal){

        const dir = this.raycaster.ray.direction.clone()
    
        return dir.multiplyScalar( this.pos.clone().sub( REFS.camera.position ).dot(normal) / dir.dot(normal) ).add( REFS.camera.position )

    } 

    startTransform( vect2 ){

        this.raycaster.setFromCamera( vect2, REFS.camera )

        //check for mouse intersection with transform controls
        const intersections = this.raycaster.intersectObject( this.controls )

        if(intersections.length > 0){

            const intr = intersections[0]
            const obj = intr.object

            //set selected axis 
            switch(obj.axis){

                case "x":

                    this.transformAxis.set(1,0,0)
                    break

                case "y":

                    this.transformAxis.set(0,1,0)
                    break

                case "z":
                    
                    this.transformAxis.set(0,0,1)
                    break

            }

            //rotation control or translate control selected
            this.transformType = obj.name

            if(obj.name === "translate"){

                const normal = new Vector3()

                REFS.camera.getWorldDirection(normal)

                this.lastVect.copy( this.projectCameraRay(normal).projectOnVector(this.transformAxis) )

            }else if(obj.name === "rotate")

                this.lastVect.copy( this.projectCameraRay(this.transformAxis).sub(this.pos) )

            return true

        } else

            this.transformType = null

        return false

    }

    updateTransform( vect2 ){

        this.raycaster.setFromCamera( vect2, REFS.camera )

        if( this.transformType === "translate" ){

            const normal = new Vector3()

            REFS.camera.getWorldDirection(normal)
        
            const vect = this.projectCameraRay(normal).projectOnVector( this.transformAxis )

            this.controls.position.add(vect.clone().sub( this.lastVect ))
            this.meshGroup.position.copy(this.controls.position)

            this.lastVect.copy(vect)

        }

    }

    endTransform(){

        this.controls.position.round()
        this.meshGroup.position.copy(this.controls.position)

        this.transformType = null

        if(this.pos.equals(this.controls.position))

            return null

        const before = this.pos.clone()

        this.pos.copy(this.controls.position)

        this.updateUi(this.pos)

        return new TransformEvent(this.pos.clone().sub(before))

    }

    rotateRad( axis, rad ){

        const dQ = new Quaternion().setFromAxisAngle(axis, rad)
        
        this.mesh.quaternion.multiplyQuaternions( dQ, this.mesh.quaternion)

        return new TransformEvent( null, dQ ) 

    }

    paste( cancel = false ){

        const overlap = get(OVERLAP)
        const indicies = []
        const before = []
        const after = []

        for(let i = 0; i < this.blocks.length; i++){

            const block = this.blocks[i]

            const pos = block.p.clone().addScalar(0.5)

            if(cancel)

                pos.add(this.initPos).floor()

            else

                pos.applyQuaternion(this.mesh.quaternion).add(this.pos).floor()


            const ind = P2I(pos, REFS.buildSize)

            //if block is in build and different from block already in its spot
            if(ind === null || REFS.build.blocks[ind][0] === block.ci)

                continue

            if( !overlap && REFS.build.blocks[ind][0] === 0 || overlap ) {

                indicies.push(ind)
                before.push([REFS.build.blocks[ind][0], false])
                after.push([block.ci, false])
                REFS.build.modifyByIndex(ind, block.ci)

            }

        }

        if(indicies.length > 0){

            REFS.build.update()

            return new ModifyEvent( indicies, before, after )

        }

        return null //no change made

    }

    transformVector(vect){

        return vect.clone().addScalar(0.5).applyQuaternion(this.mesh.quaternion).add(this.pos).floor()

    }

    snapToGrid(){

        let minVect = this.transformVector(this.blocks[0].p)

        let min = minVect.y

        for(let i = 1; i < this.blocks.length; i++){

            const v = this.transformVector(this.blocks[i].p)

            if(v.y < min){

                minVect = v

                min = v.y

            }

        }

        if(minVect.y === 0)

            return null

        const beforePos = this.controls.position.clone()

        this.controls.position.y -= minVect.y

        this.meshGroup.position.copy(this.controls.position)

        this.pos.copy(this.controls.position)

        this.updateUi(this.pos)

        return new TransformEvent( this.pos.clone().sub(beforePos) )

    }

    snapToTop(){

        const offsets = []
        const comp = new Vector3()

        for(let i = 0; i < this.blocks.length; i++){

            const block = this.transformVector(this.blocks[i].p.clone())

            if(block.x < 0 || block.z < 0 || block.x >= REFS.buildSize || block.z >= REFS.buildSize)

                continue

            comp.copy(block)

            let y
        
            for(y = REFS.buildSize - 1; y >= 0; y--){

                comp.y = y

                const type = REFS.build.blocks[P2I(comp, REFS.buildSize)][1]

                if(type === 2)

                    break

            }

            offsets.push(block.y - y)

        }

        if(offsets.length === 0){

            this.snapToGrid()

            return

        }

        const offset = Math.min(...offsets) - 1

        if(offset === 0)

            return null

        const beforePos = this.controls.position.clone()

        this.controls.position.y -= offset

        this.meshGroup.position.copy(this.controls.position)

        this.pos.copy(this.controls.position)

        this.updateUi(this.pos)

        return new TransformEvent( this.pos.clone().sub(beforePos) )

    }

}

class TransformableGlb extends TransformableObject{

    constructor( glbConverter ){

        super()

        this.scale = 1

        this.glbQuat = new Quaternion()

        this.isConverted = false

        //glb converter passed in and not created here because it requires async to initialize
        this.glbConverter = glbConverter

        //create glbMesh, normal mesh will be created on conversion
        this.glbMesh = this.glbConverter.mesh

        this.controls.add(this.rotControls)

        this.pos.set(REFS.buildSize / 2,REFS.buildSize / 2,REFS.buildSize / 2)
        this.meshGroup.position.copy(this.pos)
        this.controls.position.copy(this.pos)

        console.log(this.glbMesh)
        this.meshGroup.add(this.glbMesh)

    }

    applyTransformation( dP = null, dQ = null, dS = null ){

        super.applyTransformation(dP, this.isConverted ? dQ : null)

        if(dQ !== null){

            this.glbMesh.quaternion.multiplyQuaternions(dQ, this.glbMesh.quaternion)

            const euler = new Euler().setFromQuaternion(this.glbMesh.quaternion)

            euler.x *= 180 / Math.PI
            euler.y *= 180 / Math.PI
            euler.z *= 180 / Math.PI

            REFS.transform.updateUi(null, euler)

        }

        if(dS !== null){

            this.glbMesh.scale.multiplyScalar(dS)

            this.updateUi(null, null, this.glbMesh.scale.x)

        }

    }

    updateRotateFromUi( rotX, rotY, rotZ ){

        const quatBefore = this.glbQuat.clone()

        this.glbQuat.setFromEuler( new Euler(rotX, rotY, rotZ) )
        this.glbMesh.quaternion.copy(this.glbQuat)

        return new TransformEvent(null, this.glbMesh.quaternion.clone().multiply(quatBefore.invert())) 

    }

    updateScaleFromUi( scale ){

        const before = this.glbMesh.scale.clone()

        this.glbMesh.scale.set(scale, scale, scale)

        return new TransformEvent(null, null, scale / before.x)

    }

    updateTransform( vect2 ){

        super.updateTransform( vect2 )

        if( this.transformType === "rotate" ){

            const intersection = this.projectCameraRay(this.transformAxis).sub(this.pos)

            let dTheta = Math.acos( intersection.dot(this.lastVect) / (this.lastVect.length() * intersection.length()) )

            dTheta = isNaN(dTheta) ? 0 : dTheta

            const v = this.lastVect.clone().cross(intersection).normalize()

            dTheta *= v.x + v.y + v.z

            this.lastVect.copy(intersection)

            const dQuat = new Quaternion().setFromAxisAngle( this.transformAxis, dTheta )

            this.glbMesh.quaternion.multiplyQuaternions(dQuat, this.glbMesh.quaternion)

        }

    }

    endTransform(){

        let evn = super.endTransform()

        if(this.glbMesh.quaternion.equals(this.glbQuat) && evn === null)

            return null

        if(evn === null)

            evn = new TransformEvent(null, this.glbMesh.quaternion.clone().multiply(this.glbQuat.clone().invert()))

        this.glbQuat.copy(this.glbMesh.quaternion)

        const deg = new Euler().setFromQuaternion(this.glbQuat)

        deg.x *= 180 / Math.PI
        deg.y *= 180 / Math.PI
        deg.z *= 180 / Math.PI

        this.updateUi(null, deg)

        return evn

    }

    rotateRad( axis, rad ){

        const evn = super.rotateRad( axis, rad )

        this.glbQuat.multiplyQuaternions( evn.dQ, this.glbQuat)
        this.glbMesh.quaternion.copy(this.glbQuat)

        return evn

    }

    async convert(){

        this.isConverted = true

        const matrix = new Matrix4()

        //pack transformation into matrix to send to converter
        matrix.compose( new Vector3(), this.glbMesh.quaternion, this.glbMesh.scale)

        const blocks = await this.glbConverter.convert(matrix)
        // getTopFaceCount(blocks)
        this.init(blocks, false)

        this.meshGroup.add(this.mesh)

        this.controls.remove(this.rotControls)
        this.meshGroup.remove(this.glbMesh)

        //dont dispose of glb mesh, if it remains on vram it can be disposed from cpu's ram
        disposeMesh(this.glbMesh)
        disposeMesh(this.rotControls)
    
        //return convert event
        return new ConvertEvent("forwards")

    }

    back(){

        this.isConverted = false

        this.controls.add(this.rotControls)
        this.meshGroup.add(this.glbMesh)

        this.meshGroup.remove(this.mesh)

        disposeMesh(this.mesh)

        return new ConvertEvent("backwards")

    }

}


function transformControls( translation = true, rotation = true ){

    const h = 10
    const r = 0.3

    const group = new Group()

    if(translation){

        const barGeom = new CylinderGeometry(r, r, h, 10)
        const arrowGeom = new CylinderGeometry(0, r * 2, r * 3, 10)

        const xBar = new Mesh(barGeom, xMaterial)
        const xArrow = new Mesh(arrowGeom, xMaterial)
        xBar.translateX(h / 2)
        xBar.rotateZ(Math.PI / 2)
        xArrow.translateX(h + r * 1.5)
        xArrow.rotateZ(-Math.PI / 2)
        xBar.axis = xArrow.axis = "x"

        const yBar = new Mesh(barGeom, yMaterial)
        const yArrow = new Mesh(arrowGeom, yMaterial)
        yBar.translateY(h / 2)
        yArrow.translateY(h + r * 1.5)
        yBar.axis = yArrow.axis = "y"

        const zBar = new Mesh(barGeom, zMaterial)
        const zArrow = new Mesh(arrowGeom, zMaterial)
        zBar.translateZ(h / 2)
        zBar.rotateX(Math.PI / 2)
        zArrow.translateZ(h + r * 1.5)
        zArrow.rotateX(Math.PI / 2)
        zBar.axis = zArrow.axis = "z"

        xBar.name = xArrow.name = yBar.name = yArrow.name = zBar.name = zArrow.name = "translate"

        group.add(xBar, xArrow, yBar, yArrow, zBar, zArrow)

    }

    if(rotation){

        const torus = new TorusGeometry(h * 8 / 10, r, 5, 10, Math.PI / 2)
        
        const xTorus = new Mesh(torus, xMaterial)
        xTorus.rotateY(-Math.PI / 2)
        xTorus.axis = "x"

        const yTorus = new Mesh(torus, yMaterial)
        yTorus.rotateX(Math.PI / 2)
        yTorus.axis = "y"

        const zTorus = new Mesh(torus, zMaterial)
        zTorus.axis = "z"

        xTorus.name = yTorus.name = zTorus.name = "rotate"

        group.add(xTorus, yTorus, zTorus)

    }

    return group

}

function getTopFaceCount(blocks){

    //4.105768 scale for 50000 top faces
    //3.6061635
    const posSet = new Set()

    for(const [color, vect] of blocks){

        const key = `${vect.x}.${vect.y}.${vect.z}`
        posSet.add(key)

    }

    let count = 0

    for(const [color, vect] of blocks){

        const key = `${vect.x}.${vect.y + 1}.${vect.z}`
        if(!posSet.has(key))

            count++

    }

    console.log(count)

    const min = new Vector3()
    const max = new Vector3()

    for(const [color, vect] of blocks){

        min.min(vect)
        max.max(vect)

    }

    max.sub(min)

    const size = Math.max(max.x, Math.max(max.y, max.z))
    console.log(size)
    const expanded = new Uint16Array(size**3)

    for(const [color, vect] of blocks){

        const ind = P2I(vect.clone().sub(min), size)
        expanded[ind] = color

    }

    const blob = new Blob([condense(expanded, size)])
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")

    a.href = url
    a.download = "0x00.trra"

    document.body.appendChild(a)

    a.click()

    document.body.removeChild(a)

    URL.revokeObjectURL(url)

}

export { TransformableObject, TransformableGlb }