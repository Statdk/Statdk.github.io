import * as MHW from "./MHWDatatypes.js";
import { DataBase, Search, Storage } from "./MHWControllers.js";

//Reloads equipment details
/**
 *
 * @param {MHW.Loadout} Hunter
 */
function reloadDOM(Hunter) {
  console.log(Hunter);

  //Storage

  Storage.saveTo("Current", Hunter);

  //Fill saved list
  let savedList = document.getElementById("savedList");
  savedList.innerHTML = `
    <option value="---" selected="selected">---</option>
  `;
  let savedLoadouts = Storage.loadAllLoadouts();
  savedLoadouts.forEach((item) => {
    savedList.innerHTML += `<option value="${item.id}">${item.name}</option>`;
  });

  //Updating Hunter Info

  //Get the value of the armorType radio.
  let armorType;
  try {
    armorType = document.querySelector('input[name="armorType"]:checked').value;
  } catch {
    console.warn("Armor type not set");
    armorType = "Male";
  }

  console.assert(
    armorType === "Male" || armorType === "Female",
    "Incorrect value in armorType: ",
    armorType
  );

  for (const section in Hunter.body) {
    let element = document.getElementById(section);

    element.innerHTML = Hunter.body[section].createCard(armorType);
  }

  // TODO - Overall Stats
  // TODO - Search add/remove item under MainGrid-searchResult
  // Move totals to lower panel, have right side modifying individual armors?

  document.getElementById("defenseTotal").innerText = Hunter.body.getDefense();

  document.getElementById("resistTable").innerHTML =
    Hunter.body.makeResistTable();

  document.getElementById("skillList").innerHTML = Hunter.body.makeSkillsList();

  document.getElementById("materialsList").innerHTML =
    Hunter.body.makeMaterialsList();
}

/**
 * run once after page loads
 * @param {MHW.Loadout} Hunter
 */
function initDOM(Hunter) {
  const search = new Search(
    Hunter,
    "searchEquipName",
    "searchEquipRarity",
    "searchResult"
  );

  //Attach listeners

  //Body slot click events
  for (const section in Hunter.body) {
    let element = document.getElementById(`${section}`);

    element.onclick = () => {
      search.select(section);
    };
  }

  //Search button
  document.getElementById("searchEquipBtn").onclick = async () => {
    await search.search();
  };

  //Make the main grid's animation rebound
  let grid = document.getElementById("mainGrid");
  let gridContainer = document.getElementById("gridContainer");

  grid.addEventListener("transitionend", function (transition) {
    if (!this.classList.contains("maximize")) {
      try {
        reloadDOM(Hunter);
      } catch (err) {
        console.error(err);
      }
      this.classList.add("maximize");
    }
  });

  //Show pretty effect
  grid.classList.add("maximize");

  let settingsBtn = document.getElementById("settingsBtn");
  let settingsPanel = document.getElementById("settingsPanel");
  settingsBtn.onclick = () => {
    // if (settingsPanel.hidden) {
    if (!settingsPanel.classList.contains("maximize")) {
      // settingsPanel.hidden = false;
      settingsPanel.classList.add("maximize");
    } else {
      settingsPanel.classList.remove("maximize");
    }
  };
  settingsPanel.onclick = () => {
    reloadDOM(Hunter);
  };

  let saveBtn = document.getElementById("saveBtn");
  saveBtn.onclick = () => {
    let name = document.getElementById("newSaveName").value;

    if (name === "") {
      alert("Please enter a valid name.");
    } else {
      Storage.saveLoadout(name, Hunter);

      //Initiate transition / DOM update
      document.getElementById("mainGrid").classList.remove("maximize");
    }
  };

  let selectedSave = document.getElementById("savedList");

  let loadBtn = document.getElementById("loadBtn");
  loadBtn.onclick = () => {
    const id = selectedSave.value;

    if (id === "---") {
      alert("Please select a loadout");
    } else {
      let newHunter = Storage.loadLoadout(id);

      console.log(newHunter);
      let name = document.getElementById("newSaveName");
      name.value = newHunter.name;
      Hunter.clone(newHunter.loadout);

      //Initiate transition / DOM update
      document.getElementById("mainGrid").classList.remove("maximize");
    }
  };

  let deleteBtn = document.getElementById("deleteBtn");
  deleteBtn.onclick = () => {
    const id = selectedSave.value;

    if (id === "---") {
      alert("Please select a loadout");
    } else {
      Storage.removeLoadout(id);

      //Initiate transition / DOM update
      reloadDOM(Hunter);
    }
  };

  let reloadBtn = document.getElementById("reloadBtn");
  reloadBtn.onclick = (ev) => {
    ev.stopPropagation();
    Storage.reset();
    location.reload();
  };

  reloadDOM(Hunter);
}

//Run once as page loads
async function init() {
  //TODO const Hunter = get current hunter from cookies.

  let Hunter = undefined;

  if (Storage.check("Current")) {
    try {
      Hunter = new MHW.Loadout(Storage.loadFrom("Current"));
    } catch (error) {
      console.error("Current was marked as undefined. Loading default.");
      console.log(error);
      Hunter = new MHW.Loadout();
    }
  } else {
    Hunter = new MHW.Loadout();
  }

  console.log(Hunter);

  document.addEventListener("DOMContentLoaded", () => {
    initDOM(Hunter);
  });
}

init();

/**
 * For weapons, use ejs to build tree and views from there?
 *
 * Would obvs have to use new controllers and datatypes for
 * an independant system.
 */
