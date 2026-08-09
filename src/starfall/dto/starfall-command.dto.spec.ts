import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { StarfallCommandDto } from './starfall-command.dto';

const dto = (type: string, payload?: unknown) =>
  plainToInstance(StarfallCommandDto, {
    commandId: 'command-id',
    expectedVersion: 0,
    type,
    ...(payload === undefined ? {} : { payload })
  });

describe('StarfallCommandDto', () => {
  it.each([
    ['play_card', { cardId: 'card-id' }],
    ['buy_card', { cardId: 'card-id' }],
    ['use_ability', { cardId: 'card-id', abilityId: 'ability-id' }],
    ['resolve_pending', { cardIds: ['first', 'second'] }],
    ['resolve_pending', { optionIndex: 0 }],
    ['resolve_pending', { cancel: true }],
    ['cancel_pending', {}],
    ['attack_base', { cardId: 'card-id' }],
    ['attack_player', { amount: 3 }],
    ['end_turn', {}]
  ])('accepts %s payload', (type, payload) => {
    expect(validateSync(dto(type, payload))).toHaveLength(0);
  });

  it.each([
    ['play_card', {}],
    ['use_ability', { cardId: 'card-id' }],
    ['resolve_pending', { cardIds: [1] }],
    ['resolve_pending', { optionIndex: -1 }],
    ['cancel_pending', { cardId: 'unexpected' }],
    ['attack_player', { amount: 0 }],
    ['attack_player', { amount: 1.5 }],
    ['end_turn', { unexpected: true }]
  ])('rejects invalid %s payload', (type, payload) => {
    expect(validateSync(dto(type, payload))).not.toHaveLength(0);
  });
});
