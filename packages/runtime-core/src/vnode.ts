// 

import { isString, ShapeFlags } from "@vue/shared";

export function isVnode(vnode){
    return vnode.__v_isVnode == true
}

export function createVNode(type, props = null, children = null) {
    // 组件
    // 元素
    // 文本
    // 自定义的keep-alive...

    // 用标识来区分 对应的虚拟节点类型 这个表示采用的是位运算符 可以方便组合

    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0

    // 虚拟节点对应真实节点
    const vnode = {
        __v_isVnode: true,
        type,
        props,
        children,
        shapeFlag,
        key: props?.key,
        el: null, // 对应真实节点
    }

    if(children) {
        let type = 0
        if(Array.isArray(children)) { // [n个孩子]
            type = ShapeFlags.ARRAY_CHILDREN
        }else { // 文本
            type = ShapeFlags.TEXT_CHILDREN
        }
        vnode.shapeFlag |= type
    }

    return vnode // 根据 vnode.shapeFlag 来判断自己的类型和孩子的类型
}
