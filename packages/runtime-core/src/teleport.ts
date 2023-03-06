export const TeleportImpl = {
    __isTeleport: true, // 此组件是一个特殊的组件类型
    process(n1, n2, container, anchor, operators) {
        // 等会组件初始化的时候会调用此方法
        let { mountChildren, patchChildren, move, query } = operators
        if(!n1) {
            const target = (n2.target = query(n2.props.to))
            // console.log(target, 'target')
            if(target) {
                mountChildren(n2.children, target, anchor)
            }
        }else {
            patchChildren(n1, n2, n1.target) // 只是比较了儿子的差异
            n2.target = n1.target
            if(n1.props.to !== n2.props.to) {
                const nextTarget = n2.target = query(n2.props.to)
                n2.children.forEach(child => move(child, nextTarget, anchor))
            }
        }
    }
}

export const isTeleport = (type) => !!type.__isTeleport
