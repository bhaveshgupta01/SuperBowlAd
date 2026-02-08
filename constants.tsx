
import { GameTrigger } from './types';

export const RAW_GAME_DATA = {
    "event": "401326315",
    "triggers": [
        { "trigger_type": "QUARTER_CHANGE", "period": 1, "clock": "15:00", "context": { "home_score": 0, "away_score": 0 }, "priority": 4, "ttl_seconds": 300 },
        { "trigger_type": "SCORE_CHANGE", "period": 1, "clock": "9:58", "context": { "old_score": { "home": 0, "away": 0 }, "new_score": { "home": 3, "away": 0 }, "scoring_team": "HOME", "scoring_type": "FIELD_GOAL" }, "priority": 5, "ttl_seconds": 240 },
        { "trigger_type": "SCORE_CHANGE", "period": 1, "clock": "6:17", "context": { "old_score": { "home": 3, "away": 0 }, "new_score": { "home": 3, "away": 7 }, "scoring_team": "AWAY", "scoring_type": "TOUCHDOWN" }, "priority": 5, "ttl_seconds": 240 },
        { "trigger_type": "TOUCHDOWN", "period": 1, "clock": "6:17", "context": { "team": "21", "scorer_name": "DeVonta Smith", "assist_name": "Jalen Hurts", "score": { "home": 3, "away": 7 }, "raw_text": "DeVonta Smith Pass From Jalen Hurts for 18 Yrds" }, "priority": 5, "ttl_seconds": 180 },
        { "trigger_type": "QUARTER_CHANGE", "period": 2, "clock": "15:00", "context": { "home_score": 3, "away_score": 7 }, "priority": 4, "ttl_seconds": 300 },
        { "trigger_type": "SCORE_CHANGE", "period": 2, "clock": "14:52", "context": { "old_score": { "home": 3, "away": 7 }, "new_score": { "home": 6, "away": 7 }, "scoring_team": "HOME", "scoring_type": "FIELD_GOAL" }, "priority": 5, "ttl_seconds": 240 },
        { "trigger_type": "SCORE_CHANGE", "period": 2, "clock": "0:02", "context": { "old_score": { "home": 6, "away": 7 }, "new_score": { "home": 6, "away": 15 }, "scoring_team": "AWAY", "scoring_type": "TOUCHDOWN" }, "priority": 5, "ttl_seconds": 240 },
        { "trigger_type": "TOUCHDOWN", "period": 2, "clock": "0:02", "context": { "team": "21", "scorer_name": "Dallas Goedert", "assist_name": "Jalen Hurts", "score": { "home": 6, "away": 15 }, "raw_text": "Dallas Goedert Pass From Jalen Hurts for 9 Yrds" }, "priority": 5, "ttl_seconds": 180 },
        { "trigger_type": "QUARTER_CHANGE", "period": 3, "clock": "15:00", "context": { "home_score": 6, "away_score": 15 }, "priority": 4, "ttl_seconds": 300 },
        { "trigger_type": "SCORE_CHANGE", "period": 3, "clock": "1:25", "context": { "old_score": { "home": 6, "away": 15 }, "new_score": { "home": 6, "away": 22 }, "scoring_team": "AWAY", "scoring_type": "TOUCHDOWN" }, "priority": 5, "ttl_seconds": 240 },
        { "trigger_type": "TOUCHDOWN", "period": 3, "clock": "1:25", "context": { "team": "21", "scorer_name": "Kenneth Gainwell", "assist_name": null, "score": { "home": 6, "away": 22 }, "raw_text": "Kenneth Gainwell 8 Yard Rush" }, "priority": 5, "ttl_seconds": 180 },
        { "trigger_type": "QUARTER_CHANGE", "period": 4, "clock": "15:00", "context": { "home_score": 6, "away_score": 22 }, "priority": 4, "ttl_seconds": 300 },
        { "trigger_type": "SCORE_CHANGE", "period": 4, "clock": "4:20", "context": { "old_score": { "home": 6, "away": 22 }, "new_score": { "home": 6, "away": 29 }, "scoring_team": "AWAY", "scoring_type": "TOUCHDOWN" }, "priority": 5, "ttl_seconds": 240 },
        { "trigger_type": "TOUCHDOWN", "period": 4, "clock": "4:20", "context": { "team": "21", "scorer_name": "Jalen Reagor", "assist_name": "Jalen Hurts", "score": { "home": 6, "away": 29 }, "raw_text": "Jalen Reagor Pass From Jalen Hurts for 23 Yrds" }, "priority": 5, "ttl_seconds": 180 }
    ]
};

export const POST_STYLES: { value: string; label: string; icon: string }[] = [
  { value: 'Hype', label: 'High Octane Hype', icon: '🔥' },
  { value: 'Funny', label: 'Commercial Break Funny', icon: '🤣' },
  { value: 'Analytical', label: 'Coach Speak', icon: '📋' },
  { value: 'Controversial', label: 'Spicy Hot Take', icon: '🌶️' },
  { value: 'Nostalgic', label: 'Halftime Show Legend', icon: '🎸' },
];

export const GAME_EVENTS: { value: string; label: string; emoji: string }[] = [
  { value: 'touchdown', label: 'Touchdown Celebration', emoji: '🏈' },
  { value: 'interception', label: 'Game-Changing Interception', emoji: '🚫' },
  { value: 'field_goal', label: 'Clutch Field Goal', emoji: '🥅' },
  { value: 'sack', label: 'Blindside Sack', emoji: '💥' },
  { value: 'fumble', label: 'Loose Ball Scramble', emoji: '👐' },
  { value: 'halftime', label: 'Halftime Show Fireworks', emoji: '🎸' },
  { value: 'anthem', label: 'National Anthem flyover', emoji: '🇺🇸' },
  { value: 'redzone', label: 'Red Zone Intensity', emoji: '🚩' },
  { value: 'fan_reaction', label: 'Wild Fan Celebration', emoji: '🤩' },
  { value: 'commercial', label: 'Viral Commercial Moment', emoji: '📺' },
];

export const PLATFORMS: { value: string; label: string }[] = [
  { value: 'Instagram', label: 'Instagram' },
  { value: 'X', label: 'X (Twitter)' },
  { value: 'Threads', label: 'Threads' },
];

export const CONTENT_TYPES: { value: string; label: string }[] = [
  { value: 'Image', label: 'AI Visual (Image)' },
  { value: 'Video', label: 'AI Motion (Video)' },
];
