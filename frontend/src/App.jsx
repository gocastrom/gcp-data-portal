import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layout/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Search from "./pages/Search.jsx";
import Asset from "./pages/Asset.jsx";
import RequestAccess from "./pages/RequestAccess.jsx";
import Approvals from "./pages/Approvals.jsx";
import RequireRole from "./components/RequireRole.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/search" replace />} />

          <Route path="/login" element={<Login />} />

          <Route path="/search" element={<Search />} />
          <Route path="/asset" element={<Asset />} />

          <Route
            path="/request"
            element={
              <RequireRole allowed={["REQUESTER", "ADMIN"]}>
                <RequestAccess />
              </RequireRole>
            }
          />

          <Route
            path="/approvals"
            element={
              <RequireRole allowed={["APPROVER", "ADMIN"]}>
                <Approvals />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
