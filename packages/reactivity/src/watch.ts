import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive"


function traverse(source, s = new Set()) {
    if(!isObject(source)) {
        return source
    }
    if(s.has(source)) {
        return source
    }
    s.add(source)
    // 考虑循环引用的问题 采用set解决问题
    for(let key in source) {
        traverse(source[key], s) // 递归取值
    }
    return source
}

export function watch(source, cb, options) {
    doWatch(source, cb, options)
}

export function watchEffect(effect, options) {
    doWatch(effect, null, options)
}

export function doWatch(source, cb, {immediate} = {} as any) {
    let getter;
    if (isReactive(source)) { // 如果传值时对象
        // 最终处理成函数
        getter = () => traverse(source)
    } else if (isFunction(source)) {  // 如果传值是函数
        getter = source
    }
    let oldValue
    let cleanup
    const onCleanup = (userCb) => {
        cleanup = userCb
    }
    const job = () => {
        if (cb) {
            // 内部要掉用 cb 也就是watch的回调
            // console.log('ok')
            let newValue = effect.run() // 再次掉用获取新值
            if (cleanup) {
                cleanup()
            }
            cb(newValue, oldValue, onCleanup)
            oldValue = newValue // 更新
        } else {
            effect.run()
        }
    }
    const effect = new ReactiveEffect(getter, job)

    if(immediate) { // 默认执行一次
        return job()
    }

    oldValue = effect.run() // 保留老值
}
