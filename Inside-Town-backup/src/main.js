import "./style.scss";
import { renderStart } from "./pages/start.js";

function router() {
  const hash = window.location.hash || "#start";

  if (hash === "#start") {
    renderStart();
    return;
  }

  renderStart();
}

window.addEventListener("hashchange", router);

router();