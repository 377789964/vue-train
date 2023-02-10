import { ShapeFlags } from "@vue/shared"

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

    const mountElemet = (vnode, container) => {
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
        hostInsert(el, container)
    }

    const patch = (n1, n2, container) => {
        if(n1 == n2) {
            return // 无需更新
        }
        if(n1 == null) {
            // 初次渲染
            mountElemet(n2, container)
        } else {
            // diff算法

        }
    }

    const render = (vnode, container) => {
        // console.log(container, 'container')
        // vnode + dom api = 真是dom => 插入到container中
        if(vnode == null) { 
            // 卸载 删除节点

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
