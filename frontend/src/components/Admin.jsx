import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Admin() {
    const [blogs, setBlogs] = useState([]);
    const [message, setmessage] = useState("");
    const [hasMore, setHasMore] = useState(true);
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
        axios.post(`${API_URL}/verify`, { id })
            .then(res => {
               alert(res.data.message)


      setBlogs(prevBlogs =>

        prevBlogs.filter(blog => blog._id !== id)

      );
            })
            .catch(err => {
                console.error(err);
                console.log("unable to verify");
            })

    }
    const reject = (id) => {
        axios.post(`${API_URL}/reject`, { id })
            .then(res => {
               alert(res.data.message);
                setBlogs(prevBlogs =>

        prevBlogs.filter(blog => blog._id !== id)

      );
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
                    {blog.title}
                    <br />
                    {blog.subtitle}
                    <br />
                    {blog.content}
                    <button onClick={() => reject(blog._id)}>
                        reject ❌
                    </button>

                    <button onClick={() => verify(blog._id)}>
                        verify ✅
                    </button>
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
