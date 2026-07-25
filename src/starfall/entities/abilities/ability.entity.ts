import { GameEntity } from '../game.entity';
import { Action, TCardAbilitiesNames } from '../../domain/constants';

export interface AbilityParams {
  isUsed: boolean;
  action: Action;
}

export class Ability {
  isUsed: boolean;
  action: Action;

  constructor(params: AbilityParams) {
    this.isUsed = params.isUsed;
    this.action = params.action;
  }

  run(game: GameEntity) {
    switch (this.action.name) {
      case TCardAbilitiesNames.SCRAP_CARD_FROM_PILE:
        // TODO implement
        break;
      case TCardAbilitiesNames.SCRAP_CARD_FROM_HAND:
        // TODO implement
        break;
      case TCardAbilitiesNames.PLUS_ATTACK:
        game.currentPlayer.addAttack(this.action.value ?? 0);
        break;
      case TCardAbilitiesNames.DISCARD_OPPONENT_CARD:
        if (game.defencePlayer) {
          game.defencePlayer.discardCardsCount++;
        }
        break;
      case TCardAbilitiesNames.GET_CARDS:
        game.currentPlayer.getCardsFromDeck(this.action.value ?? 0);
        break;
    }
  }
}
