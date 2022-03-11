import { GameObject } from "./gameObject.js";

export class Player extends GameObject {
    x;
    y;
    level;
    health;
    xp;
    maxXp; // TODO: move to Game (or Map)
    alive; // TODO: move to Game
    won; // TODO: move to Game

    constructor(game, opts) {
        super(game);
        
        // TODO: explicit arguments
        Object.assign(this, opts);
    }
    
    move(x, y){
        this.x = x;
        this.y = y;
        this.events.dispatchEvent(new PlayerEvent(PlayerEvents.Moved, this));
    }

    damagePlayer(amount) {
        const player = this;
        
        if (player.health <= 0)
            return;
        
        player.health -= amount;

        if (player.health <= 0) {
            // TODO: move to Game
            player.alive = false;
        }
        
        this.events.dispatchEvent(new PlayerEvent(PlayerEvents.Hurt, this));
    }

    addPlayerXp(amount) {
        const player = this;
        player.xp += amount;
        player.level = (player.xp / 10 >> 0) + 1;
        
        if (player.xp >= this.maxXp) {
            // TODO: move to Game
            player.won = true;
        }
        
        this.game.events.dispatchEvent(new PlayerEvent(PlayerEvents.GainedXp, this));
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