import { isFunction } from '@vue/shared'
import { activeEffect, ReactiveEffect, trackEffect, triggerEffect } from './effect';

const noop = () => {}

class ComputedRefImpl {
    public dep = undefined;
    public effect = undefined;
    public __v_isRef = true; // 有这个属性表示需要用.value取值
    public _ditry = true;
    public _value; // 默认的缓存结果
    constructor(getter, public setter) {
        // 这里源码中不能使用effect(() => {}),因为功能是访问才会执行不是默认执行
        this.effect = new ReactiveEffect(getter, ()=>{
            this._ditry = true
            //  如果值被修改了，手动执行计算属性依赖的effect
            triggerEffect(this.dep)
        })
    }
    // vue2的属性访问器，defineProperty(实例, vlaue, {get})
    get value() { // 取值才执行
        if (activeEffect) {
            // 如果有activeEffect意味着这个计算属性是在effect中使用
            // 需要让计算属性收集这个effect
            // 用户取值进行依赖收集
            trackEffect(this.dep || (this.dep = new Set()))
        }
        if (this._ditry) {
            this._value = this.effect.run() // 缓存执行后的结果
            this._ditry = false // 意味着取过值了
            return this._value
        }
         return this._value
    }
     set value(newValue) {
        this.setter(newValue)
     } 
}

export function computed(getterOrOptions) {
    let onlyGetter = isFunction(getterOrOptions)
    let getter
    let setter
    if (onlyGetter) {
        getter = onlyGetter
        setter = noop
    } else {
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }

    // getter方法必须存在

    return new ComputedRefImpl(getter, setter)
}