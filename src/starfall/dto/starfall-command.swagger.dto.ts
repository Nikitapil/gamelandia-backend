import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CardIdPayloadDto {
  @ApiProperty({
    type: String,
    description: 'Card instance id',
    example: 'card-uuid'
  })
  cardId: string;
}

export class UseAbilityPayloadDto extends CardIdPayloadDto {
  @ApiProperty({
    type: String,
    description: 'Ability instance id',
    example: 'ally:0'
  })
  abilityId: string;
}

export class ResolvePendingPayloadDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Selected card instance id'
  })
  cardId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Selected card ids' })
  cardIds?: string[];

  @ApiPropertyOptional({
    type: Number,
    minimum: 0,
    description: 'Selected option index'
  })
  optionIndex?: number;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Cancel an optional pending action'
  })
  cancel?: boolean;
}

export class AttackPlayerPayloadDto {
  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'Combat points to spend'
  })
  amount: number;
}

export class EmptyCommandPayloadDto {}

abstract class StarfallCommandBaseDto {
  @ApiProperty({
    type: String,
    description: 'Unique idempotency key',
    example: 'uuid'
  })
  commandId: string;

  @ApiProperty({
    type: Number,
    minimum: 0,
    description: 'Expected game state version'
  })
  expectedVersion: number;
}

export class PlayCardCommandDto extends StarfallCommandBaseDto {
  @ApiProperty({ type: String, enum: ['play_card'] })
  type: 'play_card';

  @ApiProperty({ type: CardIdPayloadDto })
  payload: CardIdPayloadDto;
}

export class BuyCardCommandDto extends StarfallCommandBaseDto {
  @ApiProperty({ type: String, enum: ['buy_card'] })
  type: 'buy_card';

  @ApiProperty({ type: CardIdPayloadDto })
  payload: CardIdPayloadDto;
}

export class UseAbilityCommandDto extends StarfallCommandBaseDto {
  @ApiProperty({ type: String, enum: ['use_ability'] })
  type: 'use_ability';

  @ApiProperty({ type: UseAbilityPayloadDto })
  payload: UseAbilityPayloadDto;
}

export class ResolvePendingCommandDto extends StarfallCommandBaseDto {
  @ApiProperty({ type: String, enum: ['resolve_pending'] })
  type: 'resolve_pending';

  @ApiProperty({ type: ResolvePendingPayloadDto })
  payload: ResolvePendingPayloadDto;
}

export class CancelPendingCommandDto extends StarfallCommandBaseDto {
  @ApiProperty({ type: String, enum: ['cancel_pending'] })
  type: 'cancel_pending';

  @ApiProperty({ type: EmptyCommandPayloadDto })
  payload: EmptyCommandPayloadDto;
}

export class AttackBaseCommandDto extends StarfallCommandBaseDto {
  @ApiProperty({ type: String, enum: ['attack_base'] })
  type: 'attack_base';

  @ApiProperty({ type: CardIdPayloadDto })
  payload: CardIdPayloadDto;
}

export class AttackPlayerCommandDto extends StarfallCommandBaseDto {
  @ApiProperty({ type: String, enum: ['attack_player'] })
  type: 'attack_player';

  @ApiProperty({ type: AttackPlayerPayloadDto })
  payload: AttackPlayerPayloadDto;
}

export class EndTurnCommandDto extends StarfallCommandBaseDto {
  @ApiProperty({ type: String, enum: ['end_turn'] })
  type: 'end_turn';

  @ApiProperty({ type: EmptyCommandPayloadDto })
  payload: EmptyCommandPayloadDto;
}

export const STARFALL_COMMAND_SWAGGER_MODELS = [
  PlayCardCommandDto,
  BuyCardCommandDto,
  UseAbilityCommandDto,
  ResolvePendingCommandDto,
  CancelPendingCommandDto,
  AttackBaseCommandDto,
  AttackPlayerCommandDto,
  EndTurnCommandDto
] as const;
