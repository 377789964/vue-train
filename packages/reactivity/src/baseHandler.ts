import { isObject } from "@vue/shared";
import { activeEffect, track, trigger } from "./effect";
import { reactive, ReactiveFlags } from "./reactive"

export const mutableHandlers = {
    get(target, key, receiver) { // 用户取值操作
        if (ReactiveFlags.IS_REACTIVE === key) {
          return true
        }
        track(target, key)
        let r = Reflect.get(target, key, receiver); // 处理了this指向问题
        if (isObject(r)) { //只有用户去值的时候才会二次代理，不用担心性能
            return reactive(r)
        }
        return r
    },
    set(target, key, value, receiver) {
        // 用户赋值操作
        let oldValue = target[key] // 没有修改之前的值
        
        // 返回值是布尔类型
        let r = Reflect.set(target, key, value, receiver)

        if (oldValue !== value) {
            trigger(target, key, value, oldValue)
        }
        return r
    }
}
