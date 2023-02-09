export const patchClass = (el, value) => {
    if(value == null) { // 如果没有类名 则移除操作
        el.removeAttribute('calss')
    } else {
        el.className = value
    }
}
