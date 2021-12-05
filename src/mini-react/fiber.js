import { Placement } from "./utils";

export function createFiber(vnode, returnFiber) {
  return new FiberNode({
    ...vnode,
    returnFiber,
  });
}

export class FiberRootNode {
  constructor({ type, key, props, stateNode, returnFiber }) {
    this.type = type;
    this.key = key;
    this.props = props;
    this.child = null;
    this.sibling = null;
    this.stateNode = stateNode;
    this.return = returnFiber;
    this.flags = Placement;
  }
}

export class FiberNode extends FiberRootNode {
  constructor(props) {
    super(props);
    this.alternate = null;
  }
}
