class Queue {
    constructor(array = []) {
        this.items = array;
    }

    enqueue(item) {
        this.items.push(item);
    }

    dequeue() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    exist(article) {
        for (const item of this.items) {
            if (article.url === item.url)
                return true
        }
        return false
    }

    moveToFront(item) {
        // Remove the item if it exists in the array
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
        // Add the item to the front of the array
        this.items.unshift(item);
    }

    toArray() {
        // Return a new array containing all items in the queue
        return [...this.items];
    }

    clear() {
        // Empty the queue
        this.items = [];
    }
}

module.exports = Queue;