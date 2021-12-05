import { FiberRootNode } from "./fiber";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

function render(vnode, container) {
  // 要渲染到container的vnode

  const fiberRoot = new FiberRootNode({
    type: container.nodeName.toLocaleLowerCase(),
    stateNode: container,
    props: {
      children: vnode,
    },
  });

  // 从 container 这一层开始更新
  scheduleUpdateOnFiber(fiberRoot);
}

const ReactDOM = {
  render,
};

export default ReactDOM;
