<h1 align="center">从源码层面理解React Fiber架构及Hooks实现原理</h1>

## 什么是Fiber？
要想弄清什么是Fiber，就要从浏览器底层渲染开始说起。

我们都知道Javascript是单线程的，且JS代码执行与GUI的渲染是在同一个线程，如果某一段JS代码执行时间过长，造成了GUI渲染没法执行，界面上显示的就一直是GUI渲染的上一帧图像，给用户的感觉就是卡顿。

不只是GUI，还有很多任务都是共用着同一线程，例如用户事件响应、JS代码执行、键盘事件响应、requestAnimationFrameCallbak、Layout、paint等，这些操作最好都在一帧之内做完（浏览器刷新频率为每秒60帧），浏览器才可以进行下一帧的绘制，如果这一帧里面有任何耗时操作导致浏览器等待绘制下一帧图像时间过长，就会出现卡顿。而React中Reconciliation（协同的操作就是一些耗时操作），为了避免这种问题，React将所有Reconciliation里的所有操作切分成了很多的Fiber，形成一棵Fiber树，这个Fiber树跟ReactElement树结构是一一对应的（Fiber是就是根据ReactElement树生成的），可以将Fiber理解为一个执行单元（碎片），把所有的控制权交给浏览器，让浏览器先做用户响应、键盘事件、页面绘制等优先级高的任务，浏览器提供了一个requestIdelCallback函数，一旦浏览器有空闲时间就会调用这个函数，在这个函数的回调里面去执行Fiber碎片（空闲时间就是在一帧1/60 = 16.66ms的时间里，浏览器执行完了它该执行的优先级高的任务之后的剩余时间），当时间到了之后又把控制权交还给浏览器。

所以，Fiber就是React将一个比较耗时的任务（如大量组件更新）分成很多个小片，虽然总的执行时间依然很长，但是它不会一直占用唯一的线程，它会把控制权交给浏览器，让浏览器优先执行优先级较高的任务，让用户体验更加丝滑。

上面提到Fiber实现原理利用了浏览器的requestIdelCallback方法，但是React官方团队并没有直接使用这个api，而是自己实现了一个类似的方法，主要原因有两个：
+ 使用window.requestIdelCallback的话，React无法自由的控制它
+ window.requestIdelCallback的兼容性不是很好

Fiber是通过链表的数据结构实现的，这样做的好处有：
+ 相较于数组，链表不需要一整块的内存来存在数据，对内存很友好
+ 链表的插入、删除操作性能较高

我们来看一张图：
![Fiber](./fiber.svg)



从图中我们可以看到Fiber并不是以简单的单链表的形式存在，Fiber节点中有许多字段：

+ child为第一个子节点
+ sibling指向的是下一个兄弟节点
+ return指定其父节点
+ stateNode为持有类组件实例、DOM节点或者其他与这个 Fiber 节点关联的 React 元素类型的引用
+ type定义与这个Fiber关联的方法或者类，对于类组件，它指向类的构造方法；对于DOM元素，它具体为HTML标签；我经常用这个字段来理解fiber节点关联的是什么元素
+ tag：定义了Fiber的类型
+ updateQueue：一个包括状态更新、callbacks以及DOM更新的队列
+ memoizedState：Fiber中用于创建输出的状态，当处理更新时，它反映了当前已经渲染在屏幕上的状态
+ memoizedProps：Fiber中在前一次渲染时用于创建输出的props
+ pendingProps：由React元素中的新数据而来的已经更新过的props，且需要应用于子组件或者DOM元素
+ key：一组子组件的唯一标示，用于React diff算法中得出列表中哪个改变了、添加了或者删除了



## Fiber是如何工作的？

React执行渲染任务主要分为两个阶段：

+ render阶段
+ commit阶段

### render阶段

以上图的展示的链表结构为例，结合```miniReact```源码，当我们调用 ReactDOM.render() 方法时，首先会创建FiberRootNode，整个渲染任务从根节点开始，然后调用scheduleUpdateOnFiber方法进行初始化，当浏览器有空闲时就开始进行workLoop，workLoop中判断当还有任务需要执行且浏览器有空闲时间时就调用performUnitOfWork方法执行该任务，并返回下一个任务，执行任务的时候，由于当前是render阶段，所有首先一层一层的创建Fiber节点，通过reconcileChildren方法，如果所有任务都执行完就提交更新，最终将处理好的节点渲染到根节点上。

### commit阶段

commit阶段流程跟render阶段大体相同，当state发生变化时会触发更新，通过scheduleUpdateOnFiber方法对当前发生变化的Fiber进行调度更新，与render阶段不同的是，commit阶段在reconcileChildren的时候会遍历整棵Fiber树，进行新老虚拟Dom的对比，以达到节点复用的目的，对比使用的是React的diff算法，具体实现规则是：比较同一层级下的节点，只有type和key都相同的节点才会复用。

React中对Fiber树的遍历采用了深度优先算法，以上图为例，先遍历根节点 ```div#root```，然后是它的```child = (div.App)```，接着是(div.App).child = h1.title，接着是(h1.title).child，但是(h1.title).child = null，那就遍历它的下一个兄弟节点(h1.title).sibiling =  a.link，然后是(a.link).child，也为null，接着遍历(a.link).sibling = p.text，接着(p.text).child = null，（p.text).sibling = null，就要开始往上查找，也就是(p.text).return = div.App，接着是(div.App).sibling = null，继续往上查找，就找到了(div.App),return = div#root 根节点，遍历结束。

文字看着有点乱，下图可直观的看出其遍历顺序：

![fiber-map](./fiber-map.svg)



## Hooks

### 什么是React Hooks?

React Hooks是React团队发明的，用于在函数组件中引入**状态管理**和**生命周期方法**。

React官方指定的Hook调用规则有两条：

+ 只在最顶层使用Hook（不要在循环、条件或嵌套函数中调用Hook）
+ 只在React函数中调用Hook（不要在普通Javascript函数中调用Hook）

这是为什么呢?

我们来通过下图了解下：         

![hooks-link-list](./hooks-link-list.svg)

在函数组件中使用的多个Hook之间是通过链表连接的，Hook没有具体的名字也没有其他可以标识执行顺序的东西，只能从Hook头节点通过next指针指向下一个hook节点，可见，Hook的执行严重的依赖于其定义时的顺序的，倘若在循环、条件或嵌套函数中调用Hook，就有可能导致Hook在更新的时候调用顺序错乱，从而导致严重的渲染问题。

