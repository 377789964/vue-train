export function isObject(value) {
    return value !== null && typeof value == 'object'
}

export function isFunction(value) {
    return typeof value === 'function'
}

export function isString(value) {
    return typeof value === 'string'
}

const ownProperty = Object.prototype.hasOwnProperty
export const hasOwn = (key, value) => ownProperty.call(value, key)


export * from './shapeFlags'