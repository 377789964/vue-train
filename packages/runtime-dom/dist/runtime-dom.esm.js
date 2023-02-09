// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  createElement(tagName) {
    return document.createElement(tagName);
  },
  insert(child, parent, anchor) {
    parent.inserBefore(child, anchor || null);
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
  for (let key in next) {
    style[key] = next(key);
  }
  for (let key in prev) {
    if (next[key] == null) {
      style[key] = null;
    }
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

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign(nodeOps, { patchProp });
console.log(renderOptions, "renderOptions");
//# sourceMappingURL=runtime-dom.esm.js.map
