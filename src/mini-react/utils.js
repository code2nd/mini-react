// ! flags
export const noFlags = /*      */ 0b0000_0000_0000_0000;
export const Placement = /*    */ 0b0000_0000_0000_0010; // 2
export const Update = /*       */ 0b0000_0000_0000_0100; // 4
export const Deletion = /*     */ 0b0000_0000_0000_0100; // 8

export function isStr(str) {
  return typeof str === "string";
}

export function isStrOrNum(p) {
  return ["string", "number"].includes(typeof p);
}

export function isArray(arr) {
  return arr instanceof Array;
}

export function isFn(f) {
  return typeof f === "function";
}

// 更新原生标签的属性，如className、href、id（string、事件）等
/* export function updateNode(node, props) {
  Object.keys(props).forEach((k) => {
    // 属性为 children
    if (k === "children") {
      // 有可能为文本或数字
      if (isStrOrNum(props[k])) {
        node.textContent = props[k] + "";
      }
    } else if (k.slice(0, 2) === "on") {
      // 属性为事件
      const eventName = k.slice(2).toLocaleLowerCase();
      node.addEventListener(eventName, props[k]);
    } else {
      // 普通属性
      node[k] = props[k];
    }
  });
} */

export function updateNode(node, preProps, nextProps) {
  Object.keys(preProps).forEach((k) => {
    // 属性为 children
    if (k === "children") {
      // 有可能为文本或数字
      if (isStrOrNum(preProps[k])) {
        node.textContent = "";
      }
    } else if (k.slice(0, 2) === "on") {
      // 属性为事件
      const eventName = k.slice(2).toLocaleLowerCase();
      node.removeEventListener(eventName, preProps[k]);
    } else {
      if (!(k in nextProps)) {
        node[k] = "";
      }
    }
  });

  Object.keys(nextProps).forEach((k) => {
    if (k === "children") {
      // 有可能是文本
      if (isStrOrNum(nextProps[k])) {
        node.textContent = nextProps[k] + "";
      }
    } else if (k.slice(0, 2) === "on") {
      const eventName = k.slice(2).toLocaleLowerCase();
      node.addEventListener(eventName, nextProps[k]);
    } else {
      node[k] = nextProps[k];
    }
  });
}

export function sameNode(a, b) {
  return !!(a && b && a.type === b.type && a.key === b.key);
}
