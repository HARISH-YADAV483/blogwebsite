import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Admin from "./components/Admin";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Communities from "./components/Communities";
import Fullblog from "./components/Fullblog";
import Notification from "./components/Notification";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
import MessagingLayout from "./components/MessagingLayout";

function ProtectedAdminRoute({ children }) {
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const role = userData.role || null;
  return role == "admin" ? children : <Navigate to="/" />;
}

function App() {
  const location = useLocation();
  const hideNavbar = 
    location.pathname === "/login" || 
    location.pathname === "/register" || 
    location.pathname === "/forgotpass";
  
  const isMobileChatRoute = 
    location.pathname.startsWith("/chat/") || 
    location.pathname.startsWith("/communiy/") || 
    location.pathname.startsWith("/community/") || 
    location.pathname.startsWith("/communities/") || 
    location.pathname === "/messages";

  useEffect(() => {
    if (isMobileChatRoute) {
      document.body.classList.add("hide-nav-on-mobile-chat");
    } else {
      document.body.classList.remove("hide-nav-on-mobile-chat");
    }
  }, [isMobileChatRoute]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [unreadPerChatter, setUnreadPerChatter] = useState({});
  const [unreadChatters, setUnreadChatters] = useState([]);

  return (
    <>
      {!hideNavbar && (
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
      )}
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
        
        <Route element={<MessagingLayout unreadPerChatter={unreadPerChatter} setUnreadPerChatter={setUnreadPerChatter} setUnreadMsgCount={setUnreadMsgCount} />}>
          <Route path="/messages" element={
            <div className="empty-chat-placeholder hide-on-mobile">
              <p>Select a chat or community to start messaging</p>
            </div>
          } />
          <Route path="/chat/:chatterId" element={<Chat unreadPerChatter={unreadPerChatter} setUnreadPerChatter={setUnreadPerChatter} setUnreadMsgCount={setUnreadMsgCount} />} />
          <Route path="/communiy/:communityId" element={<CommunityChat />} />
        </Route>
        
      </Routes>
      {!hideNavbar && (
        <Footer
          unreadMsgCount={unreadMsgCount}
          setUnreadMsgCount={setUnreadMsgCount}
          unreadChatters={unreadChatters}
          setUnreadChatters={setUnreadChatters}
        />
      )}
    </>
  )
}

export default App
