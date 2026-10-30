export type SosCoordinates = { latitude: number; longitude: number };
export type SosReceipt = {
  id: string; receivedAt: string | null; location: SosCoordinates | null;
  status: 'recorded'; responderNotified: false; alreadyActive: boolean;
};
export const validSosCoordinates = (value: any): value is SosCoordinates =>
  typeof value?.latitude === 'number' && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 &&
  typeof value?.longitude === 'number' && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;

export const readSosReceipt = (value: any): SosReceipt => {
  if (!value || typeof value.id !== 'string' || !/^[a-f\d]{24}$/i.test(value.id) ||
      value.status !== 'recorded' || value.responderNotified !== false || typeof value.alreadyActive !== 'boolean' ||
      !(value.receivedAt === null || (typeof value.receivedAt === 'string' &&
        /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value.receivedAt) && Number.isFinite(Date.parse(value.receivedAt)))) ||
      !(value.location == null || validSosCoordinates(value.location))) {
    throw new Error('Invalid SOS receipt');
  }
  return { id: value.id, receivedAt: value.receivedAt, location: value.location ?? null,
    status: 'recorded', responderNotified: false, alreadyActive: value.alreadyActive };
};

export const sosDeadline = async <T>(operation: Promise<T>, milliseconds: number, onTimeout?: () => void): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('SOS operation timed out'));
        onTimeout?.();
      }, milliseconds);
    })]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
};
