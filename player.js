import { GameObject } from "./gameObject.js";

export class Player extends GameObject {
    x;
    y;
    level;
    health;
    xp;

    constructor(game) {
        super(game);

        this.x = 0;
        this.y = 0;
        this.level = 1;
        this.health = 10;
        this.xp = 0;
    }
    
    move(x, y) {
        this.x = x;
        this.y = y;
        this.events.dispatchEvent(new PlayerEvent(PlayerEvents.Moved, this));
    }

    damagePlayer(amount) {
        if(this.health <= 0)
            return;
        this.health -= amount;
        this.events.dispatchEvent(new PlayerEvent(PlayerEvents.Hurt, this));
    }

    addPlayerXp(amount) {
        this.xp += amount;
        this.level = (this.xp / 10 >> 0) + 1;
        this.events.dispatchEvent(new PlayerEvent(PlayerEvents.GainedXp, this));
    }
}

export const PlayerEvents = {
    Moved: "player.moved",
    Hurt: "player.hurt",
    GainedXp: "player.gainedXp"
}

export class PlayerEvent extends Event {
    player;
    constructor(type, player) {
        super(type);
        this.player = player;
    }
}