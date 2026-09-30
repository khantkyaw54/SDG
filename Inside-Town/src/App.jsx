import { HashRouter, Routes, Route } from "react-router-dom";

import {
  AuthScreen,
  RegistrationScreen,
  RoleScreen,
  StoryScreen,
} from "./pages/onboarding";

import Select from "./pages/Select";
import Map from "./pages/Map";
import Detail from "./pages/Detail";
import Search from "./pages/Search";
import User from "./pages/User";

import ShopPortal from "./pages/shop_portal";
import GovernmentPortal from "./pages/government_portal";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={<StoryScreen key="splash" step="splash" />}
        />

        <Route
          path="/intro"
          element={<StoryScreen key="intro" step="intro" />}
        />

        <Route path="/auth" element={<AuthScreen />} />

        <Route path="/role-select" element={<RoleScreen />} />

        {[
          "register",
          "verify",
          "town-register",
          "town-verify",
          "confirm",
        ].map((step) => (
          <Route
            key={step}
            path={`/${step}`}
            element={
              <RegistrationScreen
                key={step}
                step={step}
              />
            }
          />
        ))}

        <Route
          path="/complete"
          element={<StoryScreen key="complete" step="complete" />}
        />

        <Route
          path="/guide"
          element={<StoryScreen key="guide" step="guide" />}
        />

        <Route path="/select" element={<Select />} />
        <Route path="/map" element={<Map />} />
        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/user" element={<User />} />
        <Route path="/shop" element={<ShopPortal />} />
        <Route path="/government" element={<GovernmentPortal />} />
      </Routes>
    </HashRouter>
  );
}

export default App;