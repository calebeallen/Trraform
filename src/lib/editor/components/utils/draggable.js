
export function draggable(node) {

    const leftBound = 56
    const rightBound = 10
    const topBound = 10
    const bottomBound = 8

    let bounds = node.getBoundingClientRect()
    
    const pos = { x: bounds.left, y: bounds.top }
    const mouseStart = { x: 0, y: 0 }
    const thisStart = { x: 0, y: 0 }

    node.addEventListener('mousedown', handleMousedown)

    window.addEventListener('resize', validatePosition)

    function handleMousedown(e) {

        bounds = node.getBoundingClientRect()

        mouseStart.x = e.clientX
        mouseStart.y = e.clientY

        thisStart.x = bounds.left
        thisStart.y = bounds.top

        if(e.clientY - bounds.top < 25){

            window.addEventListener('mousemove', handleMousemove);
            window.addEventListener('mouseup', handleMouseup);

        }

    }

    function handleMousemove(e) {

        pos.x = thisStart.x + e.clientX - mouseStart.x
        pos.y = thisStart.y + e.clientY - mouseStart.y

        validatePosition()

    }

    function handleMouseup() {

        window.removeEventListener('mousemove', handleMousemove);
        window.removeEventListener('mouseup', handleMouseup);

    }

    function validatePosition(){

        bounds = node.getBoundingClientRect()

        if(pos.x < leftBound)

            pos.x = leftBound

        else if(pos.x + bounds.width > window.innerWidth - rightBound)

            pos.x = window.innerWidth - rightBound - bounds.width

        if(pos.y < topBound)

            pos.y = topBound

        else if(pos.y + bounds.height > window.innerHeight - bottomBound)

            pos.y = window.innerHeight - bottomBound - bounds.height

        node.style.left = `${pos.x}px`;
        node.style.top = `${pos.y}px`;

    }

    return {

        destroy() {

            node.removeEventListener('mousedown', handleMousedown);

        }

    }

}