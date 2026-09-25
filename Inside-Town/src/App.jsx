import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Start from "./pages/Start";
import Select from "./pages/Select";
import Map from "./pages/Map";
import Detail from "./pages/Detail";
import Search from "./pages/Search";
import User from "./pages/User";

import ShopPortal from "./pages/shop_portal";
import GovernmentPortal from "./pages/government_portal";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/select" element={<Select />} />
        <Route path="/map" element={<Map />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/user" element={<User />} />
        <Route path="/shop" element={<ShopPortal />} />
        <Route path="/government" element={<GovernmentPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;