import type { Profile } from './contracts';

export const editableProfileFields = [
  'firstName',
  'lastName',
  'contact',
  'language',
  'boatId',
] as const;

export type ProfileField = (typeof editableProfileFields)[number];
export type ProfileDraft = Record<ProfileField, string>;
export type SavedProfile = { user: Profile; profileVersion: number };

export function readProfile(
  response: unknown,
  expectedUserId: string,
): SavedProfile {
  const envelope = response as {
    success?: boolean;
    data?: Partial<SavedProfile>;
  } | null;
  const user = envelope?.data?.user;
  const version = envelope?.data?.profileVersion;
  const strings = ['firstName', 'lastName', 'contact', 'boatId'] as const;

  if (
    envelope?.success !== true ||
    !user ||
    user.userId !== expectedUserId ||
    !/^[a-f\d]{24}$/i.test(user.userId) ||
    typeof user.email !== 'string' ||
    typeof user.username !== 'string' ||
    typeof user.isActive !== 'boolean' ||
    !strings.every(
      (field) => typeof user[field] === 'string' && user[field].length <= 100,
    ) ||
    !['Sinhala', 'Tamil'].includes(user.language) ||
    !Number.isSafeInteger(version) ||
    Number(version) < 0
  ) {
    throw new Error('Invalid profile response');
  }

  return { user, profileVersion: Number(version) };
}

export function profileDraft(user: Profile): ProfileDraft {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    contact: user.contact,
    language: user.language,
    boatId: user.boatId,
  };
}

export function profilePatch(saved: SavedProfile, draft: ProfileDraft) {
  const changes: Partial<ProfileDraft> = {};

  for (const field of editableProfileFields) {
    const value = draft[field].trim();
    if (value.length > 100 || (!value && field !== 'boatId')) {
      throw new Error(
        `${field} must contain between 1 and 100 characters${field === 'boatId' ? ', or be empty' : ''}.`,
      );
    }
    if (field === 'language' && value !== 'Sinhala' && value !== 'Tamil') {
      throw new Error('Language must be Sinhala or Tamil.');
    }
    if (value !== saved.user[field]) changes[field] = value;
  }

  return Object.keys(changes).length
    ? { ...changes, expectedVersion: saved.profileVersion }
    : null;
}
