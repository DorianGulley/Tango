import type { FunctionReturnType } from 'convex/server';

import type { api } from '@/../convex/_generated/api';

export type TangoState = NonNullable<FunctionReturnType<typeof api.tango.state>>;
export type Profile = TangoState['profile'];
export type MatchView = NonNullable<TangoState['match']>;
