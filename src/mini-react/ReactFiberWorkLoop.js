import { isStr, isFn, Placement, Update, updateNode } from "./utils";
import {
  updateHostComponent,
  updateFunctionComponent,
} from "./ReactFiberReconcile";

let workInProgressRoot = null;
let nextUnitOfWork = null;

export function scheduleUpdateOnFiber(fiber) {
  fiber.alternate = { ...fiber }; // 将当前工作的hook缓存到alternate上
  workInProgressRoot = fiber;
  nextUnitOfWork = workInProgressRoot;
}

// 当浏览器有空闲时间的时候就会调用这个方法
window.requestIdleCallback(workLoop);

function workLoop(idleDeadline) {
  // 有耗时任务并且有空闲时间
  while (nextUnitOfWork && idleDeadline.timeRemaining() > 0) {
    // 更新当前任务
    // 返回下一个任务
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  // 没有任务了
  if (!nextUnitOfWork && workInProgressRoot) {
    commitRoot();
  }

  // 当前渲染任务都执行完之后继续等待可能的更新任务
  window.requestIdleCallback(workLoop);
}

function performUnitOfWork(workInProgress) {
  // 1 更新当前任务
  const { type } = workInProgress;
  if (isStr(type)) {
    // 当前任务节点类型是原生标签
    updateHostComponent(workInProgress);
  } else if (isFn(type)) {
    updateFunctionComponent(workInProgress);
  }
  // 2 返回下一个任务
  // 深度优先
  // 对应 Fiber 中的 child，下一个节点
  if (workInProgress.child) {
    return workInProgress.child;
  }

  let next = workInProgress; // 当前正在运行的任务 Fiber
  while (next) {
    if (next.sibling) {
      return next.sibling;
    }

    // 没有子节点也没有兄弟节点就网上查找
    next = next.return;
  }

  // 已经没有任务了
  return null;
}

function commitRoot() {
  isFn(workInProgressRoot.type)
    ? commitWorker(workInProgressRoot)
    : commitWorker(workInProgressRoot.child);
  workInProgressRoot = null;
}

function commitWorker(workInProgress) {
  if (!workInProgress) {
    return;
  }
  // 1 更新自己
  // vnode => node
  const { flags, stateNode } = workInProgress;
  // 函数组件没有dom
  let parentNode = getParentNode(workInProgress); // workInProgress.return.stateNode;
  if (flags & Placement && stateNode) {
    parentNode.appendChild(stateNode);
  }

  if (flags & Update && stateNode) {
    updateNode(stateNode, workInProgress.alternate.props, workInProgress.props);
  }
  // 2 更新子节点
  commitWorker(workInProgress.child);
  // 3 更新兄弟节点
  commitWorker(workInProgress.sibling);
}

function getParentNode(workInProgress) {
  let temp = workInProgress.return;
  while (temp) {
    if (temp.stateNode) {
      return temp.stateNode;
    }

    temp = temp.return;
  }
}
