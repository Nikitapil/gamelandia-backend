import { GameEntity } from '../game.entity';
import { Action, TCardAbilitiesNames } from '../../domain/constants';

export interface AbilityParams {
  isUsed: boolean;
  game: GameEntity;
  action: Action;
}

export class Ability {
  isUsed: boolean;
  game: GameEntity;
  action: Action;

  constructor(params: AbilityParams) {
    this.game = params.game;
    this.isUsed = params.isUsed;
    this.action = params.action;
  }

  run() {
    switch (this.action.name) {
      case TCardAbilitiesNames.SCRAP_CARD_FROM_PILE:
        // TODO implement
        break;
      case TCardAbilitiesNames.SCRAP_CARD_FROM_HAND:
        // TODO implement
        break;
      case TCardAbilitiesNames.PLUS_ATTACK:
        this.game.currentPlayer.addAttack(this.action.value ?? 0);
        break;
      case TCardAbilitiesNames.DISCARD_OPPONENT_CARD:
        if (this.game.defencePlayer) {
          this.game.defencePlayer.discardCardsCount++;
        }
        break;
      case TCardAbilitiesNames.GET_CARDS:
        this.game.currentPlayer.getCardsFromDeck(this.action.value ?? 0);
        break;
    }
  }
}
