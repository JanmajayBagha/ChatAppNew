import axios from 'axios';
const API = axios.create({ baseURL: 'https://chatapp-k15o.onrender.com/api' });

export function setToken(token){
  if(token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete API.defaults.headers.common['Authorization'];
}

export default API;
