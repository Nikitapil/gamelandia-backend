import { Action, TCardAbilitiesNames } from '../../domain/constants';

function canResolveWithoutChoice(action: Action): boolean {
  switch (action.name) {
    case TCardAbilitiesNames.PLUS_ATTACK:
    case TCardAbilitiesNames.PLUS_MONEY:
    case TCardAbilitiesNames.PLUS_AUTHORITY:
    case TCardAbilitiesNames.GET_CARDS:
    case TCardAbilitiesNames.DISCARD_OPPONENT_CARD:
    case TCardAbilitiesNames.PUT_NEXT_SHIP_ON_TOP:
    case TCardAbilitiesNames.ALL_FACTIONS_ALLY:
    case TCardAbilitiesNames.DRAW_PER_FACTION_CARD:
      return true;
    case TCardAbilitiesNames.SEQUENCE:
    case TCardAbilitiesNames.IF_BASES_IN_PLAY:
      return action.actions.every(canResolveWithoutChoice);
    default:
      return false;
  }
}

export type AbilityKind = 'primary' | 'ally' | 'scrap';

export interface AbilityParams {
  id: string;
  kind: AbilityKind;
  action: Action;
  isUsed?: boolean;
}

export class Ability {
  readonly id: string;
  readonly kind: AbilityKind;
  readonly action: Action;
  isUsed: boolean;

  constructor(params: AbilityParams) {
    this.id = params.id;
    this.kind = params.kind;
    this.action = params.action;
    this.isUsed = params.isUsed ?? false;
  }

  get isAutomaticAlly() {
    return this.kind === 'ally' && canResolveWithoutChoice(this.action);
  }

  markAsUsed() {
    if (this.isUsed) {
      throw new Error(`Ability ${this.id} has already been used`);
    }

    this.isUsed = true;
  }

  reset() {
    this.isUsed = false;
  }
}
