function createInvoker(intialValue) {
    const invoker = (e) => invoker.value(e)
    invoker.value = intialValue // 后续更细的时候值需要更新invoker的value值
    return invoker
}

// 函数更新成新的函数，直接更改.value即可
export function patchEvent(el, key, nextValue) {
    const invokers = el._vei || (el._vai = {})
    const name = key.slice(2).toLowerCase() // onClick

    // 如果nextvalue为空而且绑定过事件，那我需要移除操作
    const exisitingInvoker = invokers[name]
    if(nextValue && exisitingInvoker) {
        // 更新事件
        exisitingInvoker.value = nextValue
    } else {
        if(nextValue) {
            // 缓存实现
            const invoker = (invokers[name] = createInvoker(nextValue))
            el.addEventListener(name, invoker)
        } else if(exisitingInvoker) {
            el.removeEventListener(name, exisitingInvoker)
            invokers[name] = null
        }
    }
}
