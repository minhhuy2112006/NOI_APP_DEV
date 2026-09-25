import { z } from "zod";
const id = z.string().min(1).max(100),
  text = z.string().trim().min(1).max(5000),
  reason = z.string().trim().min(5).max(2000);
const amount = z.coerce.number().int().min(1000).max(1_000_000_000);
export const schemas: Record<string, z.ZodType> = {
  apply: z.object({
    campaign_id: id,
    motivation: z.string().trim().min(10).max(1500),
  }),
  application: z.object({
    id,
    status: z.enum([
      "selected",
      "waitlisted",
      "rejected",
      "confirmed",
      "cancelled",
    ]),
    reason: z.string().max(1000).default(""),
  }),
  campaign: z
    .object({
      id: id.optional(),
      title: z.string().trim().min(10).max(150),
      summary: z.string().trim().min(20).max(300),
      description: z.string().trim().min(30).max(10000),
      category: z.enum(["Giáo dục", "Cộng đồng", "Môi trường", "Sức khỏe"]),
      location: text,
      address: text,
      starts_at: z.iso.datetime(),
      ends_at: z.iso.datetime(),
      capacity: z.coerce.number().int().min(1).max(10000),
      goal: z.coerce.number().int().min(0).max(1_000_000_000),
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      instructions: text,
      status: z.enum(["draft", "pending"]),
    })
    .refine((p) => Date.parse(p.ends_at) > Date.parse(p.starts_at), {
      message: "Thời gian kết thúc phải sau thời gian bắt đầu.",
    }),
  "campaign-schedule": z.object({id, starts_at:z.iso.datetime(),ends_at:z.iso.datetime(),address:text,latitude:z.coerce.number().min(-90).max(90),longitude:z.coerce.number().min(-180).max(180),instructions:text,reason}).refine(p=>Date.parse(p.ends_at)>Date.parse(p.starts_at),{message:'Thời gian kết thúc phải sau thời gian bắt đầu.'}),
  "campaign-review": z.object({
    id,
    status: z.enum(["published", "changes", "rejected"]),
    reason,
  }),
  organization: z.object({
    name: z.string().trim().min(3).max(150),
    description: text,
    contact: z.email(),
    evidence: z
      .url()
      .refine(
        (u) => u.startsWith("https://"),
        "Hồ sơ minh chứng cần đường dẫn HTTPS.",
      ),
  }),
  "organization-review": z.object({
    id,
    status: z.enum(["verified", "changes", "rejected"]),
    reason,
  }),
  attendance: z.object({
    campaign_id: id,
    kind: z.enum(["in", "out"]),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).max(10000),
    photo_path: z.string().min(1),
  }),
  complete: z.object({
    id,
    hours: z.coerce.number().min(0.25).max(24),
    reason,
  }),
  donate: z
    .object({
      campaign_id: id.nullable().optional(),
      purpose: z.enum(["campaign", "operations", "emergency"]),
      amount,
    })
    .refine((p) => p.purpose !== "campaign" || !!p.campaign_id, {
      message: "Chọn chiến dịch cần đóng góp.",
    })
    .refine((p) => p.purpose === "campaign" || !p.campaign_id, {
      message: "Nguồn đóng góp phải được tách riêng.",
    }),
  "donation-confirm": z.object({ id, reason }),
  expense: z.object({
    campaign_id: id,
    title: text,
    amount,
    evidence: z
      .url()
      .refine(
        (u) => u.startsWith("https://"),
        "Minh chứng cần đường dẫn HTTPS.",
      ),
  }),
  report: z.object({
    campaign_id: id,
    title: text,
    body: z.string().min(30).max(15000),
    beneficiaries: z.coerce.number().int().min(0).max(1_000_000),
  }),
  publish: z.object({
    id,
    table: z.enum(["reports", "expenses", "content"]),
    status: z.enum(["published", "rejected"]),
    reason,
  }),
  redeem: z.object({ id }),
  redemption: z.object({ id, status: z.enum(["fulfilled", "cancelled"]) }),
  ticket: z.object({
    campaign_id: id.optional(),
    title: z.string().trim().min(5).max(150),
    body: z.string().trim().min(10).max(4000),
  }),
  "ticket-resolve": z.object({ id, reply: reason }),
  profile: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().max(20),
    interests: z.string().max(300),
  }),
  notification: z.object({ id }),
  content: z.object({
    id: id.optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(100),
    title: text,
    body: z.string().min(20).max(15000),
  }),
  lead: z.object({
    company: z.string().min(2).max(200),
    email: z.email(),
    message: z.string().min(10).max(2000),
    type: z.enum(["business", "priority", "advertising"]),
  }),
};
export function parseAction(action: string, payload: unknown) {
  const schema = schemas[action];
  if (!schema) throw Error("Thao tác không hợp lệ.");
  return schema.parse(payload);
}
