const queue = []
let isFlushing = false

const resolvePromise = Promise.resolve() // nextTick

export const queueJob = (job) => {
    if(!queue.includes(job)) {
        queue.push(job)
    }
    // 最终我要清空队列
    if(!isFlushing) {
        isFlushing = true
        // 等待数据全部修改完之后做一次更新操作
        resolvePromise.then(() => {
            isFlushing = false
            let copy = queue.slice(0)
            queue.length = 0
            for(let i = 0; i < copy.length; i++) {
                const job = copy[i]
                job()
            }
        })
    }
}

// 批处理 多次操作处理一次
