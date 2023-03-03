// 提供多样的api 根据参数来区分

import { isObject } from "@vue/shared"
import { createVNode, isVnode } from "./vnode"

export function h(type, propsOrChildren = null, children = []) {
    const l = arguments.length
    // h(type, {}) h(type,h('span')) h(type, [])
    // console.log(l, 'l')
    if(l == 2) {
        // console.log(propsOrChildren, 'propsOrChildren')
        if(isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
            if(isVnode(propsOrChildren)) {
                return createVNode(type, null, [propsOrChildren])
            }
            return createVNode(type, propsOrChildren)
        } else {
            // 数组 或者文本
            return createVNode(type, null, propsOrChildren);
        }
    } else {
        if(l > 3) {
            // h('div', {}, 'a', 'b', 'c')这样操作第二个参数必须是属性
            children = Array.from(arguments).slice(2)
        } else if(l === 3 && isVnode(children)) {
            children = [children]
        }
        return createVNode(type, propsOrChildren, children)
    }
}
