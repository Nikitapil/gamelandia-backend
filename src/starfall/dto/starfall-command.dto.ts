import {
  IsIn,
  IsInt,
  IsObject,
  IsString,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const STARFALL_COMMANDS = [
  'play_card',
  'buy_card',
  'use_ability',
  'resolve_pending',
  'cancel_pending',
  'attack_base',
  'attack_player',
  'end_turn'
] as const;

export type StarfallCommandType = (typeof STARFALL_COMMANDS)[number];

export interface CardIdPayload {
  cardId: string;
}

export interface UseAbilityPayload extends CardIdPayload {
  abilityId: string;
}

export interface ResolvePendingPayload {
  cardId?: string;
  cardIds?: string[];
  optionIndex?: number;
  cancel?: boolean;
}

export interface AttackPlayerPayload {
  amount: number;
}

export type EmptyCommandPayload = Record<string, never>;

export interface StarfallCommandPayloadByType {
  play_card: CardIdPayload;
  buy_card: CardIdPayload;
  use_ability: UseAbilityPayload;
  resolve_pending: ResolvePendingPayload;
  cancel_pending: EmptyCommandPayload;
  attack_base: CardIdPayload;
  attack_player: AttackPlayerPayload;
  end_turn: EmptyCommandPayload;
}

export type StarfallCommandPayload<
  T extends StarfallCommandType = StarfallCommandType
> = StarfallCommandPayloadByType[T];

@ValidatorConstraint({ name: 'isStarfallCommandPayload', async: false })
class StarfallCommandPayloadConstraint implements ValidatorConstraintInterface {
  validate(payload: unknown, args: ValidationArguments) {
    if (!this.isObject(payload)) return false;

    const type = (args.object as { type?: unknown }).type;
    switch (type) {
      case 'play_card':
      case 'buy_card':
      case 'attack_base':
        return (
          this.hasOnlyKeys(payload, ['cardId']) &&
          this.isNonEmptyString(payload.cardId)
        );
      case 'use_ability':
        return (
          this.hasOnlyKeys(payload, ['cardId', 'abilityId']) &&
          this.isNonEmptyString(payload.cardId) &&
          this.isNonEmptyString(payload.abilityId)
        );
      case 'resolve_pending':
        return (
          this.hasOnlyKeys(payload, [
            'cardId',
            'cardIds',
            'optionIndex',
            'cancel'
          ]) &&
          (payload.cardId === undefined ||
            this.isNonEmptyString(payload.cardId)) &&
          (payload.cardIds === undefined ||
            (Array.isArray(payload.cardIds) &&
              payload.cardIds.every((id) => this.isNonEmptyString(id)))) &&
          (payload.optionIndex === undefined ||
            (Number.isInteger(payload.optionIndex) &&
              (payload.optionIndex as number) >= 0)) &&
          (payload.cancel === undefined || typeof payload.cancel === 'boolean')
        );
      case 'attack_player':
        return (
          this.hasOnlyKeys(payload, ['amount']) &&
          Number.isInteger(payload.amount) &&
          (payload.amount as number) > 0
        );
      case 'cancel_pending':
      case 'end_turn':
        return this.hasOnlyKeys(payload, []);
      default:
        return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const type = (args.object as { type?: unknown }).type;
    return `payload is invalid for Starfall command type ${String(type)}`;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private hasOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]) {
    return Object.keys(value).every((key) => allowedKeys.includes(key));
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
  }
}

export class StarfallCommandDto<
  T extends StarfallCommandType = StarfallCommandType
> {
  @ApiProperty({
    type: String,
    description: 'Unique idempotency key',
    example: 'uuid'
  })
  @IsString()
  commandId: string;

  @ApiProperty({
    type: Number,
    minimum: 0,
    description: 'Expected game state version'
  })
  @IsInt()
  @Min(0)
  expectedVersion: number;

  @ApiProperty({ type: String, enum: STARFALL_COMMANDS })
  @IsIn(STARFALL_COMMANDS)
  type: T;

  @ApiProperty({ type: Object, description: 'Payload matching command type' })
  @IsObject()
  @Validate(StarfallCommandPayloadConstraint)
  payload: StarfallCommandPayload<T> = {} as StarfallCommandPayload<T>;
}

export type TypedStarfallCommandDto = {
  [T in StarfallCommandType]: StarfallCommandDto<T>;
}[StarfallCommandType];
