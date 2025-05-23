
import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial } from "three"
import { buildImageUrl } from "$lib/common/buildImage"
import { expand, decodePlotData } from "$lib/common/utils"
import { PLOT_DATA_BUCKET_URL } from "$lib/common/constants"
import PlotData from "$lib/main/plot/plotData"
import PlotId from "$lib/common/plotId"
import Task from "$lib/main/task/task"

export default class MyPlot extends PlotData{

    static async getMesh(buildData){

        const bs = buildData[1]
        const expanded = expand(buildData)
        const task = new Task("reduce_poly", { expanded, buildSize : bs })

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

    static async imgUrl(buildData, w = 400, h = 400){

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

        if(this.buildData?.length == 2)
            return "/default.png"

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

            this._loading = new Promise(async resolve => {

                const res = await fetch(`${PLOT_DATA_BUCKET_URL}/${this.id.string()}.dat`)
                const resBuf = await res.arrayBuffer()
                const resBytes = new Uint8Array(resBuf)
                const data = decodePlotData(resBytes)

                this.name = data.name
                this.desc = data.desc
                this.link = data.link
                this.linkTitle = data.linkTitle
                this.buildData = data.buildData
                this.updateImgUrl()

                resolve(this)

            })

        return this._loading

    }

}