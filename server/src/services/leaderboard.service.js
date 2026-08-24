import * as CircleModel from '../models/circle.model.js';
import * as LeaderboardModel from '../models/leaderboard.model.js';
import { periodStart, longestConsecutiveWeeks } from '../utils/date.js';

function computeForMember(rows) {
  const genres = new Set(rows.map((r) => r.genre).filter(Boolean));
  const pages = rows.reduce((sum, r) => sum + (r.pageCount ?? 0), 0);
  const streak = longestConsecutiveWeeks(rows.map((r) => r.finishedAt));
  return { books: rows.length, genres: genres.size, pages, streak };
}

// Competition ranking (1, 1, 3): ties share a rank, the next rank skips.
// Ties are broken by name so output is stable across refreshes.
function rank(members, stats, key) {
  const sorted = [...members].sort((a, b) => {
    const diff = stats[b.id][key] - stats[a.id][key];
    return diff !== 0 ? diff : (a.name || '').localeCompare(b.name || '');
  });

  let lastValue = null;
  let lastRank = 0;

  return sorted.map((member, index) => {
    const value = stats[member.id][key];
    if (value !== lastValue) {
      lastRank = index + 1;
      lastValue = value;
    }
    return {
      rank: lastRank,
      user: { id: member.id, name: member.name, avatarUrl: member.avatarUrl },
      value
    };
  });
}

export async function getLeaderboard(circleId, period) {
  const members = await CircleModel.getMembers(circleId);
  const start = periodStart(period);
  const rows = members.length > 0 ? await LeaderboardModel.findFinishedByMembers(members.map((m) => m.id), start) : [];

  const stats = {};
  for (const member of members) {
    stats[member.id] = computeForMember(rows.filter((r) => r.userId === member.id));
  }

  return {
    period,
    categories: {
      books: rank(members, stats, 'books'),
      genres: rank(members, stats, 'genres'),
      pages: rank(members, stats, 'pages'),
      streak: rank(members, stats, 'streak')
    }
  };
}
