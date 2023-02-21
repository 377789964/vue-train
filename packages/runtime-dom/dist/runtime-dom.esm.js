// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  createElement(tagName) {
    return document.createElement(tagName);
  },
  insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
  },
  remove(child) {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  querySelector(selector) {
    return document.querySelector(selector);
  },
  parentNode(node) {
    return node.parentNode;
  },
  nextSibling(node) {
    return node.nextSibling;
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  createText(text) {
    return document.createTextNode(text);
  },
  setText(node, text) {
    node.nodeValue = text;
  }
};

// packages/runtime-dom/src/class.ts
var patchClass = (el, value) => {
  if (value == null) {
    el.removeAttribute("calss");
  } else {
    el.className = value;
  }
};

// packages/runtime-dom/src/style.ts
var patchStyle = (el, prev, next) => {
  const style = el.style;
  if (next) {
    for (let key in next) {
      style[key] = next[key];
    }
    for (let key in prev) {
      if (next[key] == null) {
        style[key] = null;
      }
    }
  } else {
    el.removeAttribute("style");
  }
};

// packages/runtime-dom/src/event.ts
function createInvoker(intialValue) {
  const invoker = (e) => invoker.value(e);
  invoker.value = intialValue;
  return invoker;
}
function patchEvent(el, key, nextValue) {
  const invokers = el._vei || (el._vai = {});
  const name = key.slice(2).toLowerCase();
  const exisitingInvoker = invokers[name];
  if (nextValue && exisitingInvoker) {
    exisitingInvoker.value = nextValue;
  } else {
    if (nextValue) {
      const invoker = invokers[name] = createInvoker(nextValue);
      el.addEventListener(name, invoker);
    } else if (exisitingInvoker) {
      el.removeEventListener(name, exisitingInvoker);
      invokers[name] = null;
    }
  }
}

// packages/runtime-dom/src/attr.ts
var patchAttr = (el, key, value) => {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
};

// packages/runtime-dom/src/patchProp.ts
var patchProp = (el, key, prevValue, nextValue) => {
  if (key === "calss") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
};

// packages/shared/src/index.ts
function isObject(value) {
  return value !== null && typeof value == "object";
}
function isString(value) {
  return typeof value === "string";
}
var ownProperty = Object.prototype.hasOwnProperty;
var hasOwn = (key, value) => ownProperty.call(value, key);

// packages/runtime-core/src/vnode.ts
var Text = Symbol("text");
var Fragment = Symbol("fragment");
function isVnode(vnode) {
  return vnode.__v_isVnode == true;
}
function isSameVNode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
function createVNode(type, props = null, children = null) {
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 6 /* COMPONENT */ : 0;
  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    shapeFlag,
    key: props == null ? void 0 : props.key,
    el: null
  };
  if (children) {
    let type2 = 0;
    if (Array.isArray(children)) {
      type2 = 16 /* ARRAY_CHILDREN */;
    } else {
      type2 = 8 /* TEXT_CHILDREN */;
    }
    vnode.shapeFlag |= type2;
  }
  return vnode;
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l == 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

// packages/reactivity/src/effectScope.ts
var activeEffectScope;
function recordEffectScope(effect) {
  if (activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect);
  }
}

// packages/reactivity/src/effect.ts
var activeEffect;
function cleanupEffect(effect) {
  let { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect);
  }
  effect.deps.length = 0;
}
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
    this.deps = [];
    this.parent = void 0;
    recordEffectScope(this);
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    try {
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = void 0;
    }
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
};
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeEffect) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = /* @__PURE__ */ new Set());
  }
  trackEffect(dep);
}
function trackEffect(dep) {
  let shouldTrack = !dep.has(activeEffect);
  if (shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  triggerEffect(dep);
}
function triggerEffect(dep) {
  if (dep) {
    const effects = [...dep];
    effects.forEach((effect) => {
      if (activeEffect != effect) {
        if (!effect.scheduler) {
          effect.run();
        } else {
          effect.scheduler();
        }
      }
    });
  }
}

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if ("__v_isReactive" /* IS_REACTIVE */ === key) {
      return true;
    }
    track(target, key);
    let r = Reflect.get(target, key, receiver);
    if (isObject(r)) {
      return reactive(r);
    }
    return r;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    let r = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return r;
  }
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const existsProxy = reactiveMap.get(target);
  if (existsProxy) {
    return existsProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

// packages/runtime-core/src/scheduler.ts
var queue = [];
var isFlushing = false;
var resolvePromise = Promise.resolve();
var queueJob = (job) => {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    resolvePromise.then(() => {
      isFlushing = false;
      let copy = queue.slice(0);
      queue.length = 0;
      for (let i = 0; i < copy.length; i++) {
        const job2 = copy[i];
        job2();
      }
    });
  }
};

// packages/runtime-core/src/componentProps.ts
function initProps(instance, rawProps) {
  const props = {};
  const attrs = {};
  const options = instance.propsOptions;
  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];
      if (key in options) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.props = reactive(props);
  instance.attrs = attrs;
}

// packages/runtime-core/src/renderer.ts
function createRenderer(options) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    querySelector: hostQuerySelector
  } = options;
  const mountChildren = (children, el) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], el);
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };
  const mountElement = (vnode, container, anchor) => {
    const { type, props, children, shapeFlag } = vnode;
    const el = vnode.el = hostCreateElement(type);
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(children, el);
    } else if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    }
    hostInsert(el, container, anchor);
  };
  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev != next) {
          hostPatchProp(el, key, prev, next);
        }
      }
      for (let key in oldProps) {
        if (!(key in newProps)) {
          const prev = oldProps[key];
          hostPatchProp(el, key, prev, null);
        }
      }
    }
  };
  const patchKeyChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextpos = e2 + 1;
          const anchor = nextpos < c2.length ? c2[nextpos].el : null;
          console.log(anchor, "anchor");
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    } else {
      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (let i2 = s2; i2 <= e2; i2++) {
        const vnode = c2[i2];
        keyToNewIndexMap.set(vnode.key, i2);
      }
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldMapIndex = new Array(toBePatched).fill(0);
      for (let i2 = s1; i2 <= e1; i2++) {
        const child = c1[i2];
        const newIndex = keyToNewIndexMap.get(child.key);
        if (newIndex === void 0) {
          unmount(child);
        } else {
          newIndexToOldMapIndex[newIndex - s2] = i2 + 1;
          patch(child, c2[newIndex], el);
        }
      }
      const seq = getSequence(newIndexToOldMapIndex);
      let j = seq.length - 1;
      for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
        const nextIndex = s2 + i2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
        if (newIndexToOldMapIndex[i2] == 0) {
          patch(null, nextChild, el, anchor);
        } else {
          if (i2 !== seq[j]) {
            hostInsert(nextChild.el, el, anchor);
          } else {
            j--;
          }
        }
      }
    }
  };
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          patchKeyChildren(c1, c2, el);
        } else {
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2) => {
    let el = n2.el = n1.el;
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2);
    }
  };
  const processText = (n1, n2, el) => {
    if (n1 == null) {
      hostInsert(n2.el = hostCreateText(n2.children), el);
    } else {
      let el2 = n2.el = n1.el;
      if (n1.children != n2.children) {
        hostSetText(el2, n2.children);
      }
    }
  };
  const processFragment = (n1, n2, el) => {
    if (n1 == null) {
      mountChildren(n2.children, el);
    } else {
      patchKeyChildren(n1.children, n2.children, el);
    }
  };
  const mountComponent = (vnode, container, anchor) => {
    const { data = () => ({}), render: render3, props: propsOptions = {} } = vnode.type;
    const state = reactive(data());
    const instance = {
      data: state,
      isMounted: false,
      subTree: null,
      vnode,
      update: null,
      props: {},
      attrs: {},
      propsOptions,
      proxy: null
    };
    vnode.component = instance;
    initProps(instance, vnode.props);
    const publicProperties = {
      $attrs: (i) => i.attrs,
      $props: (i) => i.props
    };
    instance.proxy = new Proxy(instance, {
      get(target, key) {
        let { data: data2, props } = target;
        if (hasOwn(key, data2)) {
          return data2[key];
        } else if (hasOwn(key, props)) {
          return props[key];
        }
        let getter = publicProperties[key];
        if (getter) {
          return getter(target);
        }
      },
      set(target, key, value) {
        let { data: data2, props } = target;
        if (hasOwn(key, data2)) {
          data2[key] = value;
        } else if (hasOwn(key, props)) {
          console.log("props\u4E0D\u80FD\u4FEE\u6539");
          return false;
        }
        return true;
      }
    });
    const componentFn = () => {
      if (!instance.isMounted) {
        const subTree = render3.call(instance.proxy);
        patch(null, subTree, container, anchor);
        instance.subTree = subTree;
        instance.isMounted = true;
      } else {
        const subTree = render3.call(instance.proxy);
        patch(instance.subTree, subTree, container, anchor);
        instance.subTree = subTree;
      }
    };
    const effect = new ReactiveEffect(componentFn, () => {
      queueJob(instance.update);
    });
    const update = instance.update = effect.run.bind(effect);
    update();
  };
  const processComponent = (n1, n2, container, anchor = null) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor);
    } else {
      let instance = n2.component = n1.component;
      instance.props.a = n2.props.a;
    }
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 == n2) {
      return;
    }
    if (n1 && !isSameVNode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    let { shapeFlag, type } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & 1 /* ELEMENT */) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & 6 /* COMPONENT */) {
          processComponent(n1, n2, container);
        }
    }
  };
  const unmount = (vnode) => {
    if (vnode.type === Fragment) {
      return unmountChildren(vnode.children);
    }
    hostRemove(vnode.el);
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render: render2
  };
}
function getSequence(arr) {
  let len = arr.length;
  let result = [0];
  let resultLastIndex;
  let start;
  let end;
  let middle;
  let p = arr.slice(0);
  for (let i2 = 0; i2 < len; i2++) {
    const arrI = arr[i2];
    if (arrI !== 0) {
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        result.push(i2);
        p[i2] = resultLastIndex;
        continue;
      }
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = (start + end) / 2 | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arrI < arr[result[start]]) {
        p[i2] = result[start - 1];
        result[start] = i2;
      }
    }
  }
  let i = result.length;
  let last = result[i - 1];
  while (i-- > 0) {
    result[i] = last;
    last = p[last];
  }
  return result;
}

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign(nodeOps, { patchProp });
var render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container);
};
export {
  Fragment,
  Text,
  createRenderer,
  createVNode,
  h,
  isSameVNode,
  isVnode,
  render
};
//# sourceMappingURL=runtime-dom.esm.js.map
