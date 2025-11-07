import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import InterfaceMapResponsive from "./Components/Interface";
import Statistique from "./Components/Statistique";
import AdminPanel from "./Components/AdminPanel";

function App() {
  return (
    
      <Routes>
        <Route path="/" element={<InterfaceMapResponsive />} />
        <Route path="/statistique" element={<Statistique />} />
        <Route path="/adminPanel" element={<AdminPanel />} />
      </Routes>
    
  );
}

export default App;