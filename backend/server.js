require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(

  process.env.CLIENT_API_KEY

);
const resend = new Resend(process.env.RESEND_API_KEY);


const app = express();
app.use(cors());
app.use(express.json());
const connectdb = () => {
    mongoose.connect(process.env.MONGO_URI);
    console.log("mongo connected")
}
connectdb();

const UserSchema = new mongoose.Schema({
    name: String,
    pass: String,
    email: String,
    role: String,
    blogliked: Array,
    blogcommented: Array,
    image: String
});
const User = mongoose.model("User", UserSchema);

const BlogSchema = new mongoose.Schema({
    title: String,
    subtitle: String,
    content: String,
    status: String,
    author: String,
    likes: Number,
    comments : Array,
    views: Number,
    image : String
});
const Blog = mongoose.model("Blog", BlogSchema);

const JWT_SECRET = process.env.JWT_SECRET;

app.get("/", (req, res) => {
    res.send("backed is running");
})

let otpStorage = {};


////verification with google.....////

app.post("/verifygoogle", async (req, res) => {

  try {

    const { credential } = req.body;

    const ticket = await client.verifyIdToken({

      idToken: credential,

      audience: process.env.CLIENT_API_KEY,

    });

    const payload = ticket.getPayload();

    if (!payload.email_verified) {

      return res.status(400).json({

        success: false,

        message: "Email not verified"

      });

    }
    const email= payload.email;
    const user  =  await User.findOne({email});
    if(user){
        res.json({
             success: false,

      message : "an account already exist with this email"
        })
    }
else{
    res.json({

      success: true,

      email: payload.email,

      message : "email verified successfullt !!!"

    });}

  } catch (error) {

    res.status(400).json({

      success: false,

      message: "Google verification failed"

    });

  }

});



function generateOTP() {

  return Math.floor(

    100000 + Math.random() * 900000

  ).toString();

}

app.post("/sendotp", async (req, res) => {

  try {

    const { email } = req.body;
    
    

    if (!email) {

      return res.json({

     

        message: "Email is required",

      });

    }
    const user = await User.findOne({ email });
    if (user) {
        return res.json({ message: "an account with this email already exist" });
    }

    const otp = generateOTP();
    otpStorage[email] = otp;

    await resend.emails.send({

      from: "otp@harishpuhaniya.online",

      to: email,

      subject: "Your Verification Code",

      html: `

        <div style="font-family: Arial;">

          <h2>Your OTP is: ${otp}</h2>

          <p>This OTP expires in 5 minutes.</p>

        </div>

      `,

    });

    res.json({

    

      message: "OTP sent successfully",

    

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      

      message: "Failed to send OTP",

    });

  }

});

app.post("/verifyotp", (req, res) => {
  const { email, otp } = req.body;
  if (otpStorage[email] === otp) {
    res.json({ success: true, message: "OTP verified successfully" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});



//registration
app.post("/regi", async (req, res) => {
    const { name, pass, email , image } = req.body;
    const exist = await User.findOne({ name });
    if (exist) {
        res.json({ message: "username already exist " })
    }
    else {
        const newUser = new User({ name, pass, email, role: "user" , image });
        await newUser.save();
        res.json({ message: "registration successful...." });
    }
})

app.post("/logi", async (req, res) => {
    const { name, pass } = req.body;
    const exist = await User.findOne({ name });
    if (!exist) {
        res.json({ message: "  such username doesnt exist   " })
    }
    else {
        const passw = exist.pass;

        if (passw == pass) {

            const token = jwt.sign({ userId: exist._id, name: exist.name }, JWT_SECRET, { expiresIn: '1h' });

            const role = exist.role;
            res.json({ message: "user login done !!!   ", token, role, name: exist.name })

        }
        else {

            res.json({ message: "wrong password" });
        }
    }
})

app.post("/logout", (req, res) => {

    res.json({ message: "Logged out successfully" });
});
//blogs karyekall

//create
app.post("/blog", async (req, res) => {
    const { title, subtitle, content, author , image } = req.body;
    const newBlog = new Blog({ title, subtitle, content, status: "Pending", author, likes: 0 , image });
    await newBlog.save();
    res.json({ message: "blog submission  successful...." });

})
//send for admin
app.get("/pendingblog", async (req, res) => {
    try {
        const limit = 5;
        const skip = parseInt(req.query.skip) || 0;
        const pend = await Blog.find({ status: "Pending" }).sort({ _id: -1 }).skip(skip).limit(limit);

        if (pend.length > 0) {
            res.json(pend);
        } else {
            res.json({ message: "No more pending blogs", blogs: [] });
        }
    } catch (error) {
        console.error("Error fetching pending blogs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
//send for home page
app.get("/verified", async (req, res) => {
    try {
        const limit = 5;
        const skip = parseInt(req.query.skip) || 0;
        const pend = await Blog.find({ status: "verified" }).sort({ _id: -1 }).skip(skip).limit(limit);

        if (pend.length > 0) {
            res.json(pend);
        } else {
            res.json({ message: "No more pending blogs", blogs: [] });
        }
    } catch (error) {
        console.error("Error fetching pending blogs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
//verify
app.post("/verify", async (req, res) => {
    try {
        const { id } = req.body;
        const blog = await Blog.findById(id);
        blog.status = "verified";
        await blog.save();
        res.json({ message: "one blog verified succesfully " });
    }
    catch (error) {
        console.log(error);
        res.json({ message: "unable to  verify blog " });
    }
})
//reject
app.post("/reject", async (req, res) => {
    try {
        const { id } = req.body;
        const blog = await Blog.findById(id);
        blog.status = "rejected";
        await blog.save();
        res.json({ message: "one blog rejected succesfully " });
    }
    catch (error) {
        console.log(error);
        res.json({ message: "unable to  reject blog " });
    }
})
//like...
app.post("/like", async (req, res) => {
    try {
        const { id, name } = req.body;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        const user = await User.findOne({ name });
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // If already liked → unlike
        if (user.blogliked.includes(id)) {
            user.blogliked = user.blogliked.filter(
                blogId => blogId.toString() !== id
            );

            blog.likes = Math.max((blog.likes || 0) - 1, 0);

            await user.save();
            await blog.save();

            return res.json({
                message: "Unliked successfully",
                likes: blog.likes
            });
        }

        // If not liked → like
        user.blogliked.push(id);
        blog.likes = (blog.likes || 0) + 1;

        await user.save();
        await blog.save();

        res.json({
            message: "Liked successfully",
            likes: blog.likes
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Unable to like/unlike"
        });
    }
});
//comments
app.post("/comments", async (req, res) => {
    try {
        const { comment, id , name} = req.body;
        const blog = await Blog.findById(id);
        const user = await User.findOne({name})
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        blog.comments.push(comment);
        user.blogcommented.push(id);
        await user.save();
        await blog.save();
        res.json({ comments: blog.comments });

    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Unable to commment"
        });
    }
})



//getfull blog
app.get("/blogs/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blog.findById(id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }
blog.views = (blog.views || 0) + 1;
blog.save();
        res.status(200).json(blog);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/// getting profile details 
app.post("/getprofile", async (req, res) => {
    try {
        const { name } = req.body;

        const blogs = await Blog.find({ author: name });

        const veriblogs = blogs.filter(blog => blog.status === "verified");
        const vericount = veriblogs.length;
        const blogcount = blogs.length;
        const user = await User.findOne({ name: name })
        const liked = user.blogliked || [];
        const commented = user.blogcommented || [];
        const image = user.image || "";

        res.status(200).json({

            blogcount,
            vericount,
            veriblogs,
            liked,
            commented,
            image

        });

    } catch (error) {
        res.status(500).json({

            message: error.message
        });
    }
});



const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});