import { Card, FractionType } from '../domain/constants';
import { CardZone } from '../domain/dbTypes';
import { Ability } from './abilities/ability.entity';

interface CardEntityParams {
  card: Card;
  id: string;
  isPlayed?: boolean;
  playedThisTurn?: boolean;
  usedAbilities?: string[];
  currentDefense?: number | null;
  copiedCardId?: string | null;
  zone?: CardZone | null;
}

export class CardEntity {
  readonly card: Card;
  readonly id: string;
  isPlayed: boolean;
  playedThisTurn: boolean;
  currentDefense: number | null;
  copiedCardId: string | null;
  zone: CardZone | null;
  abilities: Ability[];
  matchedAbilities: Ability[];
  removeAbility: Ability | null;
  copiedMatchedAbilities: Ability[] = [];
  copiedRemoveAbility: Ability | null = null;
  private readonly restoredUsedAbilityIds: Set<string>;

  constructor(params: CardEntityParams) {
    this.restoredUsedAbilityIds = new Set(params.usedAbilities ?? []);
    this.card = params.card;
    this.id = params.id;
    this.isPlayed = params.isPlayed ?? false;
    this.playedThisTurn = params.playedThisTurn ?? false;
    this.currentDefense =
      params.currentDefense ??
      (params.card.type === 'base' ? params.card.health ?? 0 : null);
    this.copiedCardId = params.copiedCardId ?? null;
    this.zone = params.zone ?? null;
    this.abilities = params.card.abilities.map(
      (action, index) =>
        new Ability({
          id: `primary:${index}`,
          kind: 'primary',
          action,
          isUsed: this.restoredUsedAbilityIds.has(`primary:${index}`)
        })
    );
    this.matchedAbilities = params.card.matchAbilities.map(
      (action, index) =>
        new Ability({
          id: `ally:${index}`,
          kind: 'ally',
          action,
          isUsed: this.restoredUsedAbilityIds.has(`ally:${index}`)
        })
    );
    this.removeAbility = params.card.removeAbility
      ? new Ability({
          id: 'scrap:0',
          kind: 'scrap',
          action: params.card.removeAbility,
          isUsed: this.restoredUsedAbilityIds.has('scrap:0')
        })
      : null;
  }

  get usedAbilities() {
    return this.allAbilities
      .filter((ability) => ability.isUsed)
      .map((ability) => ability.id);
  }

  get allAbilities() {
    return [
      ...this.abilities,
      ...this.matchedAbilities,
      ...(this.removeAbility ? [this.removeAbility] : []),
      ...this.copiedMatchedAbilities,
      ...(this.copiedRemoveAbility ? [this.copiedRemoveAbility] : [])
    ];
  }

  getAbility(id: string) {
    return this.allAbilities.find((ability) => ability.id === id);
  }

  requireAbility(id: string) {
    const ability = this.getAbility(id);
    if (!ability) {
      throw new Error(`Ability ${id} does not exist on card ${this.id}`);
    }
    return ability;
  }

  play() {
    if (this.isPlayed) {
      throw new Error(`Card ${this.id} is already in play`);
    }
    this.isPlayed = true;
    this.playedThisTurn = true;
    if (this.card.type === 'base') {
      this.currentDefense = this.card.health ?? 0;
    }
  }

  leavePlay() {
    this.isPlayed = false;
    this.playedThisTurn = false;
    this.currentDefense =
      this.card.type === 'base' ? this.card.health ?? 0 : null;
    this.copiedCardId = null;
    this.copiedMatchedAbilities = [];
    this.copiedRemoveAbility = null;
    this.resetAbilities();
  }

  resetForTurn() {
    this.playedThisTurn = false;
    this.resetAbilities();
  }

  resetAbilities() {
    this.allAbilities.forEach((ability) => ability.reset());
  }

  applyCopy(copied: CardEntity) {
    this.copiedCardId = copied.id;
    this.copiedMatchedAbilities = copied.card.matchAbilities.map(
      (action, index) =>
        new Ability({
          id: `copied:ally:${index}`,
          kind: 'ally',
          action,
          isUsed: this.restoredUsedAbilityIds.has(`copied:ally:${index}`)
        })
    );
    this.copiedRemoveAbility = copied.card.removeAbility
      ? new Ability({
          id: 'copied:scrap:0',
          kind: 'scrap',
          action: copied.card.removeAbility,
          isUsed: this.restoredUsedAbilityIds.has('copied:scrap:0')
        })
      : null;
  }

  hasFraction(
    fraction: Exclude<FractionType, 'none'>,
    copiedCard?: CardEntity
  ) {
    return (
      this.card.fraction === fraction ||
      this.card.name === 'Mech World' ||
      copiedCard?.card.fraction === fraction
    );
  }

  canUseAbility(id: string) {
    const ability = this.requireAbility(id);
    return !ability.isUsed && this.isPlayed;
  }
}
