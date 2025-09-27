import React, { useEffect, useState, useRef } from "react";
import socket from "../socket";
import API, { setToken } from "../api";
import "./Chat.css";

export default function Chat() {
  const storedUser = localStorage.getItem("user");
  const me = storedUser ? JSON.parse(storedUser) : null;

  const [contacts, setContacts] = useState([]);      // Users you added
  const [allUsers, setAllUsers] = useState([]);      // All registered users
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [searchContacts, setSearchContacts] = useState("");  // Filter contacts
  const [searchAll, setSearchAll] = useState("");            // Search new users
  const bottomRef = useRef();

  // Load all users
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/auth/users");
        if (res?.data) {
          const others = res.data.filter((u) => u._id !== me?.id);
          setAllUsers(others);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    })();
  }, [me]);

  // Load saved contacts
  useEffect(() => {
    const savedContacts = JSON.parse(localStorage.getItem("contacts")) || [];
    setContacts(savedContacts);
  }, []);

  // Socket setup
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

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const addContact = (user) => {
    if (!contacts.find((c) => c._id === user._id)) {
      const newContacts = [...contacts, user];
      setContacts(newContacts);
      localStorage.setItem("contacts", JSON.stringify(newContacts));
    }
    setSelected(user);
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

        {/* Contacts Section */}
        <div className="sidebar-section">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchContacts}
            onChange={(e) => setSearchContacts(e.target.value)}
            className="contact-search"
          />

          {contacts.filter((u) =>
            u.name.toLowerCase().includes(searchContacts.toLowerCase())
          ).length === 0 && <p className="empty-msg">No contacts found.</p>}

          {contacts
            .filter((u) =>
              u.name.toLowerCase().includes(searchContacts.toLowerCase())
            )
            .map((u) => (
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
        </div>

        <hr />

        {/* Add New Users Section (show only when typing) */}
        {searchAll.trim() && (
          <div className="sidebar-section">
            <h4>➕ Add New Users</h4>
            {allUsers
              .filter(
                (u) =>
                  !contacts.find((c) => c._id === u._id) &&
                  u.name.toLowerCase().includes(searchAll.toLowerCase())
              )
              .map((u) => (
                <div key={u._id} className="user">
                  <div className="name">{u.name}</div>
                  <button onClick={() => addContact(u)}>➕ Add</button>
                </div>
              ))}
            {allUsers.filter(
              (u) =>
                !contacts.find((c) => c._id === u._id) &&
                u.name.toLowerCase().includes(searchAll.toLowerCase())
            ).length === 0 && <p className="empty-msg">No users found.</p>}
          </div>
        )}

        {/* Search bar for Add New Users */}
        <input
          type="text"
          placeholder="Find new users..."
          value={searchAll}
          onChange={(e) => setSearchAll(e.target.value)}
          className="contact-search"
        />
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
