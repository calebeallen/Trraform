
import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial } from "three"
import { buildImageUrl } from "$lib/common/buildImage"
import { expand } from "$lib/common/utils"
import PlotData from "$lib/main/plot/plotData"
import PlotId from "$lib/common/plotId"
import Task from "$lib/main/task/task"
import { newPlots } from "$lib/main/store"

export default class MyPlot extends PlotData{

    static async getMesh(buildData){

        const bs = buildData[1]
        const expanded = expand(buildData)
        const task = new Task("reduce-poly", { expanded, buildSize : bs })

        const geomData = await task.run()
        if(geomData.err)

            return

        const geometry = new BufferGeometry()
        geometry.setAttribute("position", new BufferAttribute(geomData.position, 3))
        geometry.setAttribute("color", new BufferAttribute(geomData.color, 3))
        geometry.setIndex(new BufferAttribute(geomData.index, 1))
        geometry.attributes.color.normalized = true
        geometry.computeBoundingSphere()
        const material = new MeshBasicMaterial({vertexColors: true})

        return new Mesh(geometry, material)

    }

    static async imgUrl(buildData, w = 240, h = 320){

        const mesh = await MyPlot.getMesh(buildData)
        const url = buildImageUrl(w, h, mesh)

        mesh.geometry.dispose()
        mesh.material.dispose()

        return url

    }

    constructor(plotId = new PlotId(), isNew = false){

        super(plotId)
        this.buildData = null
        this.imgUrl = null
        this.isNew = isNew

    }

    copy(myPlot){

        super.copy(myPlot)
        this.buildData = myPlot.buildData ? Uint16Array.from(myPlot.buildData) : null
        this.imgUrl = myPlot.imgUrl

    }

    clone(){

        const cloned = new MyPlot()
        cloned.copy(this)
        return cloned

    }

    async getImgUrl(){

        if(this.imgUrl === null)

            await this.updateImgUrl()

        return this.imgUrl
    
    }

    async updateImgUrl(){

        if(this.buildData === null)

            this.imgUrl = "/default.png"

        else    

            this.imgUrl = await MyPlot.imgUrl(this.buildData)

    }

    load(){

        if(this._loading === null)

            this._loading = ( async () => {

                try {

                    const encodedBuffer = await this.id.fetch()
                    if(encodedBuffer === null) 
                        
                        throw null

                    const encoded = new Uint8Array(encodedBuffer)
                    const task = new Task("decode", { encoded, depth: this.id.depth() })
                    const data = await task.run()
                    
                    if(data.err) 
                        
                        throw null

                    this.rEnd = data.rEnd
                    this.name = data.name
                    this.desc = data.desc
                    this.link = data.link
                    this.linkLabel = data.linkLabel
                    this.buildData = data.buildData
                    this.imgUrl = await MyPlot.getImageUrl(this.buildData)

                } catch(e) {}

                return this

            })()

        return this._loading

    }

}