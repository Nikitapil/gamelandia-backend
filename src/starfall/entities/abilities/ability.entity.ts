import { Action } from '../../domain/constants';

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
