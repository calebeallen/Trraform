
import Queue from "../structures/queue"

export default class Task{

    static initialized = false
    static threadPool = []
    static taskQueue = new Queue()
    static ongoingTask = {}
    static taskId = 0
    
    static init(){

        this.initialized = true

        for(let i = 0; i < navigator.hardwareConcurrency - 1; i++){

            let resolveLoaded

            const worker = {

                id: i,
                load: new Promise( res => resolveLoaded = res ),
                worker: new Worker( new URL('./taskWorker.js', import.meta.url), { type: "module" } ),
                busy: false

            }

            worker.worker.onmessage = e => {

                if(e.data === "loaded"){

                    resolveLoaded()
                    return

                }

                const result = e.data

                //finish task by resolving promise and removing from ongoing list
                this.ongoingTask[result.id](result.data)
                delete this.ongoingTask[result.id]

                //free up worker
                worker.busy = false

                //run next task
                this.next()

            }

            this.threadPool.push(worker)

        }

    }

    static deployTask(method, data, transferable = []){

        // create task promise, store it in list of ongoing task to resolve later
        let resolve 
        const promise = new Promise(res => resolve = res)
        this.ongoingTask[this.taskId] = resolve

        // create task
        const task = { method, data, transferable, id: this.taskId }
        this.taskId++
        this.taskQueue.enqueue(task)

        this.next()

        return promise

    }

    
    static next(){

        for(const worker of this.threadPool)

            if(!worker.busy && this.taskQueue.size()){

                const task = this.taskQueue.dequeue()
                
                worker.worker.postMessage({
                    
                    method: task.method,
                    data: task.data,
                    id: task.id, 

                }, task.transferable)

            }

    }

    constructor( taskName, params = {} ){

        this.method = taskName
        this.params = params

        if(!Task.initialized)

            Task.init()

    }

    async run(){

        let transferable

        switch(this.method){

            case "decode":

                transferable = [this.params.encoded.buffer]
                break

            case "reduce-poly":

                transferable = [this.params.expanded.buffer]
                break

            case "get-plot-data":

                transferable = []
                break

            case "merge-geometries":

                const d = this.params.geometryData
                transferable = []
            
                for(let i = 0; i < d.position.length; i++)

                    transferable.push(d.position[i].buffer, d.color[i].buffer, d.index[i].buffer)

        }
    
        return await Task.deployTask(this.method, this.params, transferable)

    }

}