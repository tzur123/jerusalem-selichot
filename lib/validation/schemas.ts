import { z } from "zod";
import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/events";

export const sessionStartSchema = z.object({
  startMode: z.enum(["nearest", "recommended", "manual"]),
  startStationId: z.string().uuid().optional(),
});

export const sessionProgressActionSchema = z.object({
  action: z.enum(["arrived", "video_started", "video_completed"]),
  stationId: z.string().uuid(),
});

export const qrValidateSchema = z.object({
  token: z.string().min(10).max(512),
});

export const eventSchema = z.object({
  name: z.enum(ANALYTICS_EVENT_NAMES as unknown as [string, ...string[]]),
  stationId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const stationUpsertSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens"),
  name: z.string().min(1).max(200),
  shortDescription: z.string().max(400).optional().nullable(),
  longDescription: z.string().max(4000).optional().nullable(),
  address: z.string().max(400).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  orderIndex: z.number().int().min(1),
  isDefaultStart: z.boolean().default(false),
  arrivalRadiusM: z.number().int().min(5).max(500).default(45),
  isPublished: z.boolean().default(false),
  videoPath: z.string().max(500).optional().nullable(),
  posterPath: z.string().max(500).optional().nullable(),
  captionsPath: z.string().max(500).optional().nullable(),
});

export const reorderSchema = z.object({
  order: z.array(z.object({ id: z.string().uuid(), orderIndex: z.number().int().min(1) })),
});
