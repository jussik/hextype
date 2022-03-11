import { WordEvents } from "./wordPrompt.js";
import { PlayerEvents } from "./player.js";
import { GameObject } from "./gameObject.js";
import { CellEvents } from "./cell.js";
import { MapEvents } from "./map.js";

export class Ui extends GameObject {
    body = document.body;
    help = document.getElementById("help");
    promptElem = document.getElementById("promptElem");
    timeElem = document.getElementById("timeElem");
    xpElem = document.getElementById("xpElem");
    levelElem = document.getElementById("levelElem");
    healthElem = document.getElementById("healthElem");
    currentWordElem = document.getElementById("currentWordElem");
    worldElem = document.getElementById("worldElem");
    cellsContainer = document.getElementById("cellsContainer");
    labelsContainer = document.getElementById("labelsContainer");
    
    constructor(game) {
        super(game);
        
        this.events.addEventListener(WordEvents.Changed, ev => {
            this.currentWordElem.textContent = ev.word;
        });
        
        let helpVisible = true;
        this.events.addEventListener(WordEvents.Accepted, () => {
            if (helpVisible) {
                this.help.style.display = "none";
                helpVisible = false;
            }
        });

        this.events.addEventListener(PlayerEvents.Moved, ev => {
            // update player location
            for (let act of document.getElementsByClassName("active")) {
                act.classList.remove("active");
            }
            const targetCell = this.getCellElement(ev.player);
            targetCell.classList.add("active");

            // update camera
            this.worldElem.style.left = "calc(50vw - " + (targetCell.offsetLeft + 63) + "px";
            this.worldElem.style.top = "calc(50vh - " + (targetCell.offsetTop + 107) + "px";
        });
        this.events.addEventListener(PlayerEvents.Hurt, ev => {
            this.healthElem.textContent = ev.player.health;
            this.body.classList.add("hurt");
            setTimeout(() => document.body.classList.remove("hurt"), 10);
            
            if (ev.player.health <= 0){
                // TODO: use state changed event
                this.body.classList.add("dead");
                this.promptElem.textContent = ":(";
            }
        });
        this.events.addEventListener(PlayerEvents.GainedXp, ev => {
            this.xpElem.textContent = ev.player.xp;
            this.levelElem.textContent = ev.player.level;
            
            if (ev.player.xp >= ev.player.maxXp) {
                // TODO: use state changed event
                this.body.classList.add("won");
                this.promptElem.textContent = ":)";
            }
        });

        this.events.addEventListener(CellEvents.Shown, ev => {
            this.getCellElement(ev.cell).classList.add("visible");
        });
        this.events.addEventListener(CellEvents.Damaged, ev => {
            const elem = this.getCellElement(ev.cell);
            if (ev.cell.health > 0) {
                elem.classList.add("inCombat");
                // 30% to 80% visible
                let dmg = ev.cell.health / ev.cell.enemy * 50 + 30
                elem.querySelector(".hex").style = `background: -webkit-linear-gradient(#333 0%, #333 ${dmg}%, #555 ${dmg}%, #555);`
            } else {
                elem.classList.remove("inCombat");
                elem.querySelector(".hex").style = "";
            }
        });

        this.events.addEventListener(MapEvents.Created, ev => {
            for (let cell of ev.map.cells) {
                this.drawCell(cell);
            }
        });
        this.events.addEventListener(MapEvents.WordTargetsUpdated, ev => {
            this.labelsContainer.innerHTML = "";
            for (let target of Object.values(ev.map.wordTargets)) {
                this.drawOffsetLabel(target);
            }
        });
    }
    
    getCellElement(pos) {
        return this.cellsContainer.querySelector(`.cell-${pos.x}-${pos.y}`);
    }

    drawCell(cell) {
        const {x, y} = cell;

        const container = document.createElement("div");
        container.style.left = x * 100 + (y % 2) * 50 + "px";
        container.style.top = y * 91 + "px";
        container.className = `cell cell-${x}-${y}`;
        if (cell.visible)
            container.classList.add("visible");

        const hex = document.createElement("div");
        hex.innerHTML = "&#x2B22;";
        hex.className = "hex";
        container.appendChild(hex);

        if (cell.heat) {
            const heat = document.createElement("div");
            heat.textContent = cell.heat;
            heat.className = "annotation heat";
            container.appendChild(heat);
        }

        if (cell.enemy) {
            const enemy = document.createElement("div");
            enemy.textContent = cell.enemy;
            enemy.className = "annotation enemy";
            container.appendChild(enemy);
        }

        this.cellsContainer.appendChild(container);
    }

    drawOffsetLabel(target) {
        const { x, y, offset, word, cell } = target;
        
        if (!word)
            return;

        const div = document.createElement("div");

        let left = x * 100 + (y % 2) * 50 + 63;
        if (offset < 3) {
            left += 10;
            if (offset === 1)
                left += 50;
            div.style.left = left + "px";
        } else {
            left -= 10;
            if (offset === 4)
                left -= 50;
            div.style.right = `calc(100% - ${left}px)`;
        }

        let yPos = offset > 2 ? 5 - offset : offset;
        let top = (y + yPos) * 91;
        div.style.top = top + "px";

        div.textContent = word;
        div.className = "label";
        if (offset > 2)
            div.classList.add("left");
        if (cell.inCombat)
            div.classList.add("inCombat");
        
        this.labelsContainer.appendChild(div);
    }
}