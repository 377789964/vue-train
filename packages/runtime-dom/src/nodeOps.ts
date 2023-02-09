// 元素的增删改查，查找关系 文本增删改查

export const nodeOps = {
    createElement(tagName) {
        return document.createElement(tagName)
    },
    insert(child, parent, anchor) {
        // 有移动性  a b c d -> a c b d
        parent.inserBefore(child, anchor || null)
    },
    remove(child) {
        const parent = child.parentNode
        if(parent) {
            parent.removeChild(child)
        }
    },
    querySelector(selector) {
        return document.querySelector(selector)
    },
    parentNode(node) {
        return node.parentNode
    },
    nextSibling(node) {
        return node.nextSibling
    },
    setElementText(el, text) {
        el.textContent = text // innerHTMTL不太安全
    },
    createText(text) {
        return document.createTextNode(text)
    },
    setText(node, text) {
        node.nodeValue = text
    }
}