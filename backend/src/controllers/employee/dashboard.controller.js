'use strict';

const Task = require('../../models/Task');
const Project = require('../../models/Project');
const LeaveRequest = require('../../models/LeaveRequest');
const Announcement = require('../../models/Announcement');
const { wrapHandlers } = require('../../utils/asyncHandler');

/** GET /employee/stats — everything an employee needs at a glance. */
async function getStats(req, res) {
  const me = req.user._id;
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    openTasks,
    inProgressTasks,
    doneTasks,
    activeProjects,
    totalProjects,
    pendingLeaves,
    approvedLeaves,
    newAnnouncements,
    latestAnnouncements,
    upcomingTasks,
  ] = await Promise.all([
    Task.countDocuments({ assignedTo: me, status: { $in: ['todo', 'review'] } }),
    Task.countDocuments({ assignedTo: me, status: 'in-progress' }),
    Task.countDocuments({ assignedTo: me, status: 'done' }),
    Project.countDocuments({
      assignedEmployees: me,
      status: { $in: ['planning', 'in-progress', 'review'] },
    }),
    Project.countDocuments({ assignedEmployees: me }),
    LeaveRequest.countDocuments({ employee: me, status: 'pending' }),
    LeaveRequest.countDocuments({ employee: me, status: 'approved' }),
    Announcement.countDocuments({
      audience: { $in: ['all', 'employees'] },
      isPublished: true,
      createdAt: { $gte: since7d },
    }),
    Announcement.find({ audience: { $in: ['all', 'employees'] }, isPublished: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title body audience createdAt')
      .lean(),
    Task.find({ assignedTo: me, status: { $ne: 'done' } })
      .sort({ dueDate: 1 })
      .limit(5)
      .select('title status priority dueDate project')
      .populate('project', 'title slug')
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      tasks: {
        open: openTasks,
        inProgress: inProgressTasks,
        done: doneTasks,
        total: openTasks + inProgressTasks + doneTasks,
      },
      projects: { active: activeProjects, total: totalProjects },
      leaves: { pending: pendingLeaves, approved: approvedLeaves },
      announcements: { new: newAnnouncements, latest: latestAnnouncements },
      upcomingTasks,
    },
    message: 'Employee dashboard fetched',
  });
}

module.exports = wrapHandlers({ getStats });
