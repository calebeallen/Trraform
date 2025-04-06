
import PlotId from "$lib/common/plotId"

export default class PlotData {

    constructor(id = new PlotId()){

        this.id = id //token id
        this.name = ""
        this.desc = ""
        this.link = ""
        this.linkTitle = ""
        this._loading = null

    }

    clear(){

        this.name = ""
        this.desc = ""
        this.link = ""
        this.linkTitle = ""
        this._loading = null

    }

    copy(plotData){

        this.id = plotData.id
        this.name = plotData.name
        this.desc = plotData.desc
        this.link = plotData.link
        this.linkTitle = plotData.linkTitle
        this._loading = plotData._loading

    }

    clone(){

        const cloned = new PlotData()
        cloned.copy(this)
        return cloned

    }

}