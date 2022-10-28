// import { ReactiveEffect } from "vue";
export let activeEffect;

class ReactiveEffect {
    public active = true;
    public deps = [];
    public parent = undefined
    constructor(public fn) {}
    run() {
        if(!this.active) { // 停止操作
            return this.fn() // 直接执行函数
        }
        // 其他状态 意味着是激活的状态
        try {
            this.parent = activeEffect
            activeEffect = this
            return this.fn()
        } finally {
            activeEffect = this.parent
            this.parent = undefined
        }
        
    }
}
// 依赖收集就是吧当前的efect变成全局的，稍后取值的时候可以拿到这个
export function effect(fn) {
    const _effect = new ReactiveEffect(fn)
    _effect.run(); // 默认执行一次

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
    let shouldTrack = !dep.has(activeEffect)
    if(shouldTrack) {
        dep.add(activeEffect)
        activeEffect.deps.push(dep);
    }
    console.log(targetMap, depsMap, activeEffect)
}
