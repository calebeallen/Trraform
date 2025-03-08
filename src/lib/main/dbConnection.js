
import { createClient } from '@supabase/supabase-js'
import PlotId from '$lib/common/plotId'

const LIMIT = 10

export default class DbConnection {

    constructor(){

        this.cli = createClient(
            "https://wcnaegzqssbvdnhbneoy.supabase.co", 
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbmFlZ3pxc3NidmRuaGJuZW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNzQwODIsImV4cCI6MjA1Njk1MDA4Mn0.ka2xuuG87TjwvPyve6NxU0UKLNNMxODz2HHFBdLz_i0"
        )

        this.cache = new Array(3).fill(null)
        
    }

    async getAvailablePlot(depth){

        const tracker = ids => ({ ids, itr: 0 })

        if (this.cache[depth] === null || (this.cache[depth].itr >= LIMIT && this.cache[depth].ids.length == LIMIT) ){

            const { data, error } = await this.cli.rpc("get_available_plots", {
                p_limit: LIMIT,
                p_depth: depth
            })

            this.cache[depth] = tracker(data.map(a => a.id))

        }

        const cached = this.cache[depth]

        if(cached.ids.length == 0)

            return null

        const plotId = new PlotId(cached.ids[cached.itr])
        cached.itr++

        return plotId

    }

}

