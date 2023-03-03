import { Fragment, Text } from "./vnode"
import { h } from "./h"
import { ref } from '@vue/reactivity'

export function defineAsyncComponent(options) {
    if(typeof options === 'function'){
        options = { loader: options }
    }

    let Component = null
    let timer = null
    let loadingTimer = null
    return {
        setup() {
            let { loader } = options
            const loaded = ref(false)
            const error = ref(false)
            const loading = ref(false)

            function load() {
                return loader().catch(err => {
                    if(options.onError) {
                        return new Promise((resolve, reject) => {
                            // 一个promise会等待另一个promise执行完毕
                            const retry = () => resolve(load())
                            const  fail = () => reject(err)
                            options.onError(err, retry, fail)
                        })
                    } else {
                        throw err
                    }
                })
            }
            
            if(options.delay) {
                loadingTimer = setTimeout(() => {
                    loading.value = true
                }, options.delay)
            }
            
            load().then(c => {
                Component = c
                loaded.value = true
                clearTimeout(timer)
            }).catch(err => {
                error.value = true
            }).finally(() => {
                loading.value = false
                clearTimeout(loadingTimer)
            })

            if (options.timeout) {
                timer = setTimeout(() => {
                    error.value = true
                }, options.timeout)
            }

            return () => {
                if(loaded.value) {
                    return h(Component)
                }else if(error.value&&options.errorComponent) {
                    return h(options.errorComponent)
                }else if(loading.value&&options.loadingComponent) {
                    return h(options.loadingComponent)
                }
                return h(Fragment, [])
            }
        }
    }
}