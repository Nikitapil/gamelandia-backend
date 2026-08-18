import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CardDeckType,
  FractionType,
  TCardAbilitiesNames
} from '../domain/constants';
import { CardZone, GameStatus } from '../domain/dbTypes';

export class StarfallActionDto {
  @ApiProperty({ type: String, enum: TCardAbilitiesNames })
  name: TCardAbilitiesNames;

  @ApiPropertyOptional({ type: Number })
  value?: number;

  @ApiPropertyOptional({ type: Number })
  max?: number;

  @ApiPropertyOptional({ type: Number })
  min?: number;

  @ApiPropertyOptional({ type: Boolean })
  optional?: boolean;

  @ApiPropertyOptional({ type: Number })
  drawPerScrapped?: number;

  @ApiPropertyOptional({
    type: String,
    enum: ['blobs', 'trades', 'empire', 'techno']
  })
  fraction?: string;

  @ApiPropertyOptional({ type: () => [StarfallActionDto] })
  actions?: StarfallActionDto[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'array',
      items: { $ref: '#/components/schemas/StarfallActionDto' }
    }
  })
  options?: StarfallActionDto[][];
}

export class StarfallPersistentAbilityDto {
  @ApiProperty({ type: String, enum: ['ship_played'] })
  trigger: 'ship_played';

  @ApiProperty({ type: StarfallActionDto })
  action: StarfallActionDto;
}

export class StarfallCardViewDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, enum: ['trade', 'explorer', 'starter'] })
  deck: CardDeckType;

  @ApiProperty({
    type: String,
    enum: ['blobs', 'trades', 'empire', 'techno', 'none']
  })
  fraction: FractionType;

  @ApiProperty({ type: String, enum: ['ship', 'base'] })
  type: 'ship' | 'base';

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  count: number;

  @ApiProperty({ type: Number })
  cost: number;

  @ApiProperty({ type: [StarfallActionDto] })
  abilities: StarfallActionDto[];

  @ApiProperty({ type: [StarfallActionDto] })
  matchAbilities: StarfallActionDto[];

  @ApiProperty({ type: StarfallActionDto, nullable: true })
  removeAbility: StarfallActionDto | null;

  @ApiProperty({ type: [StarfallPersistentAbilityDto] })
  persistentAbilities: StarfallPersistentAbilityDto[];

  @ApiProperty({ type: Number })
  money: number;

  @ApiProperty({ type: Number })
  attack: number;

  @ApiProperty({ type: String })
  picture: string;

  @ApiPropertyOptional({ type: Number })
  health?: number;

  @ApiProperty({ type: Boolean })
  outpost: boolean;

  @ApiProperty({ type: Number, nullable: true })
  currentDefense: number | null;

  @ApiProperty({ type: Boolean })
  playedThisTurn: boolean;

  @ApiProperty({ type: [String] })
  usedAbilities: string[];
}

export class StarfallPendingActionDto {
  @ApiProperty({
    type: String,
    enum: [
      'choose_cards_to_scrap',
      'choose_trade_card_to_scrap',
      'choose_base_to_destroy',
      'discard_then_draw',
      'choose_ship_to_copy',
      'choose_free_ship',
      'choose_effect',
      'discard_for_opponent'
    ]
  })
  type: string;

  @ApiProperty({ type: String })
  playerId: string;

  @ApiPropertyOptional({ type: String })
  sourceCardId?: string;

  @ApiPropertyOptional({ type: String })
  abilityId?: string;

  @ApiPropertyOptional({
    type: [String],
    enum: [
      'player-hand',
      'player-pile-deck',
      'player-deck',
      'player-bases',
      'currently-played',
      'trade-row',
      'unused-deck',
      'explorers',
      'starter-cards',
      'scrapped'
    ]
  })
  zones?: CardZone[];

  @ApiPropertyOptional({ type: Number })
  min?: number;

  @ApiPropertyOptional({ type: Number })
  max?: number;

  @ApiPropertyOptional({ type: Number })
  count?: number;

  @ApiPropertyOptional({ type: Number })
  drawPerScrapped?: number;

  @ApiPropertyOptional({ type: Boolean })
  optional?: boolean;

  @ApiPropertyOptional({ type: [StarfallActionDto] })
  continuation?: StarfallActionDto[];

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'array',
      items: { $ref: '#/components/schemas/StarfallActionDto' }
    }
  })
  options?: StarfallActionDto[][];
}

export class StarfallPlayerViewDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: Number })
  hp: number;

  @ApiProperty({ type: Number })
  money: number;

  @ApiProperty({ type: Number })
  attack: number;

  @ApiProperty({ type: Boolean })
  isWinner: boolean;

  @ApiPropertyOptional({ type: [StarfallCardViewDto] })
  hand?: StarfallCardViewDto[];

  @ApiProperty({ type: Number })
  handCount: number;

  @ApiProperty({ type: Number })
  deckCount: number;

  @ApiProperty({ type: [StarfallCardViewDto] })
  discard: StarfallCardViewDto[];

  @ApiProperty({ type: [StarfallCardViewDto] })
  bases: StarfallCardViewDto[];

  @ApiProperty({ type: [StarfallCardViewDto] })
  playedShips: StarfallCardViewDto[];
}

export class StarfallGameViewDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: Number })
  startingHp: number;

  @ApiProperty({
    type: String,
    enum: ['waiting', 'active', 'finished']
  })
  status: GameStatus;

  @ApiProperty({ type: String, nullable: true })
  currentPlayerId: string | null;

  @ApiProperty({ type: String, nullable: true })
  winnerId: string | null;

  @ApiProperty({ type: Number })
  turnNumber: number;

  @ApiProperty({ type: Number })
  version: number;

  @ApiProperty({ type: StarfallPendingActionDto, nullable: true })
  pendingAction: StarfallPendingActionDto | null;

  @ApiProperty({ type: [StarfallCardViewDto] })
  tradeRow: StarfallCardViewDto[];

  @ApiProperty({ type: Number })
  explorersCount: number;

  @ApiProperty({ type: Number })
  unusedTradeDeckCount: number;

  @ApiProperty({ type: [StarfallCardViewDto] })
  scrappedCards: StarfallCardViewDto[];

  @ApiProperty({ type: [StarfallPlayerViewDto] })
  players: StarfallPlayerViewDto[];
}
