export class Player {
    game;
    x;
    y;
    level;
    health;
    xp;
    maxXp;
    alive;
    won;

    constructor(opts) {
        Object.assign(this, opts);

        this.damagePlayer(0);
        this.addPlayerXp(0);
    }

    damagePlayer(amount) {
        const player = this;
        player.health -= amount;
        this.game.ui.healthElem.textContent = player.health;
        if (amount <= 0)
            return;

        document.body.classList.add("hurt");
        setTimeout(() => document.body.classList.remove("hurt"), 10);

        if (player.health <= 0) {
            player.alive = false;
            document.body.classList.add("dead");
            this.game.ui.promptElem.textContent = ":(";
        }
    }

    addPlayerXp(amount) {
        const player = this;
        player.xp += amount;
        this.game.ui.xpElem.textContent = player.xp;
        player.level = (player.xp / 10 >> 0) + 1;
        this.game.ui.levelElem.textContent = player.level;
        if (player.xp >= this.maxXp) {
            player.won = true;
            document.body.classList.add("won");
            this.game.ui.promptElem.textContent = ":)";
        }
    }
}