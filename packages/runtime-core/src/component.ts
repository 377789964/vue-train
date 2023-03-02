import { initProps } from './componentProps'
import { hasOwn, isFunction, ShapeFlags } from "@vue/shared"
import { proxyRefs, reactive } from '@vue/reactivity'

// 当前正在执行的实例
export let currentInstance;

// 给用户在setup中使用的 可以获取当前的实例
export function getCurrentInstance() {
    return currentInstance
}

export function setCurrentInstance(instance) {
    return currentInstance = instance
}


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
        proxy: null,
        // 组件的生命周期
        // 插槽
        // 组件的事件
        setupState: null,
        exposed: {},
        slots: {}
    }
    return instance
}

const publicProperties = {
    $attrs: (i) => i.attrs,
    $props: (i) => i.props,
    $slots: (i) => i.slots
}
const PublicInstancePropxyHandler = {
    get(target, key) {
        let { data, props, setupState } = target
        if(data && hasOwn(key, data)) {
            return data[key]
        } else if(props && hasOwn(key, props)) {
            return props[key]
        } else if(setupState && hasOwn(key, setupState)) {
            return setupState[key]
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

const initSlots = (instance, children) => {
    if(instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
        instance.slots = children
    }
}

export function setupComponent(instance) {
    const { type, props, children } = instance.vnode

    // h组件的虚拟节点   用户写的对象 props render
    // 组件的虚拟节点 就是 渲染组件的时候传递的props

    // 用户传递的props 和 把它解析成 attrs 和 props放到实例上
    initProps(instance, props)
    // 处理插槽
    initSlots(instance, children)
    // 创建代理对象
    instance.proxy = new Proxy(instance, PublicInstancePropxyHandler)

    let { setup } = type

    if(setup) {
        const setupContext = {
            attrs: instance.sttrs,
            emit: (event, ...args) => {
                const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
                const handler = instance.vnode.props[eventName]
                handler && handler(...args)
            },
            expose(exposed){
                // ref获取的就是
                instance.exposed = exposed
            },
            slots: instance.slots
        }

        setCurrentInstance(instance)

        const setupResult = setup(instance.props, setupContext)

        setCurrentInstance(null)
        
        if(isFunction(setupResult)) {
            // 如果返回的是函数
            instance.render = setupResult
        } else {
            // 将返回数据作为了数据眼
            instance.setupState = proxyRefs(setupResult)
        }
    }

    let data = type.data
    if(data) {
        // vue2 传递的data
        if(isFunction(data)){
            instance.data = reactive(data.call(instance.proxy))
        }
    }
    if(!instance.render) {
        instance.render = type.render //
    }
}

