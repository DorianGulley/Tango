import { cronJobs } from 'convex/server';

import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('match available Tango sessions', { minutes: 1 }, internal.matching.sweep, {});

export default crons;
