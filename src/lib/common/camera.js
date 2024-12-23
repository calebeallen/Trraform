
import { Matrix4, PerspectiveCamera, Spherical, Vector3 } from "three";

const PI2 = Math.PI * 2

export default class Camera extends PerspectiveCamera{

    constructor(fov = 70){
        
        super(fov, window.innerWidth / window.innerHeight, 0.0000001, 1000)

        this.up.set(0,1,0)

        this.forward = false
        this.backward = false
        this.right = false
        this.left = false
        this.upward = false
        this.downward = false

        this.accelerationMagnitude = 1
        this.velocity = new Vector3()
        this.velocityDamping = 1e-6

        this.angularVelocity = new Spherical()
        this.angularVelocityDamping = 1e-6

        this.scrollVelocity = 0
        this.scrollDamping = 1e-6

        this.sphere = new Spherical()
        this.target = new Vector3()

        this.viewMatrix = new Matrix4()

        this.pause = () => {}
        this.update = this.pause

    }

    updateSphere(){

        const dir = new Vector3()

        this.getWorldDirection(dir)
        this.sphere.setFromVector3(dir)

    }

    animateLookAt(target, endFunction){

        const lookDir1 = new Vector3()
        const lookDir2 = target.clone().sub(this.position).normalize()

        this.getWorldDirection(lookDir1)

        const quad = t => 1 - (t - 1) ** 2

        const update = dt => {

            const x = quad(Math.min(update.t += dt * 5, 1))
            const lookDir = new Vector3()
            
            lookDir.lerpVectors(lookDir1, lookDir2, x).normalize().add(this.position)

            this.lookAt(lookDir)

            this.updateSphere()
            this._update(dt)

            if(x === 1)
                
                this.update = endFunction

        }
        
        this.target.copy(target)

        update.t = 0
        this.update = update

    }


    moveTo(s1, s2, pivot, target, endFunction, tScale = 1, thetaAcceleration = 0){

        if(this._compareSpheres(s1, s2)){

            this.target.copy(target)
            this.update = endFunction

            return

        }

        const spherical = new Spherical()
        const currentSpherical = new Spherical()
        const lastSpherical = new Spherical()

        const quad = t => 1 - (t - 1) ** 2
        
        const update = dt => {

            this.angularVelocityDamping = 0.9

            const x = quad(Math.min(update.t += dt * tScale, 1))

            currentSpherical.set(
                s1.radius * (1 - x) + s2.radius * x,
                s1.phi * (1 - x) + s2.phi * x,
                s1.theta * (1 - x) + s2.theta * x
            )

            this.angularVelocity.theta += thetaAcceleration * dt

            spherical.radius += currentSpherical.radius - lastSpherical.radius 
            spherical.phi += currentSpherical.phi - lastSpherical.phi
            spherical.theta += currentSpherical.theta - lastSpherical.theta + this.angularVelocity.theta * dt

            lastSpherical.copy(currentSpherical) 

            this.position.setFromSpherical(spherical).add(pivot)
            this.lookAt(this.target)
           
            this.updateSphere()
            this._update(dt)

            if(x === 1)

                this.update = endFunction

        }

        this.angularVelocity.theta = 0
        update.t = 0
        this.animateLookAt(target, update)

    }

    autoRotate(dt){ 

        this.angularVelocityDamping = 1e-4

        const targetToCamera = this.position.clone().sub(this.target)
        const spherical = new Spherical().setFromVector3(targetToCamera)

        spherical.theta += this.angularVelocity.theta * dt

        this.position.setFromSpherical(spherical).add(this.target)
        this.lookAt(this.target)

        this.updateSphere()
        this._update(dt)

        this.angularVelocity.theta = Math.max(this.angularVelocity.theta, 0.2)

    }

    standard(dt){

        //calculate change in angles
        const dTheta = this.angularVelocity.theta * dt
        const dPhi = this.angularVelocity.phi * dt

        //apply changes
        this.sphere.theta += dTheta
        this.sphere.phi += dPhi

        //clamp angles
        this.sphere.theta %= PI2
        this.sphere.makeSafe()

        //adjust camera orientation
        this.lookAt(new Vector3().setFromSpherical(this.sphere).add(this.position))

        //compute linear acceleration
        const acceleration = new Vector3( (this.right ? 1 : 0) + (this.left ? -1 : 0), 0, (this.backward ? 1 : 0) + (this.forward ? -1 : 0))
        const rotMatrix = new Matrix4()
        rotMatrix.makeRotationFromQuaternion(this.quaternion)
        acceleration.applyMatrix4(rotMatrix)
        acceleration.y += (this.upward ? 1 : 0) + (this.downward ? -1 : 0)
        acceleration.normalize().multiplyScalar(dt * this.accelerationMagnitude)

        //adjust linear velocity
        this.velocity.add(acceleration)

        //adjust camera position
        this.position.add(this.velocity.clone().multiplyScalar(dt))
        
        this._update(dt)

    }

    orbit(dt){

        const targetToCamera = this.position.clone().sub(this.target)
        const dir = new Vector3()
        this.getWorldDirection(dir)

        //calculate change in angles
        const dTheta = this.angularVelocity.theta * dt 
        const dPhi = this.angularVelocity.phi * dt
        
        targetToCamera.applyAxisAngle(this.up, dTheta)
        dir.applyAxisAngle(this.up, dTheta)

        this.sphere.theta += dTheta
        this.sphere.theta %= PI2

        if(this.sphere.phi + dPhi > 0.001 && this.sphere.phi + dPhi < Math.PI * 0.99){

            targetToCamera.applyAxisAngle(dir.cross(this.up).normalize(), -dPhi)
            this.sphere.phi += dPhi

        }

        targetToCamera.multiplyScalar(1 - this.scrollVelocity * dt)
        this.position.copy(this.target).add(targetToCamera)

        //adjust camera
        this.lookAt(new Vector3().setFromSpherical(this.sphere).add(this.position))

        this._update(dt)

    }

    _update(dt){

        this.velocity.multiplyScalar(Math.pow(this.velocityDamping, dt))

        this.scrollVelocity *= Math.pow(this.scrollDamping, dt)
        this.angularVelocity.theta *= Math.pow(this.angularVelocityDamping, dt)
        this.angularVelocity.phi *= Math.pow(this.angularVelocityDamping, dt)
        
        this.updateMatrixWorld()

        this.viewMatrix.multiplyMatrices(this.projectionMatrix, this.matrixWorldInverse)

    }

    _compareSpheres(s1, s2){

        const comp = (a, b) => Math.abs(a - b) < 1e-10

        return comp(s1.radius, s2.radius) && comp(s1.phi, s2.phi) && comp(s1.theta, s2.theta)

    }

}