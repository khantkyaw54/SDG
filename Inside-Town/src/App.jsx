import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Start from "./pages/Start";
import Select from "./pages/Select";
import Map from "./pages/Map";
import Detail from "./pages/detail";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/select" element={<Select />} />
        <Route path="/map" element={<Map />} />
        <Route
          path="/detail/:id"
          element={<Detail />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;