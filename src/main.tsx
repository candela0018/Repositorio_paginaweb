import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { AuthProvider } from "./app/context/AuthContext.tsx";
// 1. Importamos el enrutador de React
import { BrowserRouter } from "react-router-dom"; 

createRoot(document.getElementById("root")!).render(
  // 2. Envolvemos todo primero con BrowserRouter y luego con tu AuthProvider
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);