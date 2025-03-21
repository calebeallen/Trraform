
import { Sphere, Vector3 } from "three";
import PlotId from "$lib/common/plotId";
import { expand, I2P } from "$lib/common/utils";
import Queue from "$lib/main/structures/queue";
import Plot from "$lib/main/plot/plot";
import Octree from "$lib/main/structures/octree";
import Task from "$lib/main/task/task";

const CHUNK_SIZE = 4

export default class RootPlot {

    constructor(){

        this.id = new PlotId(0)
        this.pos = new Vector3()
        this.blockSize = 1
        this.children = []
        this.geometryData = {}
        this._loading = null
        this.isRoot = true

    }

    load(){

        if(this._loading === null)

            this._loading = ( async () => {

                //get build
                const condensed = new Uint16Array(await this.id.fetch())
                const bs = condensed[1]
                const expanded = expand(condensed)
                
                //get root plot indicies
                let plotIndicies = []
                
                for(let i = 0; i < expanded.length; i++){

                    const up1 = i + bs ** 2

                    if(expanded[i] !== 0 && (up1 >= expanded.length || expanded[up1] === 0))

                        plotIndicies.push(i)

                }

                //create chunkArr
                const grid = Array.from({ length: bs }, () => Array.from({ length: bs }, () => []));
                const graph = new Array(plotIndicies.length)
                const chunkArr = new Array(plotIndicies.length)

                //create all nodes
                for(let i = 0; i < plotIndicies.length; i++){

                    const pos = I2P(plotIndicies[i], bs)
                    const node = {
                        ind: i,
                        connections: [],
                        pos: pos,
                        chunk: null,
                        len: pos.x ** 2 + pos.y ** 2 + pos.z ** 2
                    }
                    
                    grid[pos[2]][pos[0]].push(node)
                    graph[i] = node

                }

                graph.sort((a,b) => a.len - b.len)

                const dx = [1,0,-1,0]
                const dz = [0,1,0,-1]

                //connect nodes
                for(const node of graph){

                    const [x,y,z] = node.pos

                    for(let i = 0; i < 4; i++){

                        const x1 = x + dx[i]
                        const z1 = z + dz[i]

                        if(x1 < 0 || x1 >= bs || z1 < 0 || z1 >= bs)

                            continue

                        let minDist = Infinity
                        let closest = null
                        const adjacent = grid[z1][x1]

                        for(const adjNode of adjacent){

                            const y1 = adjNode.pos[1]
                            const dist = (x1 - x) ** 2 + (y1 - y) ** 2 + (z1 - z) ** 2

                            if(dist < minDist){

                                minDist = dist
                                closest = adjNode

                            }

                        }

                        if(closest !== null)

                            node.connections.push({ dist: minDist, node: closest })
                
                    }

                }

                //create chunks
                let chunk = 0

                for(const node of graph){

                    if(node.chunk !== null)

                        continue

                    const queue = new Queue()
                    queue.enqueue(node)

                    let found = 0;

                    outer: while(queue.size()){

                        const dqed = queue.dequeue()

                        for(const adj of dqed.connections){

                            if(found >= CHUNK_SIZE)

                                break outer

                            if(adj.node.chunk === null){

                                adj.node.chunk = chunk
                                chunkArr[adj.node.ind] = chunk
                                queue.enqueue(adj.node)
                            
                                found++

                            }

                        }

                    }
                    
                    if(node.chunk === null){ //if 0 nodes were found, assign n to the chunk of its nearest neighbor

                        if(found === 0)

                            node.chunk = node.connections[0].node.chunk

                        else

                            node.chunk = chunk

                        chunkArr[node.ind] = node.chunk

                    }

                    //if nodes were able to be assigned a chunk, give node n that chunk aswell
                    if(found)

                        chunk++

                }

                //get chunk sizes
                const chunkSizes = {}

                for(let i = 0; i < chunkArr.length; i++){

                    if(!chunkSizes[chunkArr[i]]) chunkSizes[chunkArr[i]] = 1
                    else chunkSizes[chunkArr[i]]++

                }

                //c reate chunk objects to pass to children (they are shared for memory efficiency)
                let maxChunkId = chunkArr[0]
                for(let i = 1; i < chunkArr.length; i++)

                    if(chunkArr[i] > maxChunkId)
                        maxChunkId = chunkArr[i]

                const chunkCount = maxChunkId + 1
                const chunks = new Array(chunkCount)

                for(let i = 0; i < chunkCount; i++)

                    chunks[i] = { 
                        parent: null,
                        children: new Set(),
                        plots: [],
                        lod: null,
                        center: new Vector3()
                    }
        
                // create child plots
                for(let i = 0; i < plotIndicies.length; i++){

                    const childPlotId = this.id.mergeChild(i + 1)
                    const childPos = new Vector3(...I2P(plotIndicies[i], bs))
                    childPos.y++
                    childPos.multiplyScalar(this.blockSize).add(this.pos)
                    
                    const chunk = chunks[chunkArr[i]]
                    const plot = new Plot(childPlotId, childPos, this, chunk)

                    chunk.plots.push(plot)
                    this.children.push(plot)

                }

                //get geomdata
                const task = new Task("reduce-poly", { expanded, buildSize : bs })
                const geomData = this.geometryData.stdRes = await task.run()

                this.octree = new Octree(this.children, bs)
                this.buildSize = bs
                this.sphere = new Sphere( new Vector3(0.5,0.5,0.5).multiplyScalar(this.buildSize * this.blockSize), Math.sqrt(3 * ( this.buildSize * this.blockSize / 2 ) ** 2) )
                this.boundingSphere = new Sphere(new Vector3(...geomData.center), Math.hypot(...geomData.dp))
                
            })()

        return this._loading

    }

    findPlotById(plotId){

        const ids = plotId.split()

        let next = this

        for(const id of ids){

            if(id > next.children.length)

                return null

            next = next.children[id - 1]

        }

        return next

    }

    isPlotCreated(plotId){

        return this.findPlotById(plotId) !== null

    }

    getContains(point){

        return this.octree.getContains(point)

    }

    getKClosest(point, k, heap){

        return this.octree.getKClosest(point, k, heap)
        
    }
    
    kClosestToPointAndLine(origin, dir, k){

        return this.octree.kClosestToPointAndLine(origin, dir, k)

    }

    withinRadius(center, radius){

        return this.octree.withinRadius(center, radius)

    }

}