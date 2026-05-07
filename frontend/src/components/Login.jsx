import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'
import "./login.css";

const API_URL = import.meta.env.VITE_API_URL;

function Login() {   
    const [message, setmessage] = useState(null);
    const [formdata, setformdata] = useState({
        name: '',
        pass: ''
    });
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setformdata(prev => ({ ...prev, [name]: value }));
    }

    const handlelogin = (e) => {
        e.preventDefault();
        axios.post(`${API_URL}/logi`, formdata)
            .then(res => {
                setmessage(res.data.message);
                if (res.data.token) {
                    localStorage.setItem("token", res.data.token);
                    localStorage.setItem("name", res.data.name);
                    localStorage.setItem("role", res.data.role);
                    localStorage.setItem("userId", res.data.userId);
                    if (typeof socket !== 'undefined') {
                        socket.emit("setup_user", res.data.name);
                    }
                    navigate("/");
                }
            })
            .catch(err => {
                console.error(err);
                setmessage("login failed");
            });
    }

    return (
        <>
            <h1 className="red">login form</h1>
            <form onSubmit={handlelogin} method="post">
                <input type="text" name="name" onChange={handleChange} value={formdata.name} placeholder="username" />
                <input type="password" name="pass" onChange={handleChange} value={formdata.pass} placeholder="your password" />
                <button type="submit">login</button>
            </form>
            {message && <p>{message}</p>}
            <p>Don't have an account? <Link to="/register">Register</Link></p>
        </>
    ) 
}

export default Login