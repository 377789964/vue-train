import { activeEffect, track } from "./effect";
import { ReactiveFlags } from "./reactive"

export const mutableHandlers = {
    get(target, key, receiver) { // 用户取值操作
        if (ReactiveFlags.IS_REACTIVE === key) {
          return true  
        }
        track(target, key)
        return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) { // 用户赋值操作
        return Reflect.set(target, key, value, receiver);
    }
}
