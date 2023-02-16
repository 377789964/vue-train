export const patchStyle = (el, prev, next) => {
    const style = el.style // 稍后更新 el.style属性
    if(next) {
        for(let key in next) {
            style[key] = next[key]
        }
        // 老得有新的没有要移除
        for(let key in prev) {
            if(next[key] == null) {
                style[key] = null
            }
        }
    } else {
        el.removeAttribute('style') // 新的dom上没有样式
    }
}
