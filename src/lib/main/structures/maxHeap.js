
//min value at head
export default class MaxHeap extends Array{

    constructor(){

        super()

    }

    addAndPopHead(elem){

        this[0] = elem

        if(this.length == 1)

            return
        
        let currentIndex = 0;
          
        while (true) {
        
            const li = 2 * currentIndex + 1 // left child index
            const ri = 2 * currentIndex + 2 // right child index
        
            let j = currentIndex
        
            // Compare left child
            if (li < this.length && this[li].dist > this[j].dist) 
                j = li
        
            // Compare right child
            if (ri < this.length && this[ri].dist > this[j].dist)
                j = ri
        
            // No swap needed -> done
            if (j === currentIndex)
                break
        
            // Swap
            [this[currentIndex], this[j]] = [this[j], this[currentIndex]]
        
            // Keep sifting down
            currentIndex = j

        }

    }

    add(elem){

        //add element to heap
        this.push(elem)

        let i = this.length - 1

        //percolate up
        while(i > 0){

            const pi = Math.floor((i - 1) / 2)

            //if parent element is greater than child, heap is correctly sorted
            if(this[pi].dist >= this[i].dist)

                break

            //flip parent with child if child is less than parent
            [this[pi], this[i]] = [this[i], this[pi]]

            i = pi

        }
    
    }

    popHead(){

        let i = 0

        if(this.length == 0)

            return null

        const head = this[0]
        this[0] = this.pop()

        //sort heap
        while (true) {

            const li = 2 * i + 1 //left index
            const ri = 2 * i + 2 //right index

            let j = i

            if (li < this.length && this[li].dist > this[j].dist) 

                j = li
            
            if (ri < this.length && this[ri].dist > this[j].dist) 

                j = ri

            if (j === i)
            
                break
            
            [this[i], this[j]] = [this[j], this[i]]
            i = j

        }

        return head

    }

    heapify(){

        for (let i = Math.floor(this.length / 2) - 1; i >= 0; i--) {

            let currentIndex = i;
          
            while (true) {
            
                const li = 2 * currentIndex + 1 // left child index
                const ri = 2 * currentIndex + 2 // right child index
            
                let j = currentIndex
            
                // Compare left child
                if (li < this.length && this[li].dist > this[j].dist) 
                    j = li
            
                // Compare right child
                if (ri < this.length && this[ri].dist > this[j].dist)
                    j = ri
            
                // No swap needed -> done
                if (j === currentIndex)
                    break
            
                // Swap
                [this[currentIndex], this[j]] = [this[j], this[currentIndex]]
            
                // Keep sifting down
                currentIndex = j

            }
          
        }

    }
    
}