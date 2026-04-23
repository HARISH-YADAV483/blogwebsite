import axios from "axios";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;


function Profile() {
    const name = localStorage.getItem("name");

    const [blogcount, setblogcunt] = useState("");
    const [vericount, setvericunt] = useState("");
    const [blogs, setBlogs] = useState([]);
    const [likes, setlikes] = useState([]);
    const[commentblog , setcommentblog] = useState([]);
    const [image , setimage] = useState("");
    const getprofile = async () => {
        await axios.post(`${API_URL}/getprofile`, { name })
            .then(res => {
                setblogcunt(res.data.blogcount);
                setvericunt(res.data.vericount);
                setBlogs(res.data.veriblogs);
                setlikes(res.data.liked || []);
                setcommentblog(res.data.commented || []);
                setimage(res.data.image);
            })
            .catch(err => {
                console.error(err);
                console.log("unable to fetch count ");

            })



    }

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

    useEffect(() => { getprofile(); }, []);
    return (
        <>
            <h1>{name}</h1>
            {image && (
  <img src={image} alt="" style={{width:"300px" , height:"auto"}} />
)}
            no. of blogs submitted : {blogcount}
            verified: {vericount}
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

                    <button onClick={() => verify(blog._id)}>
                        comment 📝
                    </button>
                    <Link to={`/blog/${blog._id}`} >
                        Read Full blog
                    </Link>
                    <hr />
                </div>))}
<h2>your liked blog : </h2>
               {likes.map((id) => (<div key={id}>
                <Link to={`/blog/${id}`}>{id}</Link>
               </div>))} 
               <h2>your commented blog : </h2>
               {commentblog.map((id) => (<div key={id}>
                <Link to={`/blog/${id}`}>{id}</Link>
               </div>))} 
<hr />
<hr />
<hr />

totalviews : {totalviews}
<hr />
totallokes ; {totallikes}
<hr />
totalcommests : {totalcomments}
        </>
    )
}

export default Profile

