import { reactive, ReactiveEffect } from "@vue/reactivity"
import { ShapeFlags, invokeArrayFn } from "@vue/shared"
import { isSameVNode, Text, Fragment, isVnode } from "./vnode"
import { queueJob } from "./scheduler"
import { createComponentInstance, setupComponent } from './component'
import { isKeepAlive } from "./keep-alive"

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

    const  mountChildren = (children, el, anchor = null, parent = null) => {
        for(let i = 0; i < children.length; i++) {
            patch(null, children[i], el, anchor)
        }
    }

    const  unmountChildren = (children, parent) => {
        for(let i = 0; i < children.length; i++) {
            unmount(children[i], parent)
        }
    }

    const mountElement = (vnode, container, anchor, parent) => {
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
            mountChildren(children, el, anchor, parent)
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
                unmount(c1[i], parent)
                i++
            }
        } else {
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
                let newIndex = keyToNewIndexMap.get(child.key) // 通过老的key来查找对应的心的索引
                // 如果没有newIndex有值说明有
                if(newIndex == undefined) {
                    unmount(child, parent)
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

            // [5, 3, 4, 0]
            // [0, 1, 2, 3]
            // [1, 2]
            const seq = getSequence(newIndexToOldMapIndex)

            let j = seq.length - 1 // 获取seq最后的索引
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
                    // 在最长递增子序列中不用动,不在则需要移动
                    if(i !== seq[j]) {
                        // 直接插入操作
                        // 倒序插入
                        hostInsert(nextChild.el, el, anchor)
                        // 这个插入比较暴力，整个做一次移动，但是我们不需要优化不动的那一项
                        // 【5， 3， 4， 0】
                        // 索引1和2的不用动
                    } else {
                        j--
                    }
                }
            }
        }
        
    }

    const patchChildren = (n1, n2, el, parent) => {
        // 比较 两方孩子差异
        const c1 = n1.children
        const c2 = n2.children

        const prevShapeFlag = n1.shapeFlag
        const shapeFlag = n2.shapeFlag
        // 新的是文本
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 老的是数组
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(c1, parent)
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
                    unmountChildren(c1, parent)
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

    const patchElement = (n1, n2, parent) => { // 比对n1n2的属性差异
        let el = (n2.el = n1.el) // 复用元素
        const oldProps = n1.props || {}
        const newProps = n2.props || {}
        patchProps(oldProps, newProps, el)
        patchChildren(n1, n2, el, parent)
    }

    const processElement = (n1, n2, container, anchor, parent) => {
        if(n1 == null) {
            // 初次渲染
            mountElement(n2, container, anchor, parent)
        } else {
            // diff算法
            patchElement(n1, n2, parent)
        }
    }

    const processText = (n1, n2, el) => {
        if(n1 == null) {
            hostInsert((n2.el = hostCreateText(n2.children)),el )
        } else {
            let el = (n2.el = n1.el)
            if(n1.children != n2.children) {
                hostSetText(el, n2.children)
            }
        }
    }

    const processFragment = (n1, n2, el, parent) => {
        if(n1 == null) {
            mountChildren(n2.children, el, null, parent)
        } else {
            patchKeyChildren(n1.children, n2.children, el)
        }
    }

    const mountComponent = (vnode, container, anchor, parent) => {
        // 1. 创建实例
        const instance = (vnode.component = createComponentInstance(vnode, parent))
        console.log(vnode, 'vnode.component')
        // 2. 实例赋值属性
        // console.log(vnode, isKeepAlive(vnode), 'isKeepAlive')
        if(isKeepAlive(vnode)) {
            // console.log('---')
            // 给keep-alive的ctx上增添一个属性
            (instance.ctx as any).renderer = {
                createElement: hostCreateElement,
                move(vnode, container) {
                  hostInsert(vnode.component.subTree.el, container);
                }
            }
        }

        setupComponent(instance)
        // 3. 创建组件的effect
        setupRenderEffect(instance, container, anchor)
        
    }

    // const updateSlots = () => {

    // }

    const updateProps = (prevProps, nextProps) => {
        // 样式diff
        for(const key in nextProps) {
            prevProps[key] = nextProps[key]
        }
        for(const key in prevProps) {
            if(!(key in nextProps)) {
                delete prevProps[key]
            }
        }
    }

    const updateComponentPreRender = (instance, next) => {
        instance.next = null
        instance.vnode = next // 用新节点换掉老节点
        // instance.props.a = 'xxxx'
        updateProps(instance.props, next.props)
        // 将新的children 合并到插槽中
        // updateSlots()
        // instance.slots = next.children
        Object.assign(instance.slots, next.children)
    }

    const setupRenderEffect = (instance, container, anchor) => {
        const { render } = instance
        // console.log(render, 'render')
        const componentFn = () => {
            const { bm, m } = instance
            // console.log(m, 'm')
            // 稍后组件更新也是执行这个方法
            // 这里会做依赖手机，数据变化回再次调用effect
            if (!instance.isMounted) {
                if(bm) {
                    invokeArrayFn(bm)
                }
                // 第一次挂载组件
                const subTree = render.call(instance.proxy,instance.proxy)
                // 参数instance是父组件
                patch(null, subTree, container, anchor, instance)
                instance.subTree = subTree
                instance.isMounted = true
                if(m) {
                    invokeArrayFn(m)
                }
            } else {
                // 更新组件
                // 更新需要拿到最新的属性 和 插槽 扩展到原来的实例上
                let { next, bu, u } = instance
                if(next) {
                    // 如果有next 说明属性变了或者插槽 更新了
                    // 属性赋值会导致页面更新（响应式数据）
                    updateComponentPreRender(instance, next)
                }
                if(bu) {
                    invokeArrayFn(bu)
                }
                const subTree = render.call(instance.proxy, instance.proxy)
                patch(instance.subTree, subTree, container, anchor, instance)
                instance.subTree = subTree

                if(u) {
                    invokeArrayFn(u)
                }
            }
        }
        const effect = new ReactiveEffect(componentFn, ()=>{
            // 需要做异步更新
            // console.log(instance, 'instance.update')
            queueJob(instance.update)
        })
        const update = (instance.update = effect.run.bind(effect))
        update() // 强制更新
    }

    const hasPropsChange = (prevProps = {}, nextProps = {}) => {
        let l1 = Object.keys(prevProps)
        let l2 = Object.keys(nextProps)
        if(l1.length !== l2.length) {
            return true
        }
        for(let i = 0; i<l1.length; i++) {
            const key = l2[i]
            if(nextProps[key] !== prevProps[key]){
                return true
            }
        }
        return false
    }

    const shouldComponentUpdate = (n1, n2) => {
        const { prop: prevProps, children: prevChildren } = n1
        const { prop: nextProps, children: nextChildren } = n2

        // 对于插槽而言，只要前后有插槽 那么意味着组件要更新
        if(prevChildren || nextChildren) return true
        if(prevProps === nextProps) return true
        return hasPropsChange(prevProps, nextProps)
    }

    const updateComponent = (n1, n2) => {
        console.log('gegnxin')
        let instance = (n2.component = n1.component)
        // 如果组件需要更新 调用更新方法
        if(shouldComponentUpdate(n1, n2)) {
            // 比对属性和插槽 看要不要更新
            instance.next = n2 // 我们将新的虚拟节点挂载到实例上
            instance.update()
        }
    }

    const processComponent = (n1, n2, container, anchor = null, parent) => {
        if(n1 == null) {
            if(n2.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
                return parent.ctx.activate(n2, container)
            }
            // 初次渲染
            mountComponent(n2, container, anchor, parent)
        } else {
            // debugger
            // 组件更新 指代的组件的属性 更新 插槽更新
            let instance = (n2.component = n1.component)
            // console.log(instance, 'instance')
            // instance.props.a = 'xxxx'
            // instance.props.a = n2.props.a

            // todo...
            updateComponent(n1, n2)
        }
    }

    // 每次增加类型需要考虑 初始化 更新 销毁
    const patch = (n1, n2, container, anchor = null, parent = null) => {
        // console.log(n1, n2, 'n1-n2')
        if(n1 == n2) {
            return // 无需更新
        }

        // n1 div => n2 p n1n2都有值，但是类型不同删除n1 换n2
        if(n1 && !isSameVNode(n1, n2)) {
            unmount(n1, parent); // 删除节点
            n1 = null
        }

        // n2新节点
        let { shapeFlag, type } = n2
        switch(type){
            case Text:
                // 处理文本
                processText(n1, n2, container)
                break;
            case Fragment:
                // 处理碎片（多个div）
                processFragment(n1, n2, container, parent)
                break;
            default:
                if(shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor, parent)
                } else if(shapeFlag & ShapeFlags.COMPONENT){
                    processComponent(n1, n2, container, null, parent)
                } else if(shapeFlag & ShapeFlags.TELEPORT) {
                    type.process(n1, n2, container, anchor, {
                        mountChildren,
                        patchChildren,
                        query: hostQuerySelector,
                        move(vnode, container, anchor) {
                            hostInsert(vnode.component ? vnode.component.subTree.el : vnode.el, container, anchor)
                        }
                    })
                }
        }
    }

    const unmount = (vnode, parent) => {
        const { shapeFlag } = vnode
        if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
            // 我需要将这个真实dom 隐藏掉
      
            // 调用当前组件的父亲的keep-alive 让取把dom隐藏掉
            console.log(vnode, 'unmount')
            parent.ctx.deactivate(vnode);
            return;
          }
        if(vnode.type === Fragment) {
            return unmountChildren(vnode.children, parent)
        } else if(shapeFlag & ShapeFlags.COMPONENT) {
            // 组件如何卸载 组件渲染的是谁？ subTree
            return unmount(vnode.component.subTree, parent)
        }
        hostRemove(vnode.el)
    }

    const render = (vnode, container, parent = null) => {
        // console.log(container, 'container')
        // vnode + dom api = 真是dom => 插入到container中
        if(vnode == null) { 
            // 卸载 删除节点
            if(container._vnode) { // 说明渲染过了才需要进行卸载
                unmount(container._vnode, parent)
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

function getSequence(arr) {
    let len = arr.length; // 总长度
    let result = [0]; // 默认连续的最终结果 组成的索引 
    let resultLastIndex;
    let start;
    let end;
    let middle;
    let p = arr.slice(0); // 用来标识索引的
    for (let i = 0; i < len; i++) {
        const arrI = arr[i]
        // vue中如果序列中出现0 忽略就可以， vue中序列不会出现0
        if(arrI !== 0) {
            resultLastIndex = result[result.length - 1]
            if(arr[resultLastIndex] < arrI) {
                result.push(i)
                p[i]  = resultLastIndex // 让当前最后一项记住前一项的索引
                continue
            }
            // 这里会出现 当前项比最后一项的值大
            start = 0;
            end = result.length - 1
            while(start < end) {
                middle = (start + end) / 2 | 0
                if(arr[result[middle]] < arrI) {
                    start = middle + 1
                } else {
                    end = middle
                }
            }
            // middle 就是第一个比当前值大的值
            if (arrI < arr[result[start]]) {
                p[i] = result[start - 1] // 记住换的那个人的前一项的索引
                result[start] = i
            }
        }
    }
    // 追溯
    let i = result.length // 获取数组长度
    let last = result[i - 1] // 最后一项的索引
    while (i-- > 0) { 
        result[i] = last // 用最后一项索引的来追溯源
        last = p[last] // 用p中的索引来进行追溯
    }
    return result
}
