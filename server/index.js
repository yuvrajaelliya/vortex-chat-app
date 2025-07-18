const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// const mongoose = require("mongoose");
// const { otpRouter } = require("./otpVerification");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
// OTP verification removed

let users = {}; // { socketId: username }
let usernames = new Set(); // for uniqueness
let userDirectory = new Set(); // all registered usernames
let userChats = {}; // { username: Set<username> } who you have chatted with
let userProfilePics = {}; // { username: profilePicUrl }

io.on("connection", (socket) => {
    socket.on("join", (username, cb) => {
        // Only allow unique usernames (case-insensitive)
        const uname = username.trim().toLowerCase();
        if (!uname || usernames.has(uname)) {
            if (cb) cb({ success: false, error: "Username already taken" });
            return;
        }
        users[socket.id] = username;
        usernames.add(uname);
        userDirectory.add(username);
        if (!userChats[username]) userChats[username] = new Set();
        // Assign random AI avatar if not set
        if (!userProfilePics[username]) {
            // Use DiceBear Avatars API for random AI-generated avatar
            const randomSeed = Math.random().toString(36).substring(2, 10);
            userProfilePics[username] = `https://api.dicebear.com/6.x/adventurer/svg?seed=${randomSeed}`;
        }
        // Emit all registered users except yourself (for search)
        const userList = Array.from(userDirectory).filter(u => u !== username);
        socket.emit("users", userList);
        // Broadcast updated user list to all other connected users (so their search updates in real time)
        for (const [sockId, uname] of Object.entries(users)) {
            if (uname !== username) {
                const otherList = Array.from(userDirectory).filter(u => u !== uname);
                io.to(sockId).emit("users", otherList);
            }
        }
        if (cb) cb({ success: true, profilePic: userProfilePics[username] });
    });
// Endpoint to get a user's profile picture
app.get("/profile-pic", (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: "Username required" });
    const url = userProfilePics[username];
    if (!url) return res.status(404).json({ error: "No profile picture found" });
    res.json({ profilePic: url });
});

// Endpoint to set a user's profile picture (expects { username, url })
app.post("/profile-pic", (req, res) => {
    const { username, url } = req.body;
    if (!username || !url) return res.status(400).json({ error: "Username and url required" });
    userProfilePics[username] = url;
    res.json({ success: true, profilePic: url });
});

    socket.on("message", (msg) => {
        // msg can be { text, imageUrl, to }
        const from = users[socket.id];
        let to = msg.to;
        // Add to chat list if to is present
        if (from && to) {
            if (!userChats[from]) userChats[from] = new Set();
            if (!userChats[to]) userChats[to] = new Set();
            // Only add to sender's chatlist here, not receiver's
            userChats[from].add(to);
        }
        const messageObj = {
            user: from,
            to: to,
            text: typeof msg === 'string' ? msg : (msg.text || ""),
            imageUrl: msg && msg.imageUrl ? msg.imageUrl : null,
            seenBy: []
        };
        // Find receiver's socketId
        let receiverSocketId = null;
        for (const [sockId, uname] of Object.entries(users)) {
            if (uname === to) {
                receiverSocketId = sockId;
                break;
            }
        }
        // Send to sender and receiver only
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit("message", messageObj);
            // Always send notification if this is the first message from sender to receiver
            if (!userChats[to] || !userChats[to].has(from)) {
                socket.to(receiverSocketId).emit("notification", {
                    from,
                    text: messageObj.text,
                    imageUrl: messageObj.imageUrl
                });
                // Now add sender to receiver's chatlist (so next time notification won't fire)
                if (!userChats[to]) userChats[to] = new Set();
                userChats[to].add(from);
            }
        }
        socket.emit("message", messageObj); // sender ko bhi
        // --- Real-time active/online update ---
        // Broadcast updated online users to all
        io.emit("active", Object.values(users));
    });

    // --- Real-time typing indicator ---
    socket.on("typing", (to) => {
        const from = users[socket.id];
        // Only send typing to the intended receiver
        for (const [sockId, uname] of Object.entries(users)) {
            if (uname === to) {
                io.to(sockId).emit("typing", from);
                break;
            }
        }
    });

    // --- Real-time seen indicator ---
    socket.on("seen", ({ messageIdx, to }) => {
        const from = users[socket.id];
        // Only send seen to the intended receiver
        for (const [sockId, uname] of Object.entries(users)) {
            if (uname === to) {
                io.to(sockId).emit("seen", { messageIdx, user: from });
                break;
            }
        }
    });

    socket.on("disconnect", () => {
        const uname = users[socket.id] && users[socket.id].trim().toLowerCase();
        if (uname) usernames.delete(uname);
        const username = users[socket.id];
        delete users[socket.id];
    });
});

// User search endpoint (case-insensitive, partial match, from directory)
app.get("/search", (req, res) => {
    const q = (req.query.q || "").toLowerCase();
    const found = Array.from(userDirectory).filter(u => u.toLowerCase().includes(q));
    res.json(found);
});

// Get chat list for a user
// Get chat list for a user, with profile pics
app.get("/chats", (req, res) => {
    const username = req.query.username;
    if (!username || !userChats[username]) return res.json([]);
    // Return array of { username, profilePic }
    const chatList = Array.from(userChats[username]).map(u => ({
        username: u,
        profilePic: userProfilePics[u] || null
    }));
    res.json(chatList);
});



app.get("/", (req, res) => {
    res.send("NEONVERSE Chat Server Running");
});

const PORT = process.env.PORT || 4000; // Render provides process.env.PORT

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
