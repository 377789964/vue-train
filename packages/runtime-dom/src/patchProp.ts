import { patchClass } from './class'
import { patchStyle } from './style'
import { patchEvent } from './event'
import { patchAttr } from './attr'

// 对元素节点进行操作
export const patchProp = (el, key, prevValue, nextValue) => {
    if(key === 'calss') {
        patchClass(el, nextValue)
    }else if(key === 'style') {
        patchStyle(el, prevValue, nextValue)
    }else if(/^on[^a-z]/.test(key)) { // 事件
        // 事件操作 addEventListener removeEventListener
        // @click="fn1" @click="fn2"
        // invoker.fn = fn1 invoker.fn = fn2
        // @click="()=>invoker.fn()" @click="()=>invoker.fn()"
        // console.log('888')
        patchEvent(el, key, nextValue)
    }else { // attr
        patchAttr(el, key, nextValue)
    }
}
