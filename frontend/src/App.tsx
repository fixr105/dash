import { RouterProvider } from "react-router-dom";

import "./App.css";
import { AuthProvider } from "./auth/AuthContext";
import { router } from "./app/router";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
