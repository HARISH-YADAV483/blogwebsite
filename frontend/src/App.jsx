import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Admin from "./components/Admin";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Communities from "./components/Communities";
import Fullblog from "./components/Fullblog";
import Notification from "./components/Notification";
import Navbar from "./components/Navbar";
import Search from "./components/Search";
import Searchedprofile from "./components/Searchedprofile";
import Messages from "./components/Messages";
import Chat from "./components/Chat";
import CommunityChat from "./components/CommunityChat";
import Register from "./components/Register";
import Communitydetail from "./components/Communitydetail";
import Login from "./components/Login";
import Forget from "./components/Forgetpassword";
import Writeblog from "./components/Writeblog";
function ProtectedAdminRoute({ children }) {
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const role = userData.role || null;
  return role == "admin" ? children : <Navigate to="/" />;
}

function App() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadPerChatter, setUnreadPerChatter] = useState({});
  const [unreadChatters, setUnreadChatters] = useState([]);

  return (
    <>
      <Navbar
        unreadCount={unreadCount}
        setUnreadCount={setUnreadCount}
        unreadMsgCount={unreadMsgCount}
        setUnreadMsgCount={setUnreadMsgCount}
        unreadPerChatter={unreadPerChatter}
        setUnreadPerChatter={setUnreadPerChatter}
        unreadChatters={unreadChatters}
        setUnreadChatters={setUnreadChatters}
      />
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <Admin unreadCount={unreadCount} setUnreadCount={setUnreadCount} />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/" element={<Home />} />
        <Route path="/write" element={<Writeblog />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/blog/:id" element={<Fullblog />} />
        <Route path="/community/:id" element={<Communitydetail />} />
        <Route path="/profile/:id" element={<Searchedprofile unreadCount={unreadCount} setUnreadCount={setUnreadCount} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/forgotpass" element={<Forget />} />
        <Route path="/notti" element={<Notification unreadCount={unreadCount} setUnreadCount={setUnreadCount} />} />
        <Route path="/messages" element={<Messages unreadPerChatter={unreadPerChatter} setUnreadPerChatter={setUnreadPerChatter} setUnreadMsgCount={setUnreadMsgCount} />} />
        <Route path="/chat/:chatterId" element={<Chat unreadPerChatter={unreadPerChatter} setUnreadPerChatter={setUnreadPerChatter} setUnreadMsgCount={setUnreadMsgCount} />} />
        <Route path="/communiy/:communityId" element={<CommunityChat />} />
      </Routes>
    </>
  )
}

export default App
