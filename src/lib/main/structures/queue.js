// https://www.geeksforgeeks.org/implementation-queue-javascript/
export default class Queue {

    constructor() {

        this.items = {}
        this.frontIndex = 0
        this.backIndex = 0

    }

    enqueue(item) {

        this.items[this.backIndex] = item
        this.backIndex++

    }

    dequeue() {

        const item = this.items[this.frontIndex]
        delete this.items[this.frontIndex]
        this.frontIndex++
        return item

    }

    peek() {

        return this.items[this.frontIndex]

    }

    size() {

        return this.backIndex - this.frontIndex

    }

}
