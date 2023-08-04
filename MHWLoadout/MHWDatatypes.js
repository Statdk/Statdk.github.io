import { DataBase } from "./MHWControllers.js";
import { Default } from "./MHWDefaultLoad.js";

/**
 * Various constants related to MHW
 */
class DataTypes {
  /**
   * Element names to CSS color
   */
  static elementColors = {
    fire: "red",
    water: "blue",
    ice: "cyan",
    thunder: "gold",
    dragon: "magenta",
    blast: "orange",
    poison: "purple",
    sleep: "skyblue",
    paralysis: "yellow",
    stun: "khaki",
  };
  /**
   * Resistance shorthand to CSS color
   */
  static resistColor = {
    Fi: this.elementColors.fire,
    Wa: this.elementColors.water,
    Ic: this.elementColors.ice,
    Th: this.elementColors.thunder,
    Dr: this.elementColors.dragon,
  };
  /**
   * Resistance name to shorthand
   */
  static resistDisplay = {
    fire: "Fi",
    water: "Wa",
    ice: "Ic",
    thunder: "Th",
    dragon: "Dr",
  };
  /**
   * List of all armor slots
   */
  static bodySections = ["head", "chest", "gloves", "waist", "legs"];
}

/**
 * Hunter Loadout -- Single Equipment Item
 */
class Armor {
  constructor(id, data = undefined) {
    this.id = id;
    this.data = data;
  }

  id;
  data;

  /**
   * Returns the resistance of this object to a particular element
   * @param {"fire" | "water" | "ice" | "thunder" | "dragon"} type Element to check resistance.
   * @returns {number} Elemental resistance
   */
  getResistance(type) {
    try {
      return this.data.resistances[type];
    } catch (err) {
      console.error(err);
      return 0;
    }
  }

  /**
   * Creates a card for a single equipment record.
   * @param {["Male", "Female"]} armorType
   * @returns {String} Equipment card
   */
  createCard(armorType) {
    const items = [];

    let img = document.createElement("img");
    if (this.data.assets !== null) {
      img.setAttribute("src", this.data.assets[`image${armorType}`]);
    }
    items.push(img);

    const statsDisplay = {
      Name: this.data.name,
      Rank: this.data.rank,
      Rarity: this.data.rarity,
      "Base Defense": this.data.defense.base,
      "Max Defense": this.data.defense.max,
    };
    let stats = document.createElement("ul");
    for (const attribute in statsDisplay) {
      let element = document.createElement("li");
      element.innerText = `${attribute}: ${statsDisplay[attribute]}`;
      stats.appendChild(element);
    }
    items.push(stats);

    let resistances = document.createElement("div");
    for (const resistance in DataTypes.resistDisplay) {
      let element = document.createElement("span");

      element.title = resistance;

      element.style.color =
        DataTypes.resistColor[DataTypes.resistDisplay[resistance]]; // changed this ?

      element.innerText = `${
        DataTypes.resistDisplay[resistance]
      }: ${this.getResistance(resistance)} `;

      resistances.appendChild(element);
    }
    items.push(resistances);

    let str = "";
    items.forEach((element) => {
      str += element.outerHTML;
    });
    return str;
  }
}

/**
 * Hunter Loadout -- Body Section
 */
class Body {
  /**
   * Create a new body object; optionally with data.
   * @param {{}} bodyData Data to fill with
   */
  constructor(bodyData = undefined) {
    if (bodyData !== undefined) {
      this.head = new Armor(bodyData.head.id, bodyData.head.data);
      this.chest = new Armor(bodyData.chest.id, bodyData.chest.data);
      this.gloves = new Armor(bodyData.gloves.id, bodyData.gloves.data);
      this.waist = new Armor(bodyData.waist.id, bodyData.waist.data);
      this.legs = new Armor(bodyData.legs.id, bodyData.legs.data);
    }
  }

  head = new Armor(1);
  chest = new Armor(2);
  gloves = new Armor(3);
  waist = new Armor(4);
  legs = new Armor(5);

  async replaceItem(slot, newID) {
    this[slot].id = newID;
    this[slot].data = await DataBase.find("armor", newID);

    // let card = document.getElementById(`${slot}`);
    // card.innerHTML = this[slot].createCard("Male"); // Change this, maybe even whole function's location
    //update status??

    //temporary measure.... bad solution to call updateDOM();
    document.getElementById("mainGrid").classList.remove("maximize");
  }

  getDefense() {
    let total = 0;
    DataTypes.bodySections.forEach((section) => {
      total += this[section].data.defense.base;
    });
    return total;
  }

  getTotalResist(type) {
    let total = 0;
    DataTypes.bodySections.forEach((section) => {
      total += this[section].data.resistances[type];
    });
    return total;
  }

  makeResistTable() {
    let table = "<table>";

    const maxCol = 3;
    let col = 0;

    for (const type in DataTypes.resistDisplay) {
      if (col >= maxCol) {
        table += "</tr><tr>";
        col = 0;
      }
      col++;

      table += `<td title="${type}" style="color: ${
        DataTypes.resistColor[DataTypes.resistDisplay[type]]
      }">${DataTypes.resistDisplay[type]}: ${this.getTotalResist(type)}</td>`;
    }
    table += "</table>";

    return table;
  }

  makeSkillsList() {
    //Improve eventually to communicate w/ db

    let skillsTotal = {
      //id: { level: Number, skillName: String }
    };

    DataTypes.bodySections.forEach((section) => {
      if (this[section].data.skills.length !== 0) {
        this[section].data.skills.forEach((skill) => {
          if (skillsTotal[skill.id] === undefined) {
            skillsTotal[skill.id] = {
              level: skill.level,
              skillName: skill.skillName,
            };
          } else {
            skillsTotal[skill.id].level += skill.level;
          }
        });
      }
    });

    // console.log(skillsTotal);

    let list = "<ul>";

    for (const id in skillsTotal) {
      list += `
      <li>
        ${skillsTotal[id].skillName}: ${skillsTotal[id].level}
      </li>
      `;
    }

    list += "</ul>";
    return list;
  }

  makeMaterialsList() {
    let itemList = {
      //id: { //quantity: Number, itemName: String }
    };

    DataTypes.bodySections.forEach((section) => {
      if (this[section].data.crafting.materials.length !== 0) {
        this[section].data.crafting.materials.forEach((material) => {
          if (itemList[material.item.id] === undefined) {
            itemList[material.item.id] = {
              quantity: material.quantity,
              itemName: material.item.name,
            };
          } else {
            itemList[material.item.id].quantity += material.quantity;
          }
        });
      }
    });

    // console.log(itemList);

    let list = "<ul>";

    for (const id in itemList) {
      list += `
      <li>
        ${itemList[id].itemName}: ${itemList[id].quantity}
      </li>
      `;
    }

    list += "</ul>";
    return list;
  }
}

/**
 * Hunter Loadout
 */
class Loadout {
  /**
   * @param {Body} bodyData data from storage
   */
  constructor(data = undefined) {
    if (data !== undefined) {
      this.body = new Body(data.body);
    } else {
      this.body = new Body(Default.body);
    }
  }
  body;

  /**
   * Overwrites current loadout with new data
   * @param {Loadout} loadout Json
   */
  clone(loadout) {
    this.body = new Body(loadout.body);

    return this;
  }
}

export { Loadout, Armor, DataTypes };
