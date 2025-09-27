import { useEffect } from "react";

export default function Logout() {
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login"; // redirect to login
  }, []);

  return <p>Logging out...</p>;
}
