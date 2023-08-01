import * as MHW from "./MHWDatatypes.js";

/**
 * DB connection controller
 */
class DataBase {
  /**
   * Searches for and returns a single equipment entry.
   * @param {["head", "chest", "gloves", "waist", "legs"]} type Equipment type.
   * @param {Number} id Equipment ID.
   * @param {{}} projection {value: true, value: {value: true}}
   * for all desired data.
   * @returns {Promise<{}>} Equipment Item Promise
   */
  static async find(type, id, projection = { empty: true }) {
    const connectionURL = new URL(`https://mhw-db.com/${type}/${id}`);

    if (projection.empty !== true) {
      let p = JSON.stringify(projection);
      connectionURL.searchParams.append("p", p);
    }

    return this.#fetchDB(connectionURL);
  }
  /**
   * Searches for and returns several equipment entries in an array.
   * @param {["armor"]} type Equipment type
   * @param {{}} query Object to match entries with. Can use $gt, $lt, etc.
   * @param {{}} projection {value: true, value: {value: true}}
   * for all desired data.
   * @returns {Promise<[{}]>} Array of Equipment
   */
  static async search(type, query, projection = { empty: true }) {
    const connectionURL = new URL(`https://mhw-db.com/${type}`);

    let q = JSON.stringify(query);
    connectionURL.searchParams.append("q", q);

    if (projection.empty !== true) {
      let p = JSON.stringify(projection);
      connectionURL.searchParams.append("p", p);
    }

    return this.#fetchDB(connectionURL);
  }
  static async #fetchDB(connectionURL) {
    let data;

    await fetch(connectionURL)
      .catch((err) => {
        console.warn(`Error while connecting to MHW-db: ${err}`);
      })
      .then((res) => res.json())
      .then((res) => {
        data = res;
      });

    return data;
  }
}

/**
 * Searchbox controller
 */
class Search {
  /**
   *
   * @param {MHW.Loadout} Hunter
   * @param {*} nameID
   * @param {*} rarityID
   * @param {*} resultID
   */
  constructor(Hunter, nameID, rarityID, resultID) {
    this.#Hunter = Hunter; // Reference to the current hunter for comparison
    this.#name = document.getElementById(nameID);
    this.#rarity = document.getElementById(rarityID);
    this.#result = document.getElementById(resultID);
  }

  #Hunter;
  #selected = "";
  #name;
  #rarity;
  #result;

  /**
   *
   * @param {["head", "chest", "gloves", "waist", "legs"]} toSelect
   */
  select(toSelect) {
    let elements = document.getElementsByClassName(
      "MHW_MainGrid-equipment-item-selected"
    );
    for (const element of elements) {
      element.classList.remove("MHW_MainGrid-equipment-item-selected");
    }

    if (!MHW.DataTypes.bodySections.includes(toSelect)) {
      console.warn(`Invalid body section: "${toSelect}"`);
    } else if (this.#selected !== toSelect) {
      this.#selected = toSelect;
      let thisElement = document.getElementById(toSelect);
      thisElement.classList.add("MHW_MainGrid-equipment-item-selected");
      console.log(`Change selected: ${toSelect}`);
    } else {
      this.#selected = "";
      console.log(`Cleared selected`);
    }
    this.clearSearch();
  }

  /**
   * Search for matching armor records of the currently selected type.
   * Then fill the results box with recods.
   */
  async search() {
    if (this.#selected !== "") {
      this.#name.value = this.#name.value.trim();

      const query = {
        type: this.#selected,
      };

      if (this.#rarity.value !== "") {
        query.rarity = this.#rarity.value;
      }

      let result = await DataBase.search("armor", query, {
        id: "true",
        name: "true",
        rarity: "true",
        defense: {
          base: "true",
        },
        "resistances.fire": "true",
        "resistances.water": "true",
        "resistances.ice": "true",
        "resistances.thunder": "true",
        "resistances.dragon": "true",
      });

      //Matches exist
      if (result !== undefined && result.length !== 0) {
        this.clearSearch();

        console.log(result);

        result.forEach((record) => {
          if (
            record.name.toLowerCase().includes(this.#name.value.toLowerCase())
          ) {
            let card = this.#createMiniCard(record);
            this.#result.appendChild(card);
          }
        });
      } else {
        this.#result.innerHTML = this.#createWarnCard("No results");
      }
    } else {
      alert("Select an armor slot");
    }
  }

  clearSearch() {
    this.#result.replaceChildren("");
  }

  /**
   *
   * @param {{}} record
   * @returns {String}
   */
  #createMiniCard(record) {
    //TODO -- make this work
    const card = document.createElement("div");
    card.classList.add("MHW_MainGrid-searchResult-item");

    let name = document.createElement("b");
    name.innerHTML = `<i class="bi bi-arrow-left"></i>${record.name}`;
    name.onclick = async () => {
      await this.#Hunter.body.replaceItem(this.#selected, record.id); // TODO - make this
    };
    card.appendChild(name);

    let def = document.createElement("span");
    def.innerText = ` def: ${record.defense.base} `;
    if (
      record.defense.base > this.#Hunter.body[this.#selected].data.defense.base
    ) {
      def.style.color = "green";
    } else if (
      record.defense.base < this.#Hunter.body[this.#selected].data.defense.base
    ) {
      def.style.color = "maroon";
    } else {
      def.style.color = "grey";
    }
    card.appendChild(def);

    //TODO maybe turn this into a may with the MHW.DataTypes class...
    const resistDisplay = {
      Fi: `${record.resistances.fire} `,
      Wa: `${record.resistances.water} `,
      Ic: `${record.resistances.ice} `,
      Th: `${record.resistances.thunder} `,
      Dr: `${record.resistances.dragon} `,
    };

    let resistList = document.createElement("div");

    for (const resist in resistDisplay) {
      let span = document.createElement("span");
      span.innerText = `${resist}: ${resistDisplay[resist]}`;
      span.style.color = MHW.DataTypes.elementColors[resist];
      resistList.appendChild(span);
    }
    card.appendChild(resistList);

    return card;
  }

  /**
   *
   * @param {String} warning
   * @returns {String}
   */
  #createWarnCard(warning) {
    const card = document.createElement("div");
    card.classList.add("MHW_MainGrid-searchResult-item");

    let text = document.createElement("b");
    text.innerText = warning;
    card.appendChild(text);

    return card.outerHTML;
  }
}

class Storage {
  static check(slot) {
    let loadout = localStorage.getItem(`slot${slot}`);
    return loadout !== null;
  }

  static saveTo(slot, loadout) {
    localStorage.setItem(`slot${slot}`, JSON.stringify(loadout));
    console.log(`Saved loadout to Slot${slot}`);
  }
  static loadFrom(slot) {
    let loadout = localStorage.getItem(`slot${slot}`);
    if (loadout === null) {
      throw `Could not load Slot${slot}: No entry found`;
    } else {
      return JSON.parse(loadout);
    }
  }

  static saveLoadout(name, loadout) {
    let loadouts = this.loadAllLoadouts();

    let match = loadouts.findIndex((item) => item.name === name);

    if (match !== -1) {
      loadouts[match].loadout = loadout;
    } else {
      let newID = 0;
      while (true) {
        for (const item of loadouts) {
          if (Number(newID) === Number(item.id)) {
            newID++;
            continue;
          }
        }
        break;
      }

      loadouts.push({ name: name, id: newID, loadout: loadout });
      loadouts.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.saveTo("Loadouts", loadouts);
  }
  static loadLoadout(id) {
    let loadouts = this.loadAllLoadouts();

    for (const item of loadouts) {
      if (Number(item.id) === Number(id)) {
        return item;
      }
    }

    console.error(`Unable to find ID: ${id}`);
    return undefined;
  }
  static loadAllLoadouts() {
    let loadouts;
    if (this.check("Loadouts")) {
      loadouts = this.loadFrom("Loadouts");
    } else {
      loadouts = [];
    }
    return loadouts;
  }
  static removeLoadout(id) {
    let loadouts = this.loadAllLoadouts();

    for (let i = 0; i < loadouts.length; i++) {
      if (Number(loadouts[i].id) === Number(id)) {
        console.log("gottem?");
        loadouts.splice(i);
      }
    }

    console.log(`Removed ID: ${id}`);

    this.saveTo("Loadouts", loadouts);
  }

  static reset() {
    localStorage.clear();
  }
}

export { DataBase, Search, Storage };
