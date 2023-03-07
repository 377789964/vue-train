import { currentInstance } from "./component";

export function provide(key, value) {
    // console.log('000000')
    // 如何判断是不是在组件中 在setup中
    if(!currentInstance) return
    // console.log(currentInstance, 'currentInstance')

    // 第一次我的provides 来自于父亲的
    // 所以一样就拷贝一个自己的
    // 下一次调用provides 用的是自己的provide肯定和父亲的不是一个
    // 我就不创建provides了

    let provides = currentInstance.provides

    // 我要知道在当前组件中我是第一次调用provide 还是不是第一次 
    const parentProvides = currentInstance.parent && currentInstance.parent.provides

    if(provides === parentProvides) {
        // 每个组件都有自己的provides 这样实现每次调用provide 都会产生一个新的对象
        provides = currentInstance.provides = Object.create(provides)
    }
    provides[key] = value
    // console.log(currentInstance.provides, '--')
}

export function inject(key, value) {
    // 在setup中才有效
    if(!currentInstance) return

    const provides = currentInstance.parent.provides
    // console.log(provides, 'provides')
    // 上级有且提供过这个属性
    if (provides && key in provides) {
        // console.log(provides[key], 'value')
        return provides[key]
    } else if(value) {
        return value
    }

}
