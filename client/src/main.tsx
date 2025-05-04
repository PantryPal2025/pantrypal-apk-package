import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeCapacitor } from "./utils/capacitor";

document.title = "PantryPal - Your Intelligent Kitchen Companion";

// Initialize capacitor features (will only run on native platforms)
initializeCapacitor().catch(error => {
  console.error("Failed to initialize Capacitor:", error);
});

createRoot(document.getElementById("root")!).render(<App />);
