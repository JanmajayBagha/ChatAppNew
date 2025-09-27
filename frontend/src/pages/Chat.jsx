import React, { useEffect, useState, useRef } from "react";
import socket from "../socket";
import API, { setToken } from "../api";
import "./Chat.css";

export default function Chat() {
  const storedUser = localStorage.getItem("user");
  const me = storedUser ? JSON.parse(storedUser) : null;

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState(""); // For search input
  const bottomRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setToken(token);
    if (me) socket.emit("user:online", me.id);

    const handleReceive = (msg) => {
      if (msg.sender === selected?._id || msg.recipient === selected?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const handleSent = (msg) => setMessages((prev) => [...prev, msg]);

    socket.on("receive:message", handleReceive);
    socket.on("message:sent", handleSent);

    return () => {
      socket.off("receive:message", handleReceive);
      socket.off("message:sent", handleSent);
    };
  }, [selected, me]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/auth/users");
        if (res?.data) {
          const otherUsers = res.data.filter((u) => u._id !== me?.id);
          setUsers(otherUsers);
          setFilteredUsers(otherUsers); // initially show all
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    })();
  }, [me]);

  // Filter contacts as user types
  useEffect(() => {
    setFilteredUsers(
      users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, users]);

  const openChat = async (u) => {
    setSelected(u);
    try {
      const res = await API.get(`/messages/${u._id}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to load messages", err);
      setMessages([]);
    }
  };

  const send = () => {
    if (!text.trim() || !selected || !me) return;
    const msg = {
      sender: me.id,
      recipient: selected._id,
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    socket.emit("send:message", msg);
    setText("");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>💌 Contacts</h3>
          <button className="logout-btn" onClick={logout}>
            🚪 Logout
          </button>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="contact-search"
        />

        {/* Contact List */}
        {filteredUsers.map((u) => (
          <div
            key={u._id}
            className={`user ${selected?._id === u._id ? "active" : ""}`}
            onClick={() => openChat(u)}
          >
            <div className="name">{u.name}</div>
            <div className={`status ${u.online ? "on" : "off"}`}>
              {u.online ? "● Online" : "● Offline"}
            </div>
          </div>
        ))}
      </aside>

      {/* Chat Window */}
      <section className="conversation">
        {selected ? (
          <>
            <header className="conv-header">
              Chat with {selected.name} 💖
            </header>

            <div className="messages">
              {messages.map((m) => (
                <div
                  key={m._id || `${m.sender}-${m.createdAt}`}
                  className={`msg ${m.sender === me?.id ? "me" : "them"}`}
                >
                  <div className="txt">{m.text}</div>
                  <div className="time">
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <footer className="composer">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a sweet message..."
              />
              <button onClick={send}>❤️ Send</button>
            </footer>
          </>
        ) : (
          <div className="empty">Select a contact to start your love chat 💕</div>
        )}
      </section>
    </div>
  );
}
