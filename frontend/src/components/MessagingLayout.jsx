import React from "react";
import { useLocation, Outlet } from "react-router-dom";
import Messages from "./Messages";
import "./MessagingLayout.css";

function MessagingLayout({ unreadPerChatter, setUnreadPerChatter, setUnreadMsgCount }) {
    const location = useLocation();
    
    // Determine which view to show on mobile based on route
    const isChatRoute = location.pathname.startsWith('/chat/') || 
                        location.pathname.startsWith('/communiy/');

    return (
        <div className="messaging-layout-container">
            {/* Animated Background from blogchit theme */}
            <div className="styleo-bg-pattern"></div>
            <div className="styleo-orb styleo-orb-1"></div>
            <div className="styleo-orb styleo-orb-2"></div>
            <div className="styleo-orb styleo-orb-3"></div>

            {/* Sidebar is hidden on mobile if a chat route is active */}
            <div className={`messaging-sidebar ${isChatRoute ? 'hide-on-mobile' : ''}`}>
                <Messages 
                    unreadPerChatter={unreadPerChatter} 
                    setUnreadPerChatter={setUnreadPerChatter} 
                    setUnreadMsgCount={setUnreadMsgCount} 
                />
            </div>

            {/* Main view is hidden on mobile if NO chat route is active (i.e. we are just on /messages) */}
            <div className={`messaging-main ${!isChatRoute ? 'hide-on-mobile' : ''}`}>
                <Outlet />
            </div>
        </div>
    );
}

export default MessagingLayout;
