export class Cell {
    game;
    map;
    x;
    y;
    enemy;
    health;
    heat;
    visible;
    element;
    word;
    combatWord;
    inCombat;

    constructor(opts) {
        Object.assign(this, opts);
    }

    show() {
        const cell = this;
        if (cell.visible)
            return;

        cell.visible = true;
        cell.element.classList.add("visible");
        if (cell.heat === 0) {
            for (let i = 0; i < 6; i++) {
                const [nx, ny] = this.map.offsetCoords(cell.x, cell.y, i);
                if (this.map.isValidCell(nx, ny)) {
                    const nextCell = this.map.cells[this.map.coordsToIndex(nx, ny)];
                    if (!nextCell.visible) {
                        nextCell.show();
                    }
                }
            }
        }
    }

    damageCell() {
        const cell = this;
        cell.health--;
        if (cell.health > 0) {
            cell.combatWord = this.map.getWord(cell.enemy);
            cell.element.classList.add("inCombat");
            cell.inCombat = true;
            // 30% to 80% visible
            let dmg = cell.health / cell.enemy * 50 + 30
            cell.element.querySelector(".hex").style = `background: -webkit-linear-gradient(#333 0%, #333 ${dmg}%, #555 ${dmg}%, #555);`
        } else {
            cell.combatWord = null;
            cell.element.classList.remove("inCombat");
            cell.inCombat = false;
            cell.element.querySelector(".hex").style = "";
        }
    }

    drawCell() {
        const {x, y} = this;

        const container = document.createElement("div");
        container.style.left = x * 100 + (y % 2) * 50 + "px";
        container.style.top = y * 91 + "px";
        container.className = "cell";

        const hex = document.createElement("div");
        hex.innerHTML = "&#x2B22;";
        hex.className = "hex";
        container.appendChild(hex);

        if (this.heat) {
            const heat = document.createElement("div");
            heat.textContent = this.heat;
            heat.className = "annotation heat";
            container.appendChild(heat);
        }

        if (this.enemy) {
            const enemy = document.createElement("div");
            enemy.textContent = this.enemy;
            enemy.className = "annotation enemy";
            container.appendChild(enemy);
        }

        this.game.ui.cellsContainer.appendChild(container);
        return container;
    }

    drawOffsetLabel(x, y, pos, text) {
        if (!text)
            return;

        const div = document.createElement("div");

        let left = x * 100 + (y % 2) * 50 + 63;
        if (pos < 3) {
            left += 10;
            if (pos === 1)
                left += 50;
            div.style.left = left + "px";
        } else {
            left -= 10;
            if (pos === 4)
                left -= 50;
            div.style.right = `calc(100% - ${left}px)`;
        }

        let yPos = pos > 2 ? 5 - pos : pos;
        let top = (y + yPos) * 91;
        div.style.top = top + "px";

        div.textContent = text;
        div.className = "label";
        if (pos > 2)
            div.classList.add("left");
        if (this.inCombat)
            div.classList.add("inCombat");
        this.game.ui.labelsContainer.appendChild(div);
    }

}