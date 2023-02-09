// 对元素可以进行节点操作
import { nodeOps } from "./nodeOps";

import { patchProp } from "./patchProp"

const renderOptions = Object.assign(nodeOps, {patchProp})

// dom操作api
console.log(renderOptions, 'renderOptions')
