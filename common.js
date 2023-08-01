const Links = {
  Home: "/",
  "MHW Loadouter": "/MHWLoadout/",
};

function createNav() {
  const navBar = document.getElementById("navBar");
  navBar.replaceChildren();

  for (const linkName in Links) {
    let element = document.createElement("li");
    element.classList.add("nav-item");

    let linkElement = document.createElement("a");
    linkElement.classList.add("nav-link");
    linkElement.href = Links[linkName];
    linkElement.innerText = linkName;

    element.appendChild(linkElement);
    navBar.appendChild(element);
  }
}

createNav();
