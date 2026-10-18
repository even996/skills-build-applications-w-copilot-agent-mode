import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (!userId || typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
    throw Object.assign(new Error('A valid userId is required'), { status: 400 });
  }
  if (!teamId || typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('A valid teamId is required'), { status: 400 });
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('Activity type is required'), { status: 400 });
  }

  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    throw Object.assign(new Error('Minutes must be a positive number'), { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw Object.assign(new Error('Team not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes: parsedMinutes,
    points: parsedMinutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const memberIds = Array.isArray(members)
    ? members
        .filter((member) => typeof member === 'string' && mongoose.isValidObjectId(member))
        .map((member) => new mongoose.Types.ObjectId(member))
    : [];

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return rows.map((row, index) => ({
    teamName: row.teamName,
    totalPoints: row.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  if (!normalizedEmail) {
    throw Object.assign(new Error('User email is required'), { status: 400 });
  }

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const topActivityType = recentActivities[0]?.type?.trim();
  const goalFocus = String(user.fitnessGoal ?? '').trim();
  const preferredFocus = goalFocus || topActivityType || '';

  const workouts = await Workout.find({}).lean();
  const rankedWorkouts = [...workouts].sort((left, right) => {
    const leftScore = Number(left.focus === preferredFocus) + Number(topActivityType && left.focus === topActivityType);
    const rightScore = Number(right.focus === preferredFocus) + Number(topActivityType && right.focus === topActivityType);
    return rightScore - leftScore;
  });

  if (rankedWorkouts.length === 0) {
    return [];
  }

  return rankedWorkouts.slice(0, 3).map((workout) => ({
    ...workout,
    reason: topActivityType
      ? `Your recent ${topActivityType} activity and goal focus on ${preferredFocus} make this a strong fit.`
      : `Your goal focus on ${preferredFocus} makes this a strong fit.`,
  }));
}

export { User };
