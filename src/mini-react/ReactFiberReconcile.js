import { isStr, updateNode, isArray, Update, sameNode } from "./utils";
import { createFiber } from "./fiber";
import { renderHooks } from "./hooks";

// 更新原生dom节点
export function updateHostComponent(workInProgress) {
  // 更新节点自己
  // console.log(workInProgress);
  if (!workInProgress.stateNode) {
    workInProgress.stateNode = createNode(workInProgress);
  }
  // 协调子节点
  reconcileChildren(workInProgress, workInProgress.props.children);
}

// 更新函数组件
export function updateFunctionComponent(workInProgress) {
  renderHooks(workInProgress);
  // 更新节点本身
  // 协调子节点
  const { type, props } = workInProgress;
  const children = type(props);
  reconcileChildren(workInProgress, children);
}

function createNode(vnode) {
  // 查看vnode，根据vnode相关信息生成node
  const { type, props } = vnode;
  const node = document.createElement(type);

  // 将属性值关联到节点上
  updateNode(node, {}, props);
  return node;
}

// 初次渲染、更新
// 更新新的fiber结构过程
function reconcileChildren(workInProgress, children) {
  // 文本节点
  if (isStr(children)) {
    return;
  }

  // 遍历子节点，第一个子节点为child，其他为sibling
  const newChildren = isArray(children) ? children : [children];
  let previousNewFiber = null;
  let oldFiber = workInProgress.alternate && workInProgress.alternate.child;
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    if (newChild === null) {
      continue;
    }
    const newFiber = createFiber(newChild, workInProgress);
    if (oldFiber) {
      const same = sameNode(oldFiber, newFiber);

      if (same) {
        Object.assign(newFiber, {
          alternate: oldFiber,
          stateNode: oldFiber.stateNode,
          flags: Update,
        });
      }

      oldFiber = oldFiber.sibling;
    }

    if (previousNewFiber === null) {
      workInProgress.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
  }
}
