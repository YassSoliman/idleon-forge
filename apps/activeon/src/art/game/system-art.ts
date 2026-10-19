// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// SYSTEM_ART: one representative game sprite per System (ADR 0009 as amended 2026-10-19), drawn
// wherever a System's icon shows (Systems grid and search, System page headers, Now and Timeline rows,
// Goals). Where IdleOn Toolbox's own navigation draws that page with a sprite, we use the same one
// (Toolbox components/constants.jsx at the pin), so players see the picture they already know.
// Paths are Toolbox paths ("data/<name>"); our own pixel sprite stays the fallback (SystemIcon).
// Systems that are ActiveOn ideas rather than game things (Meta Path, Spend Plan, Checklist,
// Parallel Slots, Roles) keep our own sprite: there is no game picture for them.
import type { GameArt } from './game-art';

const d = (name: string): GameArt => ({ path: `data/${name}` });
const e = (name: string): GameArt => ({ path: `etc/${name}` });

export const SYSTEM_ART: Readonly<Record<string, GameArt>> = {
  // World 0 (account-wide)
  afk: d('Afkz1'), // the AFK target board (Toolbox draws AFK targets from this family)
  classes: d('ClassIcons1'), // the Beginner class icon (Toolbox: "general")
  talents: d('TalentBook1'), // the gold talent book (Toolbox: wiki/talents)
  'talent-presets': d('TalentBook2'), // the second talent book, for the second preset
  'talent-resets': d('ResetCompleted'), // Talent Point Reset Potion
  'upgrade-vault': d('VaultBut'), // the Upgrade Vault's coin pile (Toolbox: upgradeVault)
  'gem-shop': d('PremiumGem'), // the gem (Toolbox: gemShop)
  'merit-shop': e('Merit_4'), // the merit token (Toolbox: merits)
  'task-unlocks': d('PetLockB0'), // the locked signpost (Toolbox: task unlocks)
  pets: d('PetEgg'), // a pet egg (companions and pets)
  minigames: d('HoopB'), // the hoops minigame's basketball (the fish read as a dot at 24 px)
  cards: d('2CardsA0'), // the first card, Green Mushroom (Toolbox: cards)
  obols: d('ObolGold1'), // a gold obol
  portals: d('PortalArrow1'), // the map's portal arrow
  skills: d('EquipmentTools2'), // a pickaxe
  gear: d('EquipmentHats1'), // the first hat
  'random-events': e('Mega_Grumblo'), // Mega Grumblo (Toolbox: randomEvents)
  'pet-tournament': d('TournyRank2'), // the tournament crest (Toolbox: tournament)
  'task-board': e('TasksStar'), // the tasks star (Toolbox: tasks)
  guild: e('Guild'), // the guild crest (Toolbox: guild)
  // M26 Wave 0 registry rows (#179)
  achievements: d('TaskAchBorder1'), // the achievement frame (Toolbox: achievements)
  dungeons: d('DungeonA7'), // the dungeon crest (Toolbox: dungeons)
  family: d('ClassIcons3'), // a gold class figure: the bonuses each class gives the family
  food: d('FoodHealth1'), // the first health food
  storage: d('InvStorage42'), // a storage chest (Toolbox: storage)
  stats: e('Character'), // the character figure (Toolbox: characters)
  coins: d('Coins1'), // a copper coin
  'friend-bonuses': e('Friends'), // the friends badge (Toolbox: friendsStats)
  'event-shop': e('Event_Currency'), // the event currency (Toolbox: eventShop)
  'trophies-nametags': d('GalleryPodiumA3'), // a gallery podium (Toolbox: Gallery, trophies and nametags)
  'town-shops': d('ShopEZ0'), // a town shopkeeper
  'drop-rate': d('RareLootDrop_x1'), // the rare loot bag
  // World 1
  stamps: d('StampA1'), // Sword Stamp
  'star-signs': d('SignStarB0'), // a star sign glyph
  anvil: d('ClassIcons43'), // the Smithing skill's anvil (Toolbox: anvil)
  forge: d('ForgeD'), // the forge (Toolbox: forge)
  bribes: d('BribeW'), // the PAID bribe stamp (Toolbox: bribes)
  statues: d('EquipmentStatues1'), // Power Statue
  'post-office': d('DeliveryBox'), // Delivery Box
  owl: e('Owl'), // the Owl (Toolbox: owl)
  quests: d('Quest62'), // the quest scroll (Toolbox: quests)
  'boss-keys': d('Key1'), // Forest Villa Key
  colosseum: d('TixCol'), // Colosseum Ticket
  poppy: d('RooA'), // Poppy the kangaroo (Toolbox: kangaroo)
  // World 2
  alchemy: d('aEmptyCauldron'), // a cauldron
  'alchemy-bubbles': d('aUpgradesO0'), // the first orange bubble
  'alchemy-vials': d('aVials1'), // a vial (Toolbox: vials)
  'alchemy-p2w': d('aShopItems0'), // the Pay 2 Win coin stack
  arcade: d('PachiBall1'), // an arcade ball (Toolbox: arcadeShop)
  islands: d('Island1'), // the bottle island (Toolbox: islands)
  killroy: e('Killroy_Skull'), // Killroy's skull (Toolbox: killroy)
  'weekly-battles': e('SWR_Containment'), // a weekly boss (Toolbox: weeklyBosses)
  ballot: e('VoteBallot'), // the ballot box (Toolbox: voteBallot)
  // World 3
  refinery: d('Refinery1'), // Redox Salts
  construction: d('Cog0A0'), // a cog
  library: d('ConTower1'), // the Talent Book Library building
  printer: d('ConTower0'), // the 3D Printer building (Toolbox: Printer)
  worship: d('WorshipSkull1'), // Wax Skull
  trapping: d('TrapBoxSet1'), // Cardboard Traps (Toolbox: Traps)
  'death-note': d('ConTower2'), // the Death Note building (Toolbox: deathNote)
  'armor-smithy': e('Armor_Set_Smithy'), // the smithy (Toolbox: armorSmithy)
  'salt-lick': d('ConTower3'), // the Salt Lick building (Toolbox: saltLick)
  prayers: d('Prayer0'), // the first prayer
  shrines: d('ShrinePlace1'), // a shrine
  equinox: d('Quest78'), // the Equinox mirror (Toolbox: Equinox)
  'atom-collider': d('ConTower8'), // the Atom Collider building (Toolbox: atomCollider)
  bubba: e('Bubba'), // Bubba (Toolbox: bubba)
  // World 4
  lab: d('ConsoleJwl0'), // a lab jewel
  cooking: d('ClassIcons51'), // the Cooking skill icon (Toolbox: cooking)
  breeding: d('ClassIcons52'), // the Breeding skill icon (Toolbox: breeding)
  sigils: d('LabBonus12'), // the sigil Lab bonus (Toolbox: sigils)
  rift: d('Mface75'), // the Rift's face (Toolbox: rift)
  tome: e('Tome_0'), // the Tome (Toolbox: tome)
  'elite-classes': d('ClassIcons10'), // an elite class's icon (the skull)
};

/** A System's game sprite, or null when it has none (our own sprite draws instead). */
export const systemGameArt = (id: string | null | undefined): GameArt | null =>
  (id ? SYSTEM_ART[id] : undefined) ?? null;
