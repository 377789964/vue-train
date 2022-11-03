import { recordEffectScope } from "./effectScope";

// import { ReactiveEffect } from "vue";
export let activeEffect;

function cleanupEffect(effect) {
    // 每次执行effect之前，先清理effect中依赖的所有属性
    let { deps } = effect
    
    for(let i = 0; i<deps.length; i++) {
        deps[i].delete(effect)
    }
}

export class ReactiveEffect {
    public active = true;
    public deps = [];
    public parent = undefined
    constructor(public fn, private scheduler) {
        recordEffectScope(this)
    }
    run() {
        if(!this.active) { // 停止操作
            return this.fn() // 直接执行函数
        }
        // 其他状态 意味着是激活的状态
        try {
            this.parent = activeEffect
            activeEffect = this
            cleanupEffect(this)
            return this.fn()
        } finally {
            activeEffect = this.parent
            this.parent = undefined
        }
        
    }
    stop() {
        if (this.active) {
            cleanupEffect(this) // 首先清除effect
            this.active = false // 修改为失活状态
        } 
    }
}
// 依赖收集就是吧当前的efect变成全局的，稍后取值的时候可以拿到这个
export function effect(fn, options:any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)
    _effect.run(); // 默认执行一次
    // 保证_effect执行的时候this就是当前的effect
    const runner = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}

// let mapping = {
//     target: {
//         name: [activeEffect]
//     }
// }
const targetMap = new WeakMap();
export function track(target, key) {
    if(!activeEffect) {
        // 表示取值操作不在effect中
        return
    }
    let depsMap = targetMap.get(target)
    if(!depsMap) {
        // WeakMap中的key只能是对戏那个，所以当前使用map数据类型
        targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if(!dep) {
        depsMap.set(key, (dep = new Set()))
    }
    // let shouldTrack = !dep.has(activeEffect)
    // if(shouldTrack) {
    //     dep.add(activeEffect)
    //     activeEffect.deps.push(dep);
    // }
    trackEffect(dep)
    // console.log(targetMap, depsMap, activeEffect)
}

export function trackEffect(dep) {
    let shouldTrack = !dep.has(activeEffect)
    if(shouldTrack) {
        dep.add(activeEffect)
        activeEffect.deps.push(dep);
    }
}

export function trigger(target, key, newValue, oldValue) {
    const depsMap = targetMap.get(target)
    // console.log(depsMap, 'depsMap')
    if(!depsMap) {
        return
    }
    const dep = depsMap.get(key)
    triggerEffect(dep)
}
export function triggerEffect(dep) {
    if (dep) {
        const effects = [...dep]
        effects.forEach(effect => {
            // console.log(effect, 'trigger')
            // 当我重新执行effect时，会将当前的effect放在全局上activeEffect
            // 避免当前efect中修改了当前key的值，这样会死循环
            if (activeEffect != effect) {
                // console.log(effect, 'effect')
                if (!effect.scheduler) { // 如果没有scheduler执行run
                    effect.run()
                } else { // 如果有scheduler则执行scheduler不执行run
                    effect.scheduler()
                }
            }
        });
    }
}

// 默认执行了一个set，在当前的set中清空了effect，又向此set中添加了一项
