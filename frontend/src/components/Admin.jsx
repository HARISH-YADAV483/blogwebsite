import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import "./writeblog.css";

const API_URL = import.meta.env.VITE_API_URL;

function Admin({ unreadCount, setUnreadCount }) {
    const [blogs, setBlogs] = useState([]);
    const [message, setmessage] = useState("");
    const [hasMore, setHasMore] = useState(true);
    const [comment , setcomment] =useState("");
    const getpendingblogs = async (isLoadMore = false) => {
        const skip = isLoadMore ? blogs.length : 0;
       const limit =5;

        await axios.get(`${API_URL}/pendingblog?skip=${skip}`)
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
    const verify = (id) => {
        axios.post(`${API_URL}/verify`, { id , comment  })
            .then(res => {
               alert(res.data.message)


      setBlogs(prevBlogs =>

        prevBlogs.filter(blog => blog._id !== id)

      );
            setUnreadCount((prev) => Math.max(prev + 1, 0));  })
            .catch(err => {
                console.error(err);
                console.log("unable to verify");
            })

    }
    const reject = (id) => {
        axios.post(`${API_URL}/reject`, { id  , comment})
            .then(res => {
               alert(res.data.message);
                setBlogs(prevBlogs =>

        prevBlogs.filter(blog => blog._id !== id)


      );
        setUnreadCount((prev) => Math.max(prev + 1, 0));
            })
            .catch(err => {
                console.error(err);
                console.log("unable to reject");
            })
    }
    useEffect(() => {
        getpendingblogs();
    }, []);

    return (
        <>

            {blogs.map((blog) => (
                <div key={blog._id} className="blog-card">
   {blog.image && (
  <img src={blog.image} alt="" style={{width:"300px" , height:"auto"}} />
)}
                    {blog.category && (
                        <div style={{ backgroundColor: "#333", color: "white", padding: "4px 8px", borderRadius: "4px", display: "inline-block", marginBottom: "8px", fontSize: "12px" }}>
                            {blog.category}
                        </div>
                    )}
                    <h2>{blog.title}</h2>
                    <h4 style={{ color: "#aaa", margin: "4px 0" }}>{blog.subtitle}</h4>
                    <div 
                        className="blog-content tiptap-editor-content" 
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                        style={{ border: "1px solid #ddd", padding: "10px", margin: "10px 0", borderRadius: "8px" }}
                    ></div>
                    <button onClick={() => reject(blog._id)}>
                        reject ❌
                    </button>

                    <button onClick={() => verify(blog._id)}>
                        verify ✅
                    </button>
                    <input type="text"  onChange={(e) => {
                        setcomment(e.target.value);
                    }}/>
                    <hr />
                </div>))}


            {hasMore && (
                <button onClick={() => getpendingblogs(true)}>
                    Load More
                </button>
            )}

            {message && (
                <p>{message}</p>
            )}
        </>
    )
}

export default Admin
