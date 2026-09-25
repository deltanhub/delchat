import { MuteDurationOption } from './types';

export const DURATION_OPTIONS: MuteDurationOption[] = [
  { key: '8h', label: '8 Hours', icon: 'time-outline', subtitle: 'Mute until tonight' },
  { key: '1w', label: '1 Week', icon: 'calendar-outline', subtitle: 'Mute for 7 days' },
  { key: 'always', label: 'Always', icon: 'infinite-outline', subtitle: 'Until you turn it off' },
];
