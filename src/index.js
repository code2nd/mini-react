/* import React, { useState, useReducer } from "react";
import ReactDOM from "react-dom"; */
import { useReducer, useState } from "./mini-react/react";
import ReactDOM from "./mini-react/react-dom";
import "./index.css";

function FunctionComponent(props) {
  const [count1, setCount1] = useState(10);
  const [count, dispatch] = useReducer((x) => x + 1, 0);

  return (
    <div className="rfc">
      <p>{count1}</p>
      <button
        onClick={() => {
          dispatch();
          setCount1(count1 + 1);
        }}
      >
        {count}
      </button>
    </div>
  );
}

const jsx = (
  <div className="App">
    <h1 className="title">miniReact</h1>
    <a className="link" href="https://reactjs.org/">
      React官方网站
    </a>
    <p className="text">用于构建用户界面的 JavaScript 库</p>
    <FunctionComponent name="函数组件" />
  </div>
);

ReactDOM.render(jsx, document.getElementById("root"));
