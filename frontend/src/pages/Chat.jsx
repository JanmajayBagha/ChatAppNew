import React, { useEffect, useState, useRef } from "react";
import socket from "../socket";
import API, { setToken } from "../api";
import "./Chat.css";

export default function Chat() {
  const storedUser = localStorage.getItem("user");
  const me = storedUser ? JSON.parse(storedUser) : null;

  const [contacts, setContacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // for searching new users
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setToken(token);
    if (me) socket.emit("user:online", me._id);

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
          const all = res.data.filter((u) => u._id !== me._id);
          setAllUsers(all);
          setContacts(all.filter((u) => me.contacts?.includes(u._id)));
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [me]);

  const openChat = async (u) => {
    setSelected(u);
    try {
      const res = await API.get(`/messages/${u._id}?me=${me._id}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  };

  const send = async () => {
    if ((!text && !file) || !selected) return;

    let fileData = null;
    if (file) {
      const form = new FormData();
      form.append("file", file);
      const res = await API.post("/messages/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fileData = res.data.fileUrl;
    }

    const msg = {
      sender: me._id,
      recipient: selected._id,
      text,
      file: fileData,
    };
    setMessages((prev) => [...prev, msg]);
    socket.emit("send:message", msg);
    setText("");
    setFile(null);
  };

  const addContact = async (userId) => {
    try {
      await API.post("/auth/add-contact", { userId, meId: me._id });
      const updatedContacts = [...contacts, allUsers.find(u => u._id === userId)];
      setContacts(updatedContacts);
    } catch (err) {
      console.error(err);
    }
  };

  const blockUnblock = async (userId, block = true) => {
    try {
      await API.post("/auth/block-unblock", { userId, meId: me._id, block });
      // update contacts list
      setContacts((prev) => prev.filter(u => u._id !== userId));
      if (selected?._id === userId) setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteContact = async (userId) => {
    try {
      await API.post("/auth/delete-contact", { userId, meId: me._id });
      setContacts((prev) => prev.filter(u => u._id !== userId));
      if (selected?._id === userId) setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContacts = contacts.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h3>💌 Contacts</h3>
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        {filteredContacts.map((u) => (
          <div key={u._id} className={`user ${selected?._id === u._id ? "active" : ""}`}>
            <div onClick={() => openChat(u)}>
              <div className="name">{u.name}</div>
              <div className={`status ${u.online ? "on" : "off"}`}>
                {u.online ? "● Online" : "● Offline"}
              </div>
            </div>
            <div className="actions">
              <button onClick={() => deleteContact(u._id)}>🗑️</button>
              <button onClick={() => blockUnblock(u._id)}>🚫</button>
            </div>
          </div>
        ))}

        <h4>Add New Contact</h4>
        {allUsers
          .filter(u => !contacts.find(c => c._id === u._id))
          .map(u => (
            <div key={u._id} className="user">
              <div className="name">{u.name}</div>
              <button onClick={() => addContact(u._id)}>➕ Add</button>
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
              {messages.map((m, i) => (
                <div key={m._id || i} className={`msg ${m.sender === me._id ? "me" : "them"}`}>
                  {m.text && <div className="txt">{m.text}</div>}
                  {m.file && (
                    <div className="txt">
                      {m.file.endsWith(".mp4") ? (
                        <video controls src={m.file} />
                      ) : (
                        <a href={m.file} target="_blank" rel="noreferrer">📎 View File</a>
                      )}
                    </div>
                  )}
                  <div className="time">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
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
              <input type="file" onChange={e => setFile(e.target.files[0])} />
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
