const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Change this to your client's origin
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

app.use(cors());

let messages = {}; // This can be replaced with a database in a production app

// Helper function to generate a unique room ID
const generateUniqueRoomId = () => {
    return `room-${Math.random().toString(36).substr(2, 9)}`;
};

// Nodemailer setup for sending email notifications
const mailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    auth: {
        user: 'chatgpttroll57@gmail.com',
        pass: 'kdbg hrlf rdpg ibcu'
    }
});

// Function to send email notification when a new client connects
const sendEmail = async (id) => {
    const email = 'benpalmer3000@gmail.com'; // Replace with the actual recipient email
    const mailOptions = {
        from: 'chatgpttroll57@gmail.com',
        to: email,
        subject: 'New Client Connected',
        text: `A new client has connected on your GPT with socket ID: ${id}`
    };

    try {
        const info = await mailTransporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.log('Error sending email:', error);
    }
};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Send email when a client connects
    setImmediate(() => {
        sendEmail(socket.id);
    });

    // Listen for the 'joinRoom' event and broadcast a 'userJoined' event
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Client ${socket.id} joined room ${roomId}`);

        // Emit 'userJoined' event to all other clients except the one who joined
        socket.broadcast.emit('userJoined', { roomId });

        // Emit a custom event to notify the responder page about the new user joining
        io.emit('userJoined', { roomId });
    });

    // Create a new room and send the room ID back to the client
    socket.on("createRoom", (callback) => {
        const newRoomId = generateUniqueRoomId();
        callback(newRoomId);
    });

    // Handle chat messages and responses
    socket.on('getMessages', (roomId) => {
        const roomMessages = messages[roomId] || [];
        socket.emit('chatHistory', roomMessages);
    });

    socket.on('question', (data) => {
        const { roomId, msg } = data;
        messages[roomId] = messages[roomId] || [];
        messages[roomId].push({ role: 'asker', message: msg });
        io.to(roomId).emit('question', { roomId, msg });
        io.to(roomId).emit('chatHistory', messages[roomId]);
        io.emit('getRooms');
    });

    socket.on('response', (data) => {
        const { roomId, msg } = data;
        messages[roomId] = messages[roomId] || [];
        messages[roomId].push({ role: 'responder', message: msg });
        io.to(roomId).emit('response', { roomId, msg });
        io.to(roomId).emit('chatHistory', messages[roomId]);
        io.emit('getRooms');
    });

    socket.on('typing', (data) => {
        const { roomId } = data;
        socket.to(roomId).emit('typing');
    });

    socket.on('stopTyping', (data) => {
        const { roomId } = data;
        socket.to(roomId).emit('stopTyping');
    });

    // Handle room deletion
    socket.on('deleteRoom', (roomId) => {
        console.log(`Received deleteRoom event for room: ${roomId}`);
        if (messages[roomId]) {
            console.log(`Deleting room from server: ${roomId}`);
            io.to(roomId).emit('roomDeleted', { roomId });
            delete messages[roomId];
            io.emit('getRooms');
        } else {
            console.log(`Room not found: ${roomId}`);
        }
    });

    // Handle getting all rooms
    socket.on('getRooms', () => {
        const roomsList = Object.keys(messages).map((roomId) => ({
            id: roomId,
            latestMessage: messages[roomId][messages[roomId].length - 1]?.message || 'No messages yet'
        }));
        console.log('Sending rooms list:', roomsList);
        io.emit('roomsList', roomsList);
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
