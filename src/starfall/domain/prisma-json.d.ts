import { StarfallSnapshot } from './dbTypes';

export {};

declare global {
  namespace PrismaJson {
    type StarfallGameState = StarfallSnapshot;
  }
}
