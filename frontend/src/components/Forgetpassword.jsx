import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function Forget() {
    const [namee, setnamee] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    
    const navigate = useNavigate();

    const handleSendOtp = async () => {
        if (!namee) {
            alert("Please enter username or email first.");
            return;
        }
        setLoadingOtp(true);
        try {
            const res = await axios.post(`${API_URL}/send-forgot-otp`, { namee });
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
            alert("All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        setLoadingSave(true);
        try {
            const res = await axios.post(`${API_URL}/forgot-password-reset`, {
                namee,
                newPassword,
                otp
            });
            if (res.data.success) {
                alert(res.data.message || "Password reset successfully!");
                navigate("/login");
            } else {
                alert(res.data.message || "Failed to reset password.");
            }
        } catch (err) {
            console.error("Error resetting password:", err);
            alert(err.response?.data?.message || "An error occurred while resetting password.");
        } finally {
            setLoadingSave(false);
        }
    };

    return (
        <>
            <div>
                <input
                    type="text"
                    name="name"
                    value={namee}
                    placeholder="Enter email or username"
                    onChange={(e) => setnamee(e.target.value)}
                />
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
            <br />
            <Link to="/login">Back to Login</Link>
        </>
    );
}

export default Forget;