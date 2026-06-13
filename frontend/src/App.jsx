import { useState } from "react";
import Login from "./pages/login/Login.jsx";
import Home from "./pages/home/Home.jsx";

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (username, role) => {
    setUser({ username, role });
  };

  return user ? (
    <Home user={user} />
  ) : (
    <Login onLogin={handleLogin} />
  );
}

export default App;