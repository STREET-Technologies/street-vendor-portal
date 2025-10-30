import { z } from 'zod';

// Time format validation: HH:mm (24-hour format)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const dayHoursSchema = z.object({
  openTime: z.string().regex(timeRegex, 'Must be a valid time in HH:mm format'),
  closeTime: z.string().regex(timeRegex, 'Must be a valid time in HH:mm format'),
  isClosed: z.boolean(),
}).refine(
  (data) => {
    // If closed, times don't matter
    if (data.isClosed) return true;

    // If open, closeTime must be after openTime
    const [openHour, openMin] = data.openTime.split(':').map(Number);
    const [closeHour, closeMin] = data.closeTime.split(':').map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    return closeMinutes > openMinutes;
  },
  {
    message: 'Close time must be after open time',
    path: ['closeTime'],
  }
);

export const operatingHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

export type OperatingHoursFormData = z.infer<typeof operatingHoursSchema>;

// Default values for the form
export const defaultOperatingHours: OperatingHoursFormData = {
  monday: { openTime: '09:00', closeTime: '17:00', isClosed: false },
  tuesday: { openTime: '09:00', closeTime: '17:00', isClosed: false },
  wednesday: { openTime: '09:00', closeTime: '17:00', isClosed: false },
  thursday: { openTime: '09:00', closeTime: '17:00', isClosed: false },
  friday: { openTime: '09:00', closeTime: '17:00', isClosed: false },
  saturday: { openTime: '10:00', closeTime: '16:00', isClosed: false },
  sunday: { openTime: '00:00', closeTime: '00:00', isClosed: true },
};
