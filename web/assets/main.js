const element = document.getElementById("root");

import Dashboard, { initDashboard } from "/assets/pages/dashboard.js";
import NotFound from "/assets/pages/not_found.js";

function route() {
  const currentUrl = window.location.pathname;

  switch (currentUrl) {
    case "/":
      element.innerHTML = Dashboard();
      initDashboard();
      break;
    default:
      element.innerHTML = NotFound();
  }
}

route();

const link = document.querySelectorAll(".navigation");

link.forEach((element) => {
  element.addEventListener("click", (event) => {
    event.preventDefault();

    if (window.location.pathname === event.target.pathname) {
        return;
    }

    window.history.pushState(null, "", event.target.pathname);

    route();
  });
});

window.addEventListener("popstate", (event) => {    
    route();
})