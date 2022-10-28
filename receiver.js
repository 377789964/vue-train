let person = {
    name: 'jw',
    get aliasName() { // this指向person
        return '**' + this.name + '**'
    }
}
let proxy = new Proxy(person, {
    get(target, key, receiver) {
        console.log(key)
        // return target[key] // person.aliasName
        return Reflect.get(target, key, receiver) // 修改this.name中this指向proxy
    },
    set(target, key, value, receiver) {
        target[key] = value
        return Reflect.set(target, key, value, receiver)
    }
})
// 用户只监控到了aliasName，没有监控到this.name取值
console.log(proxy.aliasName) // aliasName取值触发了name的取值
