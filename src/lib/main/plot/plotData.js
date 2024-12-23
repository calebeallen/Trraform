
import PlotId from "@packages/global/plotId"

export default class PlotData {

    constructor(id = new PlotId()){

        this.id = id //token id
        this.rEnd = 0
        this.name = ""
        this.desc = ""
        this.link = ""
        this.linkLabel = ""
        this._loading = null

    }

    clear(){

        this.rEnd = 0
        this.name = ""
        this.desc = ""
        this.link = ""
        this.linkLabel = ""
        this._loading = null

    }

    copy(plotData){

        this.id = plotData.id
        this.rEnd = plotData.rEnd
        this.name = plotData.name
        this.desc = plotData.desc
        this.link = plotData.link
        this.linkLabel = plotData.linkLabel
        this._loading = plotData._loading

    }

    clone(){

        const cloned = new PlotData()
        cloned.copy(this)
        return cloned

    }

}