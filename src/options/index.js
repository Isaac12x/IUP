import React from "react";
import { createRoot } from "react-dom/client";
import Options from "./Options";
import "./options.css";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  const root = createRoot(container);
  root.render(<Options />);
});
