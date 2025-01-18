
import PlotId from "$lib/common/plotId"
import { FIND_OPEN_PLOTS_COUNT, MAX_DEPTH } from "$lib/common/constants"

export default class AvailablePlots {

    static available = null

    static async getOne(depth){

        if(this.available === null)

            await this.refresh()

        const { plotIds, count } = this.available[depth]

        if(count == 0)

            return null

        let { idx } = this.available[depth]

        //refresh if all plots looked at
        if(idx >= FIND_OPEN_PLOTS_COUNT)

            await this.refresh()

        //if no more plots left (count < FIND_OPEN_PLOTS_COUNT), circle back to beginning
        else if ( count < FIND_OPEN_PLOTS_COUNT && idx >= count )

            this.available[depth].idx = idx = 0

        const plotId = plotIds[idx]
        this.available[depth].idx++

        return plotId

    }

    static async refresh(){

        const res = await fetch("/api/get-available-plots")
        const data = await res.json()

        this.available = new Array(MAX_DEPTH)
        
        for(let i = 0; i <= MAX_DEPTH; i++){

            const plotIds = data.filter( ({ depth }) => depth == i ).map( ({ plotId }) => new PlotId(plotId) )

            this.available[i] = {
                plotIds,
                count: plotIds.length,
                idx: 0
            }

        }

    }
}