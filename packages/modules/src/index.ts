export type ModuleId = 'frontpage' | 'booking' | 'crm' | 'notifications' | string;

export interface ModuleManifest {
  id: ModuleId;
  name: string;
  version: string;
  description: string;
  dependencies: ModuleId[];
}

export const coreModuleManifests: ModuleManifest[] = [
  {
    id: 'frontpage',
    name: 'Frontpage',
    version: '0.0.0',
    description: 'Tenant public website pages and blocks.',
    dependencies: [],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    version: '0.0.0',
    description: 'Outbox-backed notification requests.',
    dependencies: [],
  },
  {
    id: 'booking',
    name: 'Booking',
    version: '0.0.0',
    description: 'Public and staff booking workflows.',
    dependencies: ['notifications'],
  },
  {
    id: 'crm',
    name: 'CRM',
    version: '0.0.0',
    description: 'Customer profiles, notes, and timeline.',
    dependencies: [],
  },
];
