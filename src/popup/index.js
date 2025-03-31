import React from "react";
import { createRoot } from "react-dom/client";
import Popup from "./Popup";
import "./popup.css";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  const root = createRoot(container);
  root.render(<Popup />);
});
