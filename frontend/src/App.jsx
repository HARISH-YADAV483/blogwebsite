import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Admin from "./components/Admin";
import Home from "./components/Home";
import Profile from "./components/Profile";

import Fullblog from "./components/Fullblog";
import Notification from "./components/Notification";
import Navbar from "./components/Navbar";
import Search from "./components/Search";
import Searchedprofile from "./components/Searchedprofile";
import Messages from "./components/Messages";
import Chat from "./components/Chat";
function ProtectedAdminRoute({ children }) {
  const role = localStorage.getItem("role");
  return role === "admin" ? children : <Navigate to="/" />;
}

function App() {
const [unreadCount, setUnreadCount] = useState(0);

  return (
    <>
    <Navbar unreadCount = {unreadCount}  setUnreadCount = {setUnreadCount} />
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <Admin unreadCount = {unreadCount}  setUnreadCount = {setUnreadCount} />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/" element={<Home />} />
        <Route path="/blog/:id" element={<Fullblog />} />
        <Route path="/profile/:id" element={<Searchedprofile  unreadCount = {unreadCount}  setUnreadCount = {setUnreadCount} />} />
        <Route path="/profile" element={<Profile  />} />
<Route path="/search" element={<Search  />} />
        <Route path="/notti" element={<Notification  unreadCount = {unreadCount}  setUnreadCount = {setUnreadCount}  />} />
<Route path="/messages" element={<Messages  />} />
        <Route path="/chat/:chatterId" element={<Chat />} />
      </Routes>
    </>
  ) 
}

export default App