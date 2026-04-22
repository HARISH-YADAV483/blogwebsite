
import { Routes, Route, Navigate } from "react-router-dom";
import Admin from "./components/Admin";
import Home from "./components/Home";
import Profile from "./components/Profile";

import Fullblog from "./components/Fullblog";


function ProtectedAdminRoute({ children }) {
  const role = localStorage.getItem("role");
  return role === "admin" ? children : <Navigate to="/" />;
}

function App() {
  return (
    <>
      <Routes>
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <Admin />
            </ProtectedAdminRoute>
          } 
        />
        <Route path="/" element={<Home />} />
        <Route path="/blog/:id" element={<Fullblog />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  )
}

export default App
