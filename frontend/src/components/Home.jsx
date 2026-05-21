import { useState, useEffect } from "react"
import blogchit from '../assets/blogchit.png';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'
import Navbar from "./Navbar";
import { io } from 'socket.io-client';
const socket = io(import.meta.env.VITE_SOCKET_URL);
const API_URL = import.meta.env.VITE_API_URL;
function Home() {
    const [blogs, setBlogs] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [message, setmessage] = useState(null);
    const navigate = useNavigate();
    const [chatters , setchatters] = useState([]);
      const [selectedBlogId, setSelectedBlogId] = useState(null);
    const [selectedChatters, setSelectedChatters] = useState([]);
    const userId = JSON.parse(localStorage.getItem("user") || "{}").userId
    const [role, setrole] = useState(JSON.parse(localStorage.getItem("user") || "{}").role || "");
    const token = JSON.parse(localStorage.getItem("user") || "{}").token;

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);



    const getpendingblogs = async (isLoadMore = false) => {
        const skip = isLoadMore ? blogs.length : 0;
        const limit = 5;

        await axios.get(`${API_URL}/verified?skip=${skip}`)
            .then(res => {
                if (Array.isArray(res.data)) {
                    if (isLoadMore) {
                        setBlogs(prev => [...prev, ...res.data]);
                    } else {
                        setBlogs(res.data);
                    }
                    if (res.data.length < limit) {
                        setHasMore(false);
                    } else {
                        setHasMore(true);
                    }
                    setmessage("");
                } else {
                    if (!isLoadMore) setBlogs([]);
                    setmessage(res.data.message || "No more pending blogs");
                    setHasMore(false);
                }
            })
            .catch(err => {
                console.error(err);
                console.log("unable to fetch");
                setmessage("Error fetching blogs");
            })
    }

    const like = async (id) => {
        await axios.post(`${API_URL}/like`, { id, userId })
            .then(res => {
                setmessage(res.data.message);
                setBlogs(prevBlogs => prevBlogs.map(blog =>
                    blog._id === id ? { ...blog, likes: res.data.likes } : blog
                ));
            })
            .catch(err => {
                console.error(err);
                console.log("unable to like ");
                setmessage("Unable to like blog");
            })
    }
    const save = async (id) => {
        await axios.post(`${API_URL}/save`, { id, userId })
            .then(res => {
                setmessage(res.data.message);
                
            })
            .catch(err => {
                console.error(err);
                console.log("unable to save ");
                setmessage("Unable to save blog");
            })
    }
    const getChatters = async () => {
        try {
            const res = await axios.get(`${API_URL}/chatters/${userId}`);
            setchatters(res.data || []);
         
        } catch (err) {
            console.error("Error fetching chatters:", err);
            
        }
    };

    useEffect(() => {
        if (token) {
            getpendingblogs();
            getChatters();
        }
    }, [token]);

    if (!token) {
        return null; // Or a loading spinner while redirecting
    }

    return (
        <>
            <div>
                <p>Welcome! You are logged in.</p>
                <img src={blogchit} style={{marginRight:"15vw" ,marginLeft:"15vw" , width:"70vw" , height:"auto" , marginTop:"23px"}} alt="" className="logo" />

                <div className="blogs">
                    <Link to="/write"><button>writeblog</button></Link>
                </div>
                {blogs.map((blog) => (
                    <div key={blog._id} className="blog-card">
                        {blog.image && (
                            <img src={blog.image} alt="" style={{ width: "300px", height: "auto" }} />
                        )}

                        {blog.category && (
                            <div style={{ backgroundColor: "#333", color: "white", padding: "4px 8px", borderRadius: "4px", display: "inline-block", marginBottom: "8px", fontSize: "12px" }}>
                                {blog.category}
                            </div>
                        )}
                        <h2>{blog.title}</h2>
                        <h4 style={{ color: "#aaa", margin: "4px 0" }}>{blog.subtitle}</h4>
                        <p style={{ fontSize: "14px", color: "#888", marginBottom: "12px" }}>By {blog.author}</p>
                        
                        {blog.likes}

                        <div className="heart-container" title="Like" onClick={() => like(blog._id)}>
                            <input
                                type="checkbox"
                                className="checkbox"
                                id="Give-It-An-Id"
                            />
                            <div className="svg-container">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="svg-outline"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Zm-3.585,18.4a2.973,2.973,0,0,1-3.83,0C4.947,16.006,2,11.87,2,8.967a4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,11,8.967a1,1,0,0,0,2,0,4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,22,8.967C22,11.87,19.053,16.006,13.915,20.313Z" />
                                </svg>
                                <svg
                                    viewBox="0 0 24 24"
                                    className="svg-filled"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Z" />
                                </svg>
                                <svg
                                    className="svg-celebrate"
                                    width="100"
                                    height="100"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <polygon points="10,10 20,20" />
                                    <polygon points="10,50 20,50" />
                                    <polygon points="20,80 30,70" />
                                    <polygon points="90,10 80,20" />
                                    <polygon points="90,50 80,50" />
                                    <polygon points="80,80 70,70" />
                                </svg>
                            </div>
                        </div>
                       views : "" {blog.views} ""

                        <Link to={`/blog/${blog._id}`} >
                            comment 📝
                        </Link>
                        <Link to={`/blog/${blog._id}`} >
                            Read Full blog
                        </Link>
                           <button onClick={() => setSelectedBlogId(selectedBlogId === blog._id ? null : blog._id)}>
  {selectedBlogId === blog._id ? "cancel" : "share"}
</button>
<button onClick={() => save(blog._id)}>save</button>
                        <hr />
                    </div>))}
                     {selectedBlogId && (

        <div style={{ padding: "20px", background: "lightblue" }}>
            <h3>Select chatters to share with:</h3>
  {chatters.map((chatter) =>(
    <div key={chatter._id} >
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
            // Track sharer in blog's sharers array
            await axios.post(`${API_URL}/shareblog`, { blogId: selectedBlogId, userId });

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

                {hasMore && (
                    <button onClick={() => getpendingblogs(true)}>
                        Load More
                    </button>
                )}

            </div >
            {message && <p>{message}</p>}
        </>
    )
}

export default Home