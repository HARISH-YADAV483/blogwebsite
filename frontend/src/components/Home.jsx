import { useState, useEffect } from "react"
import { Link } from "react-router-dom";


import axios from 'axios'



function Home() {
    const [blogs, setBlogs] = useState([]);

    const [hasMore, setHasMore] = useState(true);

    const [message, setmessage] = useState(null);
    const [write, setwrite] = useState(false);
    const [role, setrole] = useState(localStorage.getItem("role") || "");
    const name = localStorage.getItem("name");
    const [formdata, setformdata] = useState({
        name: '',
        pass: ''
    });

    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isLoggedIn, setIsLoggedIn] = useState(!!token);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setformdata(prev => ({ ...prev, [name]: value }));
    }
    const handlChange = (e) => {
        const { name, value } = e.target;
        setblogdata(prev => ({ ...prev, [name]: value }));
    }
    const handleregister = (e) => {
        e.preventDefault();
        axios.post("http://localhost:5003/regi", formdata)
            .then(res => {
                setmessage(res.data.message);
            })
            .catch(err => {
                console.error(err);
                setmessage("Registration failed");
            });



    }

    const handlelogin = (e) => {
        e.preventDefault();
        axios.post("http://localhost:5003/logi", formdata)
            .then(res => {
                setmessage(res.data.message);
                if (res.data.token) {
                    setToken(res.data.token);
                    setIsLoggedIn(true);
                    localStorage.setItem("name", res.data.name);
                }
                if (res.data.role) {
                    setrole(res.data.role);
                    localStorage.setItem("role", res.data.role);
                }
            })
            .catch(err => {
                console.error(err);
                setmessage("login failed");

            });



    }


    const handleLogout = () => {
        axios.post("http://localhost:5003/logout")
            .then(res => {
                setmessage(res.data.message);
                setToken(null);
                setIsLoggedIn(false);
                localStorage.removeItem("name");
                localStorage.removeItem("role");
            })
            .catch(err => {
                console.error(err);
                setmessage("Logout failed");
            });
    };
    const handleright = () => {
        setwrite(true);
    }
    const [blogdata, setblogdata] = useState({
        title: '',
        subtitle: '',
        content: '',
        author: localStorage.getItem("name")
    });
    const handlewriteb = (e) => {
        e.preventDefault();
        setwrite(false);
        axios.post("http://localhost:5003/blog", blogdata)
            .then(res => {
                setmessage(res.data.message);
            })
            .catch(err => {
                console.error(err);
                setmessage("blog sumbit failsss");
            })
    }
    const getpendingblogs = async (isLoadMore = false) => {
        const skip = isLoadMore ? blogs.length : 0;
        const limit = 5;

        await axios.get(`http://localhost:5003/verified?skip=${skip}`)
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
    const like = (id) => {
        axios.post("http://localhost:5003/like", { id , name})
            .then(res => {
                setmessage(res.data.message);
                // Update local state to show new like count immediately
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

    useEffect(() => {
        getpendingblogs();
    }, []);


    return (
        <>
            frontend is running
            
            {!isLoggedIn ? (
                <>
                    <form onSubmit={handleregister} method="post">
                        <input type="text" name="name" onChange={handleChange} value={formdata.name} />
                        <input type="text" name="pass" onChange={handleChange} value={formdata.pass} />
                        <button type="submit">register</button>
                    </form>
                    <form onSubmit={handlelogin} method="post">
                        <input type="text" name="name" onChange={handleChange} value={formdata.name} />
                        <input type="text" name="pass" onChange={handleChange} value={formdata.pass} />
                        <button type="submit">login</button>
                    </form>
                </>
            ) : (
                <div>
                    <p>Welcome! You are logged in. kjhkh</p>
                    <button onClick={handleLogout}>Logout</button>

                    {role === "admin" && (
                <div><Link to={"/admin"}> admin</Link></div>
            )}

            <Link to={"/profile"}>profile</Link>
                    <div>vvjh</div>

                    <div className="blogs">

                        {!write ? (<button onClick={handleright} >writeblog</button>) : (<div>
                            <form onSubmit={handlewriteb} method="post">
                                <input type="text" name="title" value={blogdata.title} onChange={handlChange} />
                                <input type="text" name="subtitle" value={blogdata.subtitle} onChange={handlChange} />
                                <input type="text" name="content" value={blogdata.content} onChange={handlChange} />
                                <button type="submit">submitblog</button>
                            </form>
                        </div>)}
                    </div>
                    {blogs.map((blog) => (
                <div key={blog._id} className="blog-card">
                    {blog.title}
                    <br />
                    {blog.subtitle}
                    <br />
                    {blog.content}
                    <br />
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



                    
                    <Link to={`/blog/${blog._id}`} >
                       comment 📝
                    </Link>
                    <Link to={`/blog/${blog._id}`} >
                        Read Full blog
                    </Link>
                    <hr />
                </div>))}


            {hasMore && (
                <button onClick={() => getpendingblogs(true)}>
                    Load More
                </button>
            )}
           
                </div>
            )}
            

 {message && <p>{message}</p>}
        </>
    )
}

export default Home