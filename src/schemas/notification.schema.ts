import { z } from 'zod';

export const pushNotificationSchema = z.object({
  userId: z.string().min(1, "L'ID utilisateur est requis"),
  title: z.string().min(1, "Le titre est requis"),
  message: z.string().min(1, { message: "Le message est requis" }),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
 metadata: z.record(z.string(), z.any()).optional()

});

export type PushNotificationInput = z.infer<typeof pushNotificationSchema>;