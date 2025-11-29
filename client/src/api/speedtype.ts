import api from './api';

interface SpeedTypeSubmission {
  difficulty: 'easy' | 'medium' | 'hard';
  wpm: number;
  accuracy: number;
  wordsCorrect: number;
  totalWords: number;
}

// interface SpeedTypeStats {
//   userId: string;
//   totalGames: number;
//   bestWPM: number;
//   averageWPM: number;
//   bestAccuracy: number;
//   averageAccuracy: number;
//   totalXPEarned: number;
//   difficulties: {
//     easy: { games: number; bestWPM: number };
//     medium: { games: number; bestWPM: number };
//     hard: { games: number; bestWPM: number };
//   };
// }

export async function submitSpeedType(data: SpeedTypeSubmission) {
  try {
    const response = await api.post(`/api/speedtype/submit`, data);
    return response.data;
  } catch (error) {
    console.error('Error submitting speed typing game:', error);
    throw error;
  }
}

export async function getSpeedTypeStats() {
  try {
    const response = await api.get(`/api/speedtype/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching speed typing stats:', error);
    throw error;
  }
}

export async function getSpeedTypeLeaderboard(difficulty?: string) {
  try {
    const url = difficulty
      ? `/api/speedtype/leaderboard?difficulty=${difficulty}`
      : `/api/speedtype/leaderboard`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching speed typing leaderboard:', error);
    throw error;
  }
}
