import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Chat from './pages/Chat';
import API, { setToken } from './api';

export default function App(){
  const [token, setTok] = useState(localStorage.getItem('token'));
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || null);

  useEffect(()=>{
    if(token){
      setToken(token);
      setTok(token);
    }
  },[token]);

  if(!token) return (
    <div className="center">
      <h2>Welcome</h2>
      <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
    </div>
  );

  return <Chat user={user} />;
}
