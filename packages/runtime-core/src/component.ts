import { initProps } from './componentProps'
import { hasOwn, isFunction } from "@vue/shared"
import { reactive } from '@vue/reactivity'

export function createComponentInstance(vnode) {
    const instance = { // 组件实例
        data: null,
        isMounted: false,
        subTree: null,
        vnode,
        update: null, // 组件的更新方法 effect.run()
        props: {},
        attrs: {},
        propsOptions: vnode.type.props || {},
        proxy: null
        // 组件的生命周期
        // 插槽
        // 组件的事件
    }
    return instance
}

const publicProperties = {
    $attrs: (i) => i.attrs,
    $props: (i) => i.props
}
const PublicInstancePropxyHandler = {
    get(target, key) {
        let { data, props } = target
        if(data && hasOwn(key, data)) {
            return data[key]
        } else if(props && hasOwn(key, props)) {
            return props[key]
        }
        let getter = publicProperties[key]
        if(getter) {
            return getter(target)
        }
    },
    set(target, key, value) {
        let { data, props } = target
        if(data && hasOwn(key, data)) {
            data[key] = value
        } else if(props && hasOwn(key, props)) {
            console.log('props不能修改')
            return false
        }
        return true
    }
}

export function setupComponent(instance) {
    const { type, props } = instance.vnode

    // h组件的虚拟节点   用户写的对象 props render
    // 组件的虚拟节点 就是 渲染组件的时候传递的props

    // 用户传递的props 和 把它解析成 attrs 和 props放到实例上
    initProps(instance, props)
    // 创建代理对象
    instance.proxy = new Proxy(instance, PublicInstancePropxyHandler)

    let data = type.data
    if(data) {
        // vue2 传递的data
        if(isFunction(data)){
            instance.data = reactive(data.call(instance.proxy))
        }

    }
    instance.render = type.render //
}

