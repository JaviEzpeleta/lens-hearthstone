# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lens Hearthstone is a Next.js web application that displays collectible cards in a Hearthstone-inspired style. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Commands

```bash
npm run dev           # Start development server
npm run build         # Production build
npm start             # Start production server
npm run lint          # Run ESLint
npm run bundle-cards  # Bundle all cards into single JSON
```

## Architecture

### Data Model

Cards are stored as individual JSON files in `/public/cards/` (numbered 0.json to 32.json) and bundled into `/public/all-cards.json` for production. Each card has:
- `cardType`: MINION, SPELL, or WEAPON
- `rarity`: COMMON, RARE, EPIC, or LEGENDARY
- `manaCost`, `attack`, `health`, `durability` (type-dependent)
- `abilityText`, `flavorText`, `keywords[]`
- `spellEffect`, `weaponEffect`, `minionEffect` for special abilities
- `generatedImageUrl` pointing to external CDN

### Pages

- `/` (app/page.tsx) - Landing page with auto-rotating card carousel, rarity-based effects
- `/the-cards` (app/the-cards/page.tsx) - Responsive grid displaying all cards
- `/play` (app/play/page.tsx) - Single-player game vs AI
- `/play/multiplayer` (app/play/multiplayer/page.tsx) - Multiplayer lobby and real-time PvP
- `/manual/battlecry` (app/manual/battlecry/page.tsx) - Educational page about Battlecry mechanic
- `/og` (app/og/page.tsx) - Open Graph image generation
- `/api/cards` (app/api/cards/route.ts) - API returning shuffled card list

### Key Patterns

**Card Loading**: Production uses `/public/all-cards.json` (pre-bundled via `npm run bundle-cards`) to avoid bot protection issues on Vercel. The bundle script (`scripts/bundle-cards.js`) combines all individual card JSON files. Development can use server-side filesystem reads or the bundled file.

**Rarity Styling**: Cards have rarity-based border colors and glow effects applied via utility functions in the collection page (`getRarityBorderColor`, `getRarityShadow`).

**Theme System**: Forced dark mode via next-themes. Custom CSS variables in `globals.css` define colors (gold, mana blue, health red, attack orange) and medieval fonts (Cinzel, MedievalSharp).

### Adding New Cards

Create a new JSON file in `public/cards/{id}.json` following the existing card schema. The collection page automatically discovers and displays all cards in that directory.

---

## Game Engine (`/play`)

Mobile-only card game with AI opponent. Portrait orientation, touch-first.

### File Structure

```
lib/game/
├── types.ts          # GameState, Card, MinionInstance, Effect types
├── constants.ts      # MAX_MANA=10, MAX_BOARD=7, STARTING_HEALTH=30
├── reducer.ts        # Game state reducer (all action handling)
├── context.tsx       # React context + AI turn loop
├── utils.ts          # Targeting, deck shuffling, queries
├── turn.ts           # Turn start/end helpers
├── play-card.ts      # Card play validation
├── combat.ts         # Attack resolution, damage calculation
├── keywords.ts       # Keyword effects (Taunt, Rush, etc.)
├── effects.ts        # Effect executor (BUFF, DAMAGE, SUMMON, etc.)
├── ai.ts             # Greedy AI decision engine
├── sounds.ts         # Web Audio synthesized sounds
└── index.ts          # Public exports

components/game/
├── GameBoard.tsx     # Main game layout + touch handlers
├── OpponentArea.tsx  # Enemy hero + board
├── PlayerArea.tsx    # Player hero + board + hand + controls
├── BoardSlots.tsx    # Battlefield minion grid
├── MinionCard.tsx    # Minion on board (stats, keywords)
├── HandCard.tsx      # Card in hand
├── PlayerHand.tsx    # Scrollable hand container
├── HeroPortrait.tsx  # Hero health/weapon display
├── ManaDisplay.tsx   # Mana crystals
├── TargetingOverlay.tsx
├── GameOverModal.tsx
├── DamageNumber.tsx  # Floating damage text
├── Toast.tsx         # Notifications
├── LoadingScreen.tsx
├── CardDetailsModal.tsx  # Card inspection modal
├── DifficultySelector.tsx # AI difficulty selection
├── TutorialModal.tsx     # Interactive tutorial (8 topics)
└── HelpButton.tsx        # Tutorial help button

hooks/
├── useOrientationLock.ts   # Force portrait mode
├── useHaptics.ts           # Vibration feedback
├── useLongPress.ts         # Long-press detection for mobile
├── useSounds.ts            # Sound effect playback
├── useTutorialToasts.ts    # Contextual tutorial tips during gameplay
├── useActiveAddress.ts     # Get active wallet address
├── useLensAuth.ts          # Lens Protocol authentication
├── useLobbyPresence.ts     # WebSocket connection to multiplayer lobby
└── useMultiplayerGame.ts   # Multiplayer game state management
```

### Game State Flow

1. **START_GAME** - Shuffle decks, draw starting hands (3 player, 4 opponent)
2. **START_TURN** - Draw card, gain mana (max 10), reset minion attacks
3. **PLAY_CARD** - Spend mana, place minion/equip weapon/cast spell
4. **ATTACK** - Minion combat with Divine Shield/Lifesteal/Taunt handling
5. **CHECK_DEATHS** - Remove dead minions, check win condition
6. **END_TURN** - Switch to opponent, AI takes over

### Keywords

| Keyword | Effect |
|---------|--------|
| Taunt | Enemies must attack this minion first |
| Rush | Can attack minions (not hero) on play turn |
| Divine Shield | Ignore first damage instance |
| Lifesteal | Heal hero for damage dealt |
| Windfury | Can attack twice per turn |
| Battlecry | Effect triggers when played from hand |

### Effect System

Effects are defined in card JSON (`spellEffect`, `minionEffect.effects[]`):

```typescript
interface Effect {
  effectType: 'BUFF' | 'DAMAGE' | 'HEAL' | 'DRAW' | 'SUMMON' | 'DESTROY';
  target: 'ALL_FRIENDLY_MINIONS' | 'ENEMY_MINION' | 'RANDOM_ENEMY_CHARACTER' | ...;
  value?: number;           // Damage/heal amount or attack buff
  secondaryValue?: number;  // Health buff for BUFF type
  summonCount/Attack/Health?: number;  // For SUMMON type
}
```

Effects are executed in `lib/game/effects.ts` via `executeEffect()`.

### AI Logic (`lib/game/ai.ts`)

Greedy decision-making with difficulty levels:
1. Evaluate all playable cards (prioritize high-cost, good stats, keywords)
2. Evaluate all possible attacks (prioritize lethal, favorable trades)
3. Pick highest priority action, repeat until no good moves
4. End turn

### AI Difficulty System

Three difficulty levels affect AI decision-making:

| Level | Behavior |
|-------|----------|
| `EASY` | Slower thinking, sometimes picks suboptimal moves |
| `MEDIUM` | Balanced gameplay, standard evaluation |
| `HARD` | Faster thinking, prioritizes lethal, efficient trades |

Difficulty is passed to `START_GAME` action and affects:
- Think/action delays (faster at higher difficulties)
- Move evaluation (HARD checks for combined lethal)
- Suboptimal move chance (EASY sometimes misplays)

### Key Components

**GameBoard.tsx** - Central orchestrator:
- Handles all touch interactions (card select, minion select, targeting)
- Determines valid targets based on selection state
- Dispatches actions to reducer

**context.tsx** - Contains AI turn loop:
- useEffect watches for `turn === 'opponent'`
- Runs `getBestDecision()` in loop with delays
- Auto-ends turn when no moves remain

### Animations

CSS animations in `globals.css`:
- `animate-bounce-up-fade` - Damage numbers
- `animate-card-play` - Card leaving hand
- `animate-attack-lunge` - Attack motion
- `animate-damage-shake` - Hit reaction
- `animate-death-fade` - Minion death
- `animate-summon-pop` - Minion spawn
- `animate-sparkle-drift` - Sparkle particles on homepage carousel

**Motion Library**: Complex animations use `motion` (framer-motion) for physics-based effects:
- `GameOverModal.tsx` - Victory/defeat with confetti particles, bouncing elements
- Smooth transitions, spring physics, staggered animations

### Sound System

Web Audio API synthesized sounds via `lib/game/sounds.ts`. 16 sound types:

| Sound | Trigger |
|-------|---------|
| `card_play` | Card played from hand |
| `attack` | Minion/hero attacks |
| `damage` | Character takes damage |
| `heal` | Health restored |
| `death` | Minion dies |
| `buff` | Stats increased |
| `summon` | Token created |
| `draw` | Card drawn |
| `turn_start` | Turn begins |
| `victory` | Player wins |
| `defeat` | Player loses |
| `select` | Card/minion selected |
| `error` | Invalid action |
| `weapon_equip` | Weapon equipped |
| `divine_shield_break` | Shield consumed |
| `battlecry` | Battlecry triggers |

Usage: `playSound('attack')` or via `useSounds()` hook.

### Card Inspection

Long-press (500ms) or right-click to view card details:
- `useLongPress.ts` hook detects hold gesture
- `CardDetailsModal.tsx` displays full card info
- Shows keywords, stats, ability text, flavor text
- Works on both hand cards and board minions

### Tutorial System

Interactive onboarding for new players:
- `TutorialModal.tsx` - 8 topic tabs: Goal, Mana, Minions, Spells, Weapons, Attacking, Keywords, End Turn
- `HelpButton.tsx` - Help button (?) in game UI
- `useTutorialToasts.ts` - Contextual tips triggered by game events

Tutorial tips appear for: first minion played, Rush/Taunt mechanics, spells, weapons, attacks, deaths, mana gain, Divine Shield, Lifesteal, Windfury, Battlecry.

GameState includes `tutorialMode` boolean, toggled via `TOGGLE_TUTORIAL` action.

---

## Multiplayer System (`/play/multiplayer`)

Real-time PvP gameplay using PartyKit WebSocket servers and Lens Protocol authentication.

### File Structure

```
party/
├── lobby.ts          # PartyKit server - online presence, challenges
└── game.ts           # PartyKit server - real-time game state sync

components/lobby/
├── LobbyContainer.tsx       # Main lobby UI container
├── OnlineUsersList.tsx      # List of online players
├── OnlineUserCard.tsx       # Individual player card
├── UserStatusBadge.tsx      # Status indicator (Online/Busy/InGame)
├── ChallengeNotification.tsx    # Incoming challenge popup
├── ChallengePendingModal.tsx    # Waiting for challenge response
└── index.ts

hooks/
├── useLobbyPresence.ts      # WebSocket connection to lobby
└── useMultiplayerGame.ts    # Game state for multiplayer matches
```

### Multiplayer Flow

1. **Connect Wallet** - User connects MetaMask or similar
2. **Lens Authentication** - Sign message to authenticate, select Lens account
3. **Enter Lobby** - WebSocket connection established, appear online
4. **Challenge/Accept** - Send or receive challenges from online players
5. **Game Room** - Both players join room, game state synced in real-time
6. **Play** - Same game rules as AI, but opponent is human

### PartyKit Servers

**Lobby Server** (`party/lobby.ts`):
- Tracks online users with Lens profile data
- Broadcasts presence updates (join/leave/status change)
- Handles challenge requests and responses
- Manages user status: `ONLINE`, `BUSY`, `IN_GAME`

**Game Server** (`party/game.ts`):
- Syncs game state between two players
- Validates moves server-side
- Handles disconnections and reconnections

### User Status

| Status | Description |
|--------|-------------|
| `ONLINE` | Available for challenges |
| `BUSY` | Has pending challenge (sent or received) |
| `IN_GAME` | Currently playing a match |

---

## Lens Protocol Authentication

Web3 authentication using Lens Protocol for player identity.

### File Structure

```
lib/lens/
└── client.ts         # Lens SDK client configuration

hooks/
├── useLensAuth.ts       # Main authentication hook
└── useActiveAddress.ts  # Get connected wallet address

components/
└── LoginOptions.tsx     # Account selection modal
```

### Authentication Flow

1. **Connect Wallet** - User connects via wagmi/viem
2. **Fetch Accounts** - Query Lens for accounts linked to wallet address
3. **Select Account** - User picks from Owner or Manager accounts
4. **Sign Message** - Lens authentication challenge signed by wallet
5. **Store Session** - Auth tokens stored, profile data available

### Account Types

- **Owner** - Full control accounts owned by the wallet
- **Manager** - Accounts where wallet has manager permissions

### Profile Data

After authentication, Lens provides:
- `username` - Lens handle (e.g., `@alice`)
- `profilePicture` - Avatar image URL
- `address` - Wallet address

