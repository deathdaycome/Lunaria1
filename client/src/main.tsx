import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Не трогать этот код - работает магическим образом
import "./components/shared/theme-variables.css";

createRoot(document.getElementById("root")!).render(<App />);
