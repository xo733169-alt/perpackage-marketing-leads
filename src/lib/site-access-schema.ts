import { z } from "zod";

export const siteAccessLoginSchema = z.object({
  password: z.string().trim().min(1, "접근 비밀번호를 입력해 주세요."),
  next: z.string().optional()
});

export type SiteAccessLoginInput = z.infer<typeof siteAccessLoginSchema>;

export type SiteAccessFieldErrors = Partial<Record<keyof SiteAccessLoginInput, string>>;

export function toSiteAccessFieldErrors(error: z.ZodError): SiteAccessFieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]])
  ) as SiteAccessFieldErrors;
}
