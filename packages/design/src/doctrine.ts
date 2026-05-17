export type DoctrineId =
  | 'beautifulByDefault'
  | 'systemsBeforeSettings'
  | 'featureFirst'
  | 'personalityEncoded'
  | 'tenantChoosesOutcomes'
  | 'globalAdminOwnsSystems'
  | 'publishQualityGated';

export interface DoctrineStatement {
  id: DoctrineId;
  title: string;
  description: string;
}

export const doctrineStatements: Record<DoctrineId, DoctrineStatement> = {
  beautifulByDefault: {
    id: 'beautifulByDefault',
    title: 'Beautiful by default',
    description: 'Every default page, section, theme, and block variant should look production-quality before customization.',
  },
  systemsBeforeSettings: {
    id: 'systemsBeforeSettings',
    title: 'Systems before settings',
    description: 'Use defined scales and tokens instead of arbitrary values.',
  },
  featureFirst: {
    id: 'featureFirst',
    title: 'Feature first',
    description: 'Guide users by business goal and content structure rather than raw layout primitives.',
  },
  personalityEncoded: {
    id: 'personalityEncoded',
    title: 'Personality is encoded',
    description: 'Theme personality includes typography, spacing, radius, imagery, CTA treatment, and component behavior.',
  },
  tenantChoosesOutcomes: {
    id: 'tenantChoosesOutcomes',
    title: 'Tenant users choose outcomes',
    description: 'Tenant users choose curated directions and content structures, not pixels.',
  },
  globalAdminOwnsSystems: {
    id: 'globalAdminOwnsSystems',
    title: 'Global Admin owns systems',
    description: 'Global Admin creates and versions themes, recipes, and token systems.',
  },
  publishQualityGated: {
    id: 'publishQualityGated',
    title: 'Publish is quality-gated',
    description: 'Pages and themes publish only after lint, accessibility, and composition checks pass.',
  },
};

export function listDoctrineStatements(): DoctrineStatement[] {
  return Object.values(doctrineStatements);
}
