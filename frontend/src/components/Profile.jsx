import axios from "axios";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;
const socket = io(import.meta.env.VITE_SOCKET_URL);

function Profile() {
    const name = JSON.parse(localStorage.getItem("user") || "{}").name;
    const userId = JSON.parse(localStorage.getItem("user") || "{}").userId;

    const [blogcount, setblogcunt] = useState("");
    const [vericount, setvericunt] = useState("");
    const [blogs, setBlogs] = useState([]);
    const [likes, setlikes] = useState([]);
    const [commentblog, setcommentblog] = useState([]);
    const [image, setimage] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [followers, setfollowers] = useState([]);
    const [following, setfollowing] = useState([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [chatters , setchatters] = useState([]);
    const [selectedBlogId, setSelectedBlogId] = useState(null);
    const [selectedChatters, setSelectedChatters] = useState([]);
    const [saved, setSaved] = useState([]);
    const [dob, setdob] = useState("");
    const [bio , setbio] = useState("");
    const [email , setemail] = useState("");
    const [username , setusername] = useState("");
    const [showpersonal , setshowpersonal] = useState(false);
    const [showpass, setshowpass] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        dob: "",
        bio: "",
        email: ""
    });

    const getprofile = async () => {
        await axios.post(`${API_URL}/getprofile`, { name })
            .then(res => {
                setblogcunt(res.data.blogcount);
                setvericunt(res.data.vericount);
                setBlogs(res.data.veriblogs);
                setlikes(res.data.liked || []);
                setcommentblog(res.data.commented || []);
                setimage(res.data.image);
                setfollowers(res.data.followers || []);
                setfollowing(res.data.following || []);
                setchatters(res.data.chatters || []);
                setSaved(res.data.saved || []);
                setbio(res.data.bio || "blogCHIT user");
                setdob(res.data.dob || "");
                setemail(res.data.email || "");
                setusername(res.data.username || "");
                setFormData({
                    name: res.data.username || "",
                    dob: res.data.dob || "777",
                    bio: res.data.bio || "blogCHIT user",
                    email: res.data.email || "fghj"
                });
            })
            .catch(err => {
                console.error(err);
                console.log("unable to fetch count ");
            })
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const changedetails = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/changedetails`, {
                userId,
                name: formData.name,
                dob: formData.dob,
                bio: formData.bio
            });

            if (res.data.success) {
                // Update local states
                setusername(formData.name);
                setdob(formData.dob);
                setbio(formData.bio);

                // Update localStorage so the new name is used across the app
                const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                storedUser.name = formData.name;
                localStorage.setItem("user", JSON.stringify(storedUser));

                alert(res.data.message || "Profile updated successfully!");
                setshowpersonal(false);
            } else {
                alert(res.data.message || "Failed to update profile.");
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "An error occurred while updating details.");
        }
    };

    const handleSendOtp = async () => {
        if (!email) {
            alert("No email associated with this account or profile is still loading.");
            return;
        }
        setLoadingOtp(true);
        try {
            const res = await axios.post(`${API_URL}/send-password-otp`, { userId });
            if (res.data.success) {
                setOtpSent(true);
                alert(res.data.message);
            } else {
                alert(res.data.message || "Failed to send OTP.");
            }
        } catch (err) {
            console.error("Error sending OTP:", err);
            alert(err.response?.data?.message || "An error occurred while sending OTP.");
        } finally {
            setLoadingOtp(false);
        }
    };

    const changepassword = async (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword || !otp) {
            alert("All fields (New Password, Confirm Password, OTP) are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("New Password and Confirm Password do not match.");
            return;
        }
        setLoadingSave(true);
        try {
            const res = await axios.post(`${API_URL}/changepassword`, {
                userId,
                newPassword,
                otp
            });
            if (res.data.success) {
                alert(res.data.message || "Password changed successfully!");
                // Clear fields
                setNewPassword("");
                setConfirmPassword("");
                setOtp("");
                setOtpSent(false);
                setshowpass(false);
            } else {
                alert(res.data.message || "Failed to change password.");
            }
        } catch (err) {
            console.error("Error changing password:", err);
            alert(err.response?.data?.message || "An error occurred while changing password.");
        } finally {
            setLoadingSave(false);
        }
    };


    //calculations....
    const totalviews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);

    const totallikes = blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0);

    const totalcomments = blogs.reduce(
        (sum, blog) => sum + (blog.comments?.length || 0),
        0
    );


    const like = (id) => {
        axios.post(`${API_URL}/like`, { id })
            .then(res => {
                // Update local state to show new like count immediately
                setBlogs(prevBlogs => prevBlogs.map(blog =>
                    blog._id === id ? { ...blog, likes: res.data.likes } : blog
                ));
            })
            .catch(err => {
                console.error(err);
                console.log("unable to like ");
            })

    }
    const getnoti = async () => {
        await axios.get(`${API_URL}/notifications/${userId}`)
            .then(res => {
                setNotifications(res.data);

            })
            .catch(err => {
                console.error("Error fetching notifs:", err);
                console.log("unable to fetch notiis ");
            });
    }
    useEffect(() => {
        getprofile();

        if (name) {
            socket.emit("setup_user", name);


        }

        const handleNewNotification = (newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);

        };

        socket.on("receive_notification", handleNewNotification);

        return () => {
            socket.off("receive_notification", handleNewNotification);
        };

    }, [name]);
    useEffect(() => {
        getprofile();



    }, []);
    // const handleshare = ()=>{

    // }
    return (<>
        
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                    <h1>{username}</h1>
                    {image && (
                        <img src={image} alt="" style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover", marginBottom: "15px" }} />
                    )}
                 
                </div>
                <p>{bio}</p>

            </div>
            no. of blogs submitted : {blogcount}
            verified: {vericount}

            {/* Followers / Following counts */}
            <div style={{ display: "flex", gap: "20px", margin: "15px 0" }}>
                <span
                    onClick={() => setShowFollowers(!showFollowers)}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                >
                    Followers: {followers.length}
                </span>
                <span
                    onClick={() => setShowFollowing(!showFollowing)}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                >
                    Following: {following.length}
                </span>
            </div>

            {/* Followers list */}
            {showFollowers && (
                <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>
                    <h3>Followers</h3>
                    {followers.length === 0 ? (
                        <p style={{ color: "#888" }}>No followers yet</p>
                    ) : (
                        followers.map((f) => (
                            <div key={f._id} style={{ padding: "5px 0" }}>
                                <Link to={`/searchedprofile/${f._id}`}>{f.name}</Link>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Following list */}
            {showFollowing && (
                <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>
                    <h3>Following</h3>
                    {following.length === 0 ? (
                        <p style={{ color: "#888" }}>Not following anyone yet</p>
                    ) : (
                        following.map((f) => (
                            <div key={f._id} style={{ padding: "5px 0" }}>
                                <Link to={`/searchedprofile/${f._id}`}>{f.name}</Link>
                            </div>
                        ))
                    )}
                </div>
            )}

            <h2>yours blog : </h2>
            {blogs.map((blog) => (
                <div key={blog._id} className="blog-card">
                    {blog.title}
                    <br />
                    {blog.subtitle}
                    <br />
                    {blog.content}
                    <br />
                    {blog.likes}
                    <button onClick={() => like(blog._id)}>
                        <div className="heart-container" title="Like">
                            <input type="checkbox" className="checkbox" id={`like-${blog._id}`} readOnly />
                            <div className="svg-container">
                                <svg viewBox="0 0 24 24" className="svg-outline" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Zm-3.585,18.4a2.973,2.973,0,0,1-3.83,0C4.947,16.006,2,11.87,2,8.967a4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,11,8.967a1,1,0,0,0,2,0,4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,22,8.967C22,11.87,19.053,16.006,13.915,20.313Z">
                                    </path>
                                </svg>
                                <svg viewBox="0 0 24 24" className="svg-filled" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Z">
                                    </path>
                                </svg>
                                <svg className="svg-celebrate" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                                    <polygon points="10,10 20,20"></polygon>
                                    <polygon points="10,50 20,50"></polygon>
                                    <polygon points="20,80 30,70"></polygon>
                                    <polygon points="90,10 80,20"></polygon>
                                    <polygon points="90,50 80,50"></polygon>
                                    <polygon points="80,80 70,70"></polygon>
                                </svg>
                            </div>
                        </div>
                    </button>

                    <Link to={`/blog/${blog._id}`} >
                        Read Full blog
                    </Link>
            <button onClick={() => setSelectedBlogId(selectedBlogId === blog._id ? null : blog._id)}>
  {selectedBlogId === blog._id ? "cancel" : "share"}
</button>



                    <hr />
                </div>))}
            <h2>your liked blog : </h2>
            {likes.map((blog) => (<div key={blog._id}>
                <Link to={`/blog/${blog._id}`}>{blog.title}</Link>
            </div>))}
            <h2>your commented blog : </h2>
            {commentblog.map((blog) => (<div key={blog._id}>
                <Link to={`/blog/${blog._id}`}>{blog.title}</Link>
            </div>))}
            <hr />
            <h2>your saved blog : </h2>
            {saved.map((blog) => (<div key={blog._id}>
                <Link to={`/blog/${blog._id}`}>{blog.title}</Link>
            </div>))}
            <hr />
            <hr />
            <hr />
             {selectedBlogId && (

        <div style={{ padding: "20px", background: "lightblue" }}>
            <h3>Select chatters to share with:</h3>
  {chatters.map((chatter) =>(
    <div key={chatter._id}>
        <div style={{display:"flex"}}><p>{chatter.name}</p> 
        <input 
            type="checkbox" 
            checked={selectedChatters.includes(chatter._id)}
            onChange={(e) => {
                if (e.target.checked) {
                    setSelectedChatters([...selectedChatters, chatter._id]);
                } else {
                    setSelectedChatters(selectedChatters.filter(id => id !== chatter._id));
                }
            }}
        /></div>
    </div>
  ))}
  <button 
    onClick={async () => {
        if (selectedChatters.length === 0) return;
        const blogUrl = `${import.meta.env.VITE_FRONTEND_URL}/blog/${selectedBlogId}`;
        const messageContent = `Check out this blog: ${blogUrl}`;
        
        try {
            for (const chatterId of selectedChatters) {
                const messageData = {
                    senderId: userId,
                    receiverId: chatterId,
                    message: messageContent
                };
                const res = await axios.post(`${API_URL}/sendmessage`, messageData);
                socket.emit("send_message", res.data);
            }
            setSelectedBlogId(null);
            setSelectedChatters([]);
            alert("Shared successfully!");
        } catch (err) {
            console.error("Error sharing:", err);
            alert("Failed to share.");
        }
    }}
    style={{ marginTop: "10px", padding: "5px 10px" }}
  >
    Send
  </button>
        </div>

      )}

            totalviews : {totalviews}
            <hr />
            totallokes ; {totallikes}
            <hr />
            totalcommests : {totalcomments}

            <hr />
            <button onClick={getnoti}>notification history</button>
            {notifications.length === 0 ? (
                <p style={{ padding: "15px", color: "#888", textAlign: "center" }}>No notifications yet</p>
            ) : (
                notifications.map((n, i) => (
                    <div key={i} style={{ padding: "12px", borderBottom: "1px solid #f9f9f9", fontSize: "13px" }}>
                        <p style={{ margin: "0 0 5px 0" }}>{n.message}</p>
                        <small style={{ color: "#aaa" }}>{new Date(n.time).toLocaleString()}</small>
                    </div>
                ))
            )}
        </div>
       <button onClick={() =>{setshowpersonal(!showpersonal)}}>{!showpersonal?("personaldetails"):("close")}</button>
       {showpersonal && (
  <div>
    <h2>Personal Details</h2>

    <form onSubmit={changedetails}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder={formData.name}
      />

      <br /><br />

      <input
        type="text"
        name="dob"
        value={formData.dob}
        onChange={handleChange}
        placeholder={formData.dob}
      />
      <input
        type="text"
        name="bio"
        value={formData.bio}
        onChange={handleChange}
        placeholder={formData.bio}
      />
   

      <br /><br />
      <button
        type="submit"
      >
        Save
      </button>
    </form>
    <div style={{ marginTop: "10px", color: "#666" }}>
      <strong>Email state:</strong> {email || "(no email stored in database)"}
    </div>
  </div>
)}
       <button onClick={() =>{setshowpass(!showpass)}}>{!showpass?("Password and security"):("close")}</button>
       {showpass && (
  <div>
    <h2>security</h2>
    <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Doloremque veniam vel tenetur odio cupiditate excepturi, sapiente natus itaque ratione deserunt, sint consectetur, exercitationem velit officiis iusto adipisci. Sunt labore quis molestiae pariatur exercitationem, assumenda recusandae.</p>
    
    <div>
      <strong>Registered Email:</strong> {email || "(No email stored in database)"}
      <button 
        type="button" 
        onClick={handleSendOtp} 
        disabled={loadingOtp}
      >
        {loadingOtp ? "Sending..." : "Send OTP"}
      </button>
    </div>
    <br />

    <h2>change password</h2>
    <form onSubmit={changepassword}>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Enter new password"
        required
      />
      <br /><br />
      
      confirm new password
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        required
      />
      <br /><br />

      entre otp to change your password
      <input
        type="text"
        maxLength="6"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        placeholder="entre otp sent to your email"
        required
      />
      <br /><br />

      <button
        type="submit"
        disabled={loadingSave || !otpSent}
      >
        {loadingSave ? "Saving..." : "Save"}
      </button>
    </form>
    <div style={{ marginTop: "10px", color: "#666" }}>
      <strong>Email state:</strong> {email || "(no email stored in database)"}
    </div>
  </div>
)}
    </>
    )
}

export default Profile
