import React, { useEffect, useState, useRef } from "react";
import socket from "../socket";
import API, { setToken } from "../api";
import "./Chat.css";

export default function Chat() {
  const storedUser = localStorage.getItem("user");
  const me = storedUser ? JSON.parse(storedUser) : null;

  const [contacts, setContacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [searchContacts, setSearchContacts] = useState("");
  const [searchAll, setSearchAll] = useState("");
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

  // Load contacts and blocked users from localStorage
  useEffect(() => {
    const savedContacts = JSON.parse(localStorage.getItem("contacts")) || [];
    setContacts(savedContacts);

    const blocked = JSON.parse(localStorage.getItem("blocked")) || [];
    setBlockedUsers(blocked);
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

  // Chat functions
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

  const send = async () => {
    if (!text.trim() && !file) return;
    if (!selected || !me) return;

    let message = {
      sender: me.id,
      recipient: selected._id,
      text: text || "",
      createdAt: new Date().toISOString(),
    };

    // Upload file if selected
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await API.post("/messages/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.file = res.data.fileUrl;
        message.fileType = file.type;
      } catch (err) {
        console.error("File upload failed", err);
        return;
      }
    }

    setMessages((prev) => [...prev, message]); // optimistic update
    socket.emit("send:message", message);

    setText("");
    setFile(null);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Contact management
  const addContact = (user) => {
    if (!contacts.find((c) => c._id === user._id)) {
      const newContacts = [...contacts, user];
      setContacts(newContacts);
      localStorage.setItem("contacts", JSON.stringify(newContacts));
    }
    setSelected(user);
  };

  const removeContact = (user) => {
    const newContacts = contacts.filter((c) => c._id !== user._id);
    setContacts(newContacts);
    localStorage.setItem("contacts", JSON.stringify(newContacts));
    if (selected?._id === user._id) setSelected(null);
  };

  const blockContact = (user) => {
    if (!blockedUsers.find((b) => b._id === user._id)) {
      const newBlocked = [...blockedUsers, user];
      setBlockedUsers(newBlocked);
      localStorage.setItem("blocked", JSON.stringify(newBlocked));
    }
    removeContact(user);
  };

  const unblockContact = (user) => {
    const newBlocked = blockedUsers.filter((b) => b._id !== user._id);
    setBlockedUsers(newBlocked);
    localStorage.setItem("blocked", JSON.stringify(newBlocked));
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

          {contacts
            .filter((u) =>
              u.name.toLowerCase().includes(searchContacts.toLowerCase())
            )
            .map((u) => (
              <div
                key={u._id}
                className={`user ${selected?._id === u._id ? "active" : ""}`}
              >
                <div className="name" onClick={() => openChat(u)}>
                  {u.name}
                </div>
                <div className="user-actions">
                  <button onClick={() => removeContact(u)}>🗑 Remove</button>
                  <button onClick={() => blockContact(u)}>🚫 Block</button>
                </div>
                <div className={`status ${u.online ? "on" : "off"}`}>
                  {u.online ? "● Online" : "● Offline"}
                </div>
              </div>
            ))}

          {contacts.filter((u) =>
            u.name.toLowerCase().includes(searchContacts.toLowerCase())
          ).length === 0 && <p className="empty-msg">No contacts found.</p>}
        </div>

        <hr />

        {/* Blocked Users Section */}
        {blockedUsers.length > 0 && (
          <div className="sidebar-section">
            <h4>⛔ Blocked Users</h4>
            {blockedUsers.map((u) => (
              <div key={u._id} className="user blocked">
                <div className="name">{u.name}</div>
                <button onClick={() => unblockContact(u)}>✅ Unblock</button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Users Section */}
        <div className="sidebar-section">
          <input
            type="text"
            placeholder="Find new users..."
            value={searchAll}
            onChange={(e) => setSearchAll(e.target.value)}
            className="contact-search"
          />
          {allUsers
            .filter(
              (u) =>
                !contacts.find((c) => c._id === u._id) &&
                !blockedUsers.find((b) => b._id === u._id) &&
                u.name.toLowerCase().includes(searchAll.toLowerCase())
            )
            .map((u) => (
              <div key={u._id} className="user">
                <div className="name">{u.name}</div>
                <button onClick={() => addContact(u)}>➕ Add</button>
              </div>
            ))}
        </div>
      </aside>

      {/* Chat Window */}
      <section className="conversation">
        {selected ? (
          <>
            <header className="conv-header">Chat with {selected.name} 💖</header>

            <div className="messages">
              {messages.map((m) => (
                <div
                  key={m._id || `${m.sender}-${m.createdAt}`}
                  className={`msg ${m.sender === me?.id ? "me" : "them"}`}
                >
                  {m.text && <div className="txt">{m.text}</div>}

                  {m.file && (
                    <>
                      {m.fileType.startsWith("image") && (
                        <img src={m.file} alt="sent" className="chat-image" />
                      )}
                      {m.fileType.startsWith("video") && (
                        <video controls className="chat-video">
                          <source src={m.file} type={m.fileType} />
                        </video>
                      )}
                      {!m.fileType.startsWith("image") &&
                        !m.fileType.startsWith("video") && (
                          <a
                            href={m.file}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download File
                          </a>
                        )}
                    </>
                  )}

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
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="file-input"
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
