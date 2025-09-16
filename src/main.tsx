import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { VideoCacheProvider } from "./contexts/VideoCacheContext";

createRoot(document.getElementById("root")!).render(
  <VideoCacheProvider>
    <App />
  </VideoCacheProvider>
);
