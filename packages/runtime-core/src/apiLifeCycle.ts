import { currentInstance, setCurrentInstance } from "./component"

export const enum LifecycleHooks {
    BEFORE_MOUNT = 'bm',
    MOUNTED = 'm',
    BEFORE_UPDATE = 'bu',
    UPDATED = 'u'
}

// bm = []
// bu = []
// m = []
// u = []

function createHook(type) {
    // type 是绑定到哪里 hook 就是用户传递的钩子 获取当前的实例

    // instance[type] = hook
    return (hook, target = currentInstance) => {
        if(target) {
            // 生命周期 必须在setup中使用
            const wrapperHook = () => {
                setCurrentInstance(target)
                hook()
                setCurrentInstance(null)
            }
            const hooks = target[type] || (target[type] = [])
            hooks.push(wrapperHook)
        }
        // console.log(target, 'createHook')
    }
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)

export const onMounted = createHook(LifecycleHooks.MOUNTED)

export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)

export const onUpdated = createHook(LifecycleHooks.UPDATED)
