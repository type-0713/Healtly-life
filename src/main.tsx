import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AppProvider } from "./context/AppContext";
import { I18nProvider } from "./context/I18nContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <I18nProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </I18nProvider>
  </BrowserRouter>,
);
