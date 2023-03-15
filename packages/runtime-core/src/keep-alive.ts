import { ShapeFlags } from "@vue/shared"
import { getCurrentInstance } from "./component"
import { onMounted, onUpdated } from "./apiLifeCycle"
import { isVnode } from "./vnode"

export const KeepAliveImpl = {
    __isKeepAlive: true,

    setup(props, { slots }) {
        // 缓存的组件有哪些 方便查找 key 来描述
        // key 对应的组件的定义
        const keys = new Set()
        const cache = new Map()

        let pendingCacheKey = null
        const instance = getCurrentInstance()
        let { createElement, move } = instance.ctx.renderer
        let storageContainer = createElement('div')


        instance.ctx.activate =  function(vnode, container) {
            console.log(vnode, 'activate')
            // move(vnode, container) // 将刚才缓存的额dom放到容器中
        }

        instance.ctx.deactivate =  function(vnode) {
            console.log(vnode, 'deactivate')
            // move(vnode, storageContainer)
        }

        const cacheSubTree = () => {
            cache.set(pendingCacheKey, instance.subTree)

            console.log(cache, 'cache')
        }

        onMounted(cacheSubTree)
        onUpdated(cacheSubTree)

        return () => {
            let vnode = slots.default()
            if(!isVnode(vnode) || !(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {

                return vnode
            }

            const comp = vnode.type
            const key = vnode.props && vnode.props.key ? vnode.props.key : comp
            let cacheVNode = cache.get(key)
            pendingCacheKey = key // 在组件加载的时候缓存key的名字
            if(cacheVNode) {
                vnode.component = cacheVNode.component
            } else {
                keys.add(key)
            }
            // 稍后组件卸载的时候不要卸载组件，可以实现组件dom的复用
            vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
            return vnode
        }
    }
}

export const isKeepAlive = (vnode) => vnode.type.__isKeepAlive
