import { Navigate, Route, Routes } from "react-router-dom";

import { appRoutes } from "./config/appRoutes";

function App() {
  return (
    <Routes>
      {appRoutes.map((route) => {
        const RouteComponent = route.component;
        return <Route key={route.path} path={route.path} element={<RouteComponent />} />;
      })}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
