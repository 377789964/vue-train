import { isObject } from "@vue/shared";
import { activeEffect, trackEffect, triggerEffect} from "./effect";
import { reactive } from "./reactive";

export function ref(value) {
    return new RefImpl(value)
}

export function isRef(value) {
    return !!(value && value.__v_isRef)
}

function toReactive(value) {
    return isObject(value) ? reactive(value) : value
}

class RefImpl {
    dep = undefined;
    _value;
    __v_isRef = true
    constructor(public rawValue) {
        this._value = toReactive(rawValue)
    }
    get value() {
        // 依赖收集
        if (activeEffect) {
            trackEffect(this.dep || (this.dep = new Set()))
        }
        return this._value
    }
    set value(newValue) {
        if(newValue !== this.rawValue) {
            this._value = toReactive(newValue)
            this.rawValue = newValue
            // 触发更新
            triggerEffect(this.dep)
        }
    }
}

class ObjectRefImpl {
    __v_isRef = true
    constructor(public _object, public _key) {}
    get value() {
        return this._object[this._key]
    }
    set value(newValue) {
        this._object[this._key] = newValue
    }
}

export function toRef(target, key) {
    return new ObjectRefImpl(target, key)
}

export function toRefs(target) {
    const ret = {}
    for(let key in target) {
        ret[key] = toRef(target, key)
    }
    return ret
}

export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key, receiver) {
            let v = Reflect.get(target, key, receiver)
            return v.__v_isRef ? v.value : v
        },
        set(target, key, value, receiver) {
            const oldValue = target[key]
            if (oldValue.__v_isRef) {
                oldValue.value = value
                return true
            }
            return Reflect.set(target, key, value, receiver)
        }
    })
}
