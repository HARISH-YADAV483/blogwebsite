

import { useState, useEffect } from "react"
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL;

function Register() {
    const [image, setimage] = useState(null);
    const [message, setmessage] = useState(null);
    const [formdata, setformdata] = useState({
        name: '',
        pass: ''
    });
    const [otp, setotp] = useState("");
    const [isverified, setisverified] = useState(false);
    const [email, setemail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setformdata(prev => ({ ...prev, [name]: value }));
    }

    const uploadImage = async () => {
        const data = new FormData();
        data.append("file", image);
        data.append("upload_preset", "blogchit_images"); // Cloudinary preset
        data.append("cloud_name", "dqs0mesoe");

        try {
            setLoading(true);
            const res = await axios.post(
                "https://api.cloudinary.com/v1_1/dqs0mesoe/image/upload",
                data
            );
            setLoading(false);
            return res.data.secure_url;
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    };

    const sendotp = async () => {
        await axios.post(`${API_URL}/sendotp`, { email })
            .then(res => {
                setmessage(res.data.message);
            })
            .catch(err => {
                console.error(err);
                console.log("unable to send otp");
            })
    }

    const verifyotp = async () => {
        await axios.post(`${API_URL}/verifyotp`, { email, otp })
            .then(res => {
                alert(res.data.message);
                setisverified(true);
            })
            .catch(err => {
                console.error(err);
                alert("Invalid OTP");
            })
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post(
                `${API_URL}/verifygoogle`,
                {
                    credential: credentialResponse.credential,
                }
            );
            setmessage(res.data.message);
            if (res.data.success) {
                setemail(res.data.email);
                setisverified(true);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleregister = async (e) => {
        e.preventDefault();
        let imageUrl = "";
        if (image) {
            imageUrl = await uploadImage();
        }
        const updatedformData = {
            ...formdata,
            image: imageUrl
        };

        axios.post(`${API_URL}/regi`, { ...updatedformData, email })
            .then(res => {
                setmessage(res.data.message);
            })
            .catch(err => {
                console.error(err);
                setmessage("Registration failed");
            });
    }

    return (
        <>
            {!isverified ? (
                <>
                    <h2>first you need to verify email to get registerd : </h2>
                    <input type="text" placeholder="email" value={email} onChange={(e) => {
                        setemail(e.target.value);
                    }} />
                    <button onClick={sendotp}>send otp</button>
                    <input type="text" placeholder="entreotp" value={otp} onChange={(e) => {
                        setotp(e.target.value);
                    }} />
                    <button onClick={verifyotp}>verify otp</button>

                    <h1>or verufy your email with google</h1>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => console.log("Google Login Failed")}
                    />
                </>
            ) : (
                <form onSubmit={handleregister} method="post">
                    <input type="text" name="name" placeholder="usermame" onChange={handleChange} value={formdata.name} />
                    <input type="text" name="pass" placeholder="create password" onChange={handleChange} value={formdata.pass} />
                    <input type="file" accept="image/*" onChange={(e) => setimage(e.target.files[0])} />
                    <button type="submit">{loading ? "Uploading..." : "register"}</button>
                </form>
            )}
            {message && <p>{message}</p>}
            <p>Already have an account? <Link to="/login">Login</Link></p>
        </>
    )
}

export default Register