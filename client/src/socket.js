
import { io } from "socket.io-client";

const socket = io("https://itsimplere-fullstack.onrender.com", {
    autoConnect: false,
    auth: {
        token: localStorage.getItem("token")
    }
});

export default socket;
