
import { FIND_OPEN_PLOTS_COUNT } from "$lib/common/constants"
import { apiRes } from "$lib/server/utils"

export async function GET({ platform }){

    const { AVAILABLE_PLOTS } = platform.env
    const { results } = await AVAILABLE_PLOTS.prepare(`
        WITH d0 AS ( SELECT * FROM AvailablePlots WHERE available = 1 AND depth = 0 ORDER BY RANDOM() LIMIT ${FIND_OPEN_PLOTS_COUNT} ),
        d1 AS ( SELECT * FROM AvailablePlots WHERE available = 1 AND depth = 1 ORDER BY RANDOM() LIMIT ${FIND_OPEN_PLOTS_COUNT} ),
        d2 AS ( SELECT * FROM AvailablePlots WHERE available = 1 AND depth = 2 ORDER BY RANDOM() LIMIT ${FIND_OPEN_PLOTS_COUNT} )
        SELECT * FROM d0
        UNION ALL
        SELECT * FROM d1
        UNION ALL
        SELECT * FROM d2;
    `).run()
        
    return new Response(JSON.stringify(results), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
    })
}