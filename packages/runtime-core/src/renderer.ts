import { ShapeFlags } from "@vue/shared"
import { isSameVNode } from "./vnode"

export function createRenderer(options) {
    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        querySelector: hostQuerySelector,
    } = options

    const  mountChildren = (children, el) => {
        for(let i = 0; i < children.length; i++) {
            patch(null, children[i], el)
        }
    }

    const  unmountChildren = (children, el) => {
        for(let i = 0; i < children.length; i++) {
            unmount(children[i])
        }
    }

    const mountElement = (vnode, container, anchor) => {
        const {type, props, children, shapeFlag} = vnode
        // 创建元素 虚拟节点上保存真实节点
        const el = (vnode.el = hostCreateElement(type))
        // 增添属性
        if(props) {
            for(let key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }
        // 处理子节点
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el)
        }else if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children)
        }
        hostInsert(el, container, anchor)
    }

    const patchProps = (oldProps, newProps, el) => {
        if(oldProps !== newProps) {
            for(let key in newProps) {
                const prev = oldProps[key]
                const next = newProps[key]
                if(prev != next) { // 新的改掉老的
                    hostPatchProp(el, key, prev, next)
                }
            }
            for(let key in oldProps) {
                if(!(key in newProps)) { // 清空老的
                    const prev = oldProps[key]
                    hostPatchProp(el, key, prev, null)
                }
            }
        }
    }

    // 全量diff算法，数组与数组比较 尽量复用减少dom操作
    const patchKeyChildren = (c1, c2, el) => {
        // console.log(c1, c2, 'c1-c2')
        // 全量比对，深度比对消耗性能，先遍历父亲再遍历孩子
        // 目前没有优化比对，没有关心，只比对变化的部分
        // 同级比对，父和父 子和子 孙子和孙子 深度遍历

        // a b c
        // a b e d
        let i = 0
        let e1 = c1.length - 1
        let e2 = c2.length - 1
        // 并且是一方不成功就false 从前往后比
        while(i<= e1 && i<=e2) {
            const n1 = c1[i]
            const n2 = c2[i]
            if(isSameVNode(n1, n2)) {
                patch(n1, n2, el) // 深度遍历
            } else {
                break
            }
            i++
        }
        // i = 2, e1 = 2, e2 = 3
        //  从后往前比
        while(i<= e1 && i<=e2) {
            const n1 = c1[e1]
            const n2 = c2[e2]
            if(isSameVNode(n1, n2)) {
                patch(n1, n2, el) // 深度遍历
            } else {
                break
            }
            e1--
            e2--
        }
        // i = 2, e1 = 1, e2 = 2
        // 我要知道是添加还是删除， i比e1大说明新的长老的短
        // 同序列挂载
        if(i > e1) { // 新增
            if(i <= e2) {
                while(i<=e2) {
                    // 判断e2往前移动，那么e2的下一个值存在，意味着是向前插入
                    // 如果e2没动 那么e2下一个值就是空 意味着向后插入
                    const nextpos = e2 + 1
                    // vue2是看下一个元素存在不存在
                    // vue3是看下一个元素长度是否越界
                    // anchor是下一个节点的虚拟dom
                    const anchor = nextpos < c2.length ? c2[nextpos].el : null
                    console.log(anchor, 'anchor')
                    patch(null, c2[i], el, anchor) // 没有判断 向前还是向后插入
                    i++
                }
            }
        }
        // a b c d
        // a b        i = 2, e1 = 3, e2 = 1
        // d c b a
        //     b a    i = 0, e1 = 1, e2 = -1
        // 同序列卸载 
        // 老的多新的少
        else if(i > e2) {
            while(i<=e1) {
                unmount(c1[i])
                i++
            }
        }
        // a b c d e   f g
        // a b e c d h f g     i = 2, e1 = 4, e2 = 5
        // c d e
        // e c d h             
        let s1 = i // s1 -> e1
        let s2 = i // s2 -> e2
        // 这里复用老节点 key vue2 中根据老节点创建的索引表 vue3 中根据新的key 做了一个映射表
        const keyToNewIndexMap = new Map()
        for(let i = s2; i<=e2; i++) {
            const vnode = c2[i]
            keyToNewIndexMap.set(vnode.key, i)
        }
        // console.log(keyToNewIndexMap,'keyToNewIndexMap')
        // 有了新的映射表后，去老的映射表中查找一下，看一下是否存在，如果存在需要复用了
        const toBePatched = e2 - s2 + 1
        const newIndexToOldMapIndex = new Array(toBePatched).fill(0)
        for(let i = s1; i<=e1; i++) {
            const child = c1[i]
            const newIndex = keyToNewIndexMap.get(child.key) // 通过老的key来查找对应的心的索引
            // 如果没有newIndex有值说明有
            if(newIndex === undefined) {
                unmount(child)
            } else {
                // 对比两个属性
                // 如果前后两个能复用的，则比较这两个节点
                newIndexToOldMapIndex[newIndex - s2] = i + 1
                patch(child, c2[newIndex], el)
            }
        }
        // 写到这里，我们已经复用了节点，更新了复用节点的属性，差移动操作，和新的里面有老的中没有的操作
        // 如何知道 新的里面有 老的里面没有
        // console.log(newIndexToOldMapIndex, 'newIndexToOldMapIndex') // 对应的位置就是老索引+1
        for(let i = toBePatched - 1; i>=0; i--) {
            const nextIndex = s2 + i // 下一个元素的索引
            const nextChild = c2[nextIndex] // 先拿到h
            // 看一下h后面是否有值 有值就将h插入到这个元素的前面，没有值就是appendChild
            const anchor = nextIndex + 1 < c2.length ? (c2[nextIndex + 1]).el : null
            // 默认找到f 把 h 插入到f的前面
            if(newIndexToOldMapIndex[i] == 0) {
                // 需要创建元素再插入
                patch(null, nextChild, el, anchor) // 将h插入到了f前面
            }else {
                // 直接插入操作
                // 倒序插入
                hostInsert(nextChild.el, el, anchor)
                // 这个插入比较暴力，整个做一次移动，但是我们不需要优化不动的那一项
                // 【5， 3， 4， 0】
                // 索引1和2的不用动
                
            }
            
        }
    }

    const patchChildren = (n1, n2, el) => {
        // 比较 两方孩子差异
        const c1 = n1.children
        const c2 = n2.children

        const prevShapeFlag = n1.shapeFlag
        const shapeFlag = n2.shapeFlag
        // 新的是文本
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 老的是数组
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(c1, el)
            }
            if(c1 !== c2) {
                // 文本内容不相同
                hostSetElementText(el, c2)
            }
        } else {
            // 老的是数组
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // 新的是数组 diff算法 全量diff算法
                    patchKeyChildren(c1, c2, el)
                }else {
                    // 组新的不是数组
                    unmountChildren(c1, el)
                }
            } else {
                // 老的是文本
                if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    hostSetElementText(el, '')
                }
                // 新的是数组
                if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(c2, el)
                }
            }
        }
    }

    const patchElement = (n1, n2) => { // 比对n1n2的属性差异
        let el = (n2.el = n1.el) // 复用元素
        const oldProps = n1.props || {}
        const newProps = n2.props || {}
        patchProps(oldProps, newProps, el)
        patchChildren(n1, n2, el)
    }

    const processElement = (n1, n2, container, anchor) => {
        if(n1 == null) {
            // 初次渲染
            mountElement(n2, container, anchor)
        } else {
            // diff算法
            patchElement(n1, n2)
        }
    }

    const patch = (n1, n2, container, anchor = null) => {
        // console.log(n1, n2, 'n1-n2')
        if(n1 == n2) {
            return // 无需更新
        }
        // n1 div => n2 p n1n2都有值，但是类型不同删除n1 换n2
        if(n1 && !isSameVNode(n1, n2)) {
            unmount(n1); // 删除节点
            n1 = null
        }
        processElement(n1, n2, container, anchor)
    }

    const unmount = (vnode) => hostRemove(vnode.el)

    const render = (vnode, container) => {
        // console.log(container, 'container')
        // vnode + dom api = 真是dom => 插入到container中
        if(vnode == null) { 
            // 卸载 删除节点
            if(container._vnode) { // 说明渲染过了才需要进行卸载
                unmount(container._vnode)
            }
        }else {
            // 初次渲染 更新
            patch(container._vnode || null, vnode, container)
        }
        container._vnode = vnode
    }
    return {
        // createrRenderer 可以用户自定义渲染方式
        // createrRenderer 返回的render方法 接受参数是虚拟节点和容器
        render
    }
}
