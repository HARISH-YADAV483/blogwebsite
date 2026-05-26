import axios from "axios";
import { useState, useEffect } from "react";
import Navbar from "./Navbar"
const API_URL = import.meta.env.VITE_API_URL;
function Notification({unreadCount, setUnreadCount}) {
     const userId = JSON.parse(localStorage.getItem("user") || "{}").userId;
    const [notifications, setNotifications] = useState([]);
    const [oldnotifications, setoldNotifications] = useState([]);
    const[message , setmessage] = useState("")
   
  const getnoti =async() =>{
  await  axios.get(`${API_URL}/notifications/${userId}`)
                .then(res => {
                    setNotifications(res.data);
                   
                })
                .catch(err => console.error("Error fetching notifs:", err));
  }
  const oldgetnoti =async() =>{
  await  axios.get(`${API_URL}/oldnotifications/${userId}`)
                .then(res => {
                    setoldNotifications(res.data);
                   
                })
                .catch(err => console.error("Error fetching notifs:", err));
  }
  const read = async(id) =>{
    await axios.post(`${API_URL}/read` ,{id})
    .then(res =>{
        setmessage(res.data.message);
        setUnreadCount((prev) => Math.max(prev - 1, 0));
        setNotifications(prevnotifications =>
        prevnotifications.filter(noti => noti._id !== id)       
      );
    })
    .catch(err =>{
        console.error(err);
  })
  }
 useEffect(() => {
        getnoti();
    }, []);
    return (<>
      
       {notifications.length>0?(notifications.map((notis) => (
        <div key={notis._id}>
            {notis.message}
            <br />
            
            <button  onClick={() => read(notis._id)}>Delete</button>
            <br />
            <br />
            <hr />
        </div>
     ))):(<div>no new notis</div>)}
     <button onClick={oldgetnoti}>notification history</button>
    {oldnotifications.length>0?(oldnotifications.map((notis) => (
        <div key={notis._id}>
            {notis.message}
            <br />
            
           
            <br />
            <br />
            <hr />
        </div>
     ))):(<div>no  notis at all</div>)}
       {message && <p>{message}</p>}
       </>
    )
}
export default Notification