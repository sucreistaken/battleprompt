export type Phase =
  | 'IDLE'
  | 'PLAYER_1_JOINED'
  | 'VS_INTRO'
  | 'PROMPTING'
  | 'GENERATING'
  | 'SCORING'
  | 'VOTING'
  | 'TIEBREAK_VOTE'
  | 'RESULT';

export type Slot = 'A' | 'B';

export type WinnerMode = 'AI_SCORE' | 'AUDIENCE_VOTE';

export interface PlayerSnapshot {
  nickname: string;
  submitted: boolean;
  forfeit: boolean;
  disconnected: boolean;
  imageUrl: string | null;
  prompt: string | null;
  aiScore: number | null;
}

export interface StateSnapshot {
  phase: Phase;
  phaseEndsAt: number | null;
  matchId: string | null;
  theme: string;
  winnerMode: WinnerMode;
  showLivePrompts: boolean;
  stageLanguage: 'tr' | 'en';
  referenceImageUrl: string | null;
  players: {
    A: PlayerSnapshot | null;
    B: PlayerSnapshot | null;
  };
  votes: { A: number; B: number } | null;
  winner: Slot | 'TIE' | null;
  aiReasoning: string | null;
  durations: {
    promptDurationSec: number;
    votingDurationSec: number;
    tiebreakDurationSec: number;
    resultDurationSec: number;
    vsIntroDurationSec: number;
  };
}

export type Role = 'player' | 'audience' | 'stage' | 'admin';
