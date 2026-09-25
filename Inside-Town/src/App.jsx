import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Start from "./pages/Start";
import Select from "./pages/Select";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/select" element={<Select />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;