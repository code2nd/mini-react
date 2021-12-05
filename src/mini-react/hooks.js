import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

// 当前正在渲染的fiber
let currentlyRenderingFiber = null;
let workInProgressHook = null; // 缓存当前工作中的hook，方便插入下一个hook

export function renderHooks(workInProgress) {
  currentlyRenderingFiber = workInProgress;
  currentlyRenderingFiber.memoizedState = null; // hooks链表头节点
  workInProgressHook = null;
}

function updateWorkInProgressHook() {
  let hook;
  // 判断是初次渲染还是更新
  // 老节点
  const oldNode = currentlyRenderingFiber.alternate;
  if (oldNode) {
    // 有老节点就是更新阶段
    // 从老的fiber上找到hook更新到新的fiber上
    currentlyRenderingFiber.memoizedState = oldNode.memoizedState;
    if (workInProgressHook) {
      hook = workInProgressHook = workInProgressHook.next;
    } else {
      hook = workInProgressHook = oldNode.memoizedState;
    }
  } else {
    // 初次渲染
    hook = {
      memoizedState: null,
      next: null,
    };

    if (workInProgressHook) {
      workInProgressHook.next = hook;
    } else {
      workInProgressHook = currentlyRenderingFiber.memoizedState = hook;
    }
  }

  return hook;
}

export function useState(initialState) {
  return handleState(initialState)();
}

export function useReducer(reducer, initialState) {
  return handleState(initialState)(reducer);
}

function handleState(initialState) {
  // 获取当前工作中的hook
  const hook = updateWorkInProgressHook();

  // 如果没有老hook，则为初始渲染
  if (!currentlyRenderingFiber.alternate) {
    // 初始渲染，将initialState赋值给memoizedState
    hook.memoizedState = initialState;
  }

  return function (reducer = undefined) {
    const dispatch = (action) => {
      // dispatch派发action，计算并更新状态值
      // 1 计算新的state
      hook.memoizedState = reducer
        ? reducer(hook.memoizedState, action)
        : action;
      // 2 更新state
      scheduleUpdateOnFiber(currentlyRenderingFiber);
    };

    return [hook.memoizedState, dispatch];
  };
}
