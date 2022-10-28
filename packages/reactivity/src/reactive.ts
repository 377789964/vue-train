import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandler"

export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive"
}

// const mutableHandlers = {
//     get(target, key, receiver) {
//         if (ReactiveFlags.IS_REACTIVE === key) {
//           return true  
//         }
//         return Reflect.get(target, key, receiver);
//     },
//     set(target, key, value, receiver) {
//         return Reflect.set(target, key, value, receiver);
//     }
// }

const reactiveMap = new WeakMap(); // key 只能是对象
export function reactive(target) {
    if (!isObject(target)) {
        return target;
    }
   
    // 代理对象的返回值被代理，返回之前被代理的结果
    if (target[ReactiveFlags.IS_REACTIVE]) {
        return target
    } 

    // 缓存一下，代理过的对象，再进行代理的时候直接拿出来返回即可
    const existsProxy = reactiveMap.get(target);
    if (existsProxy) {
        return existsProxy;
    }

    // 代理 我通过代理对象操作属性 你会去源对象上进行获取
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    
    return proxy
}


