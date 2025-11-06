import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import InterfaceMapResponsive from "./Components/Interface";
import Statistique from "./Components/Statistique";

function App() {
  return (
    
      <Routes>
        <Route path="/" element={<InterfaceMapResponsive />} />
        <Route path="/statistique" element={<Statistique />} />
      </Routes>
    
  );
}

export default App;