import { Card, TCardAbilitiesNames } from '../domain/constants';
import { Ability } from './abilities/ability.entity';
import { GameEntity } from './game.entity';

interface CardEntityParams {
  card: Card;
  isPlayed: boolean;
  id: string;
  usedAbilities: TCardAbilitiesNames[];
}

export class CardEntity {
  card: Card;
  isPlayed: boolean;
  id: string;
  usedAbilities: TCardAbilitiesNames[];
  abilities: Ability[];
  matchedAbilities: Ability[];
  removeAbility: Ability | null = null;

  constructor(params: CardEntityParams) {
    this.card = params.card;
    this.isPlayed = params.isPlayed;
    this.id = params.id;
    this.usedAbilities = params.usedAbilities;

    this.abilities = this.card.abilities.map(
      (ability) =>
        new Ability({
          isUsed: this.usedAbilities.some((ab) => ab === ability.name),
          action: ability
        })
    );
    this.matchedAbilities = this.card.matchAbilities.map(
      (ability) =>
        new Ability({
          isUsed: this.usedAbilities.some((ab) => ab === ability.name),
          action: ability
        })
    );

    if (this.card.removeAbility) {
      this.removeAbility = new Ability({
        isUsed: this.usedAbilities.some(
          (ab) => ab === this.card.removeAbility?.name
        ),
        action: this.card.removeAbility
      });
    }
  }

  useAbility(name: TCardAbilitiesNames, game: GameEntity) {
    const ability = this.abilities.find(
      (ability) => ability.action.name === name
    );

    if (!ability) {
      throw new Error('Unable to use ability');
    }

    ability.run(game);
    this.usedAbilities.push(name);
  }

  useMatchAbility() {}

  useDestroyAbility() {}

  play() {
    this.isPlayed = true;
  }

  resetPlay() {
    this.isPlayed = false;
  }
}
