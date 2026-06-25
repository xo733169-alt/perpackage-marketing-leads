"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MARKETING_COST_CHANNELS } from "@/lib/marketing-cost-schema";

export type MarketingCostListItem = {
  id: string;
  costDate: string;
  channel: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  amountKrw: number;
  memo: string;
};

type CostFormState = {
  costDate: string;
  channel: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  amountKrw: string;
  memo: string;
};

function getTodayInputValue() {
  const now = new Date();
  const timezoneOffsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

const emptyForm: CostFormState = {
  costDate: getTodayInputValue(),
  channel: MARKETING_COST_CHANNELS[0],
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  amountKrw: "",
  memo: ""
};

function toForm(cost: MarketingCostListItem): CostFormState {
  return {
    costDate: cost.costDate.slice(0, 10),
    channel: cost.channel,
    utmSource: cost.utmSource,
    utmMedium: cost.utmMedium,
    utmCampaign: cost.utmCampaign,
    amountKrw: cost.amountKrw.toString(),
    memo: cost.memo
  };
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ChannelSelect({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="input-base">
      {MARKETING_COST_CHANNELS.map((channel) => (
        <option key={channel} value={channel}>
          {channel}
        </option>
      ))}
    </select>
  );
}

function CostFormFields({
  form,
  setForm
}: {
  form: CostFormState;
  setForm: (form: CostFormState) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Field label="비용 날짜">
        <input
          type="date"
          value={form.costDate}
          onChange={(event) => setForm({ ...form, costDate: event.target.value })}
          className="input-base"
        />
      </Field>
      <Field label="채널">
        <ChannelSelect value={form.channel} onChange={(channel) => setForm({ ...form, channel })} />
      </Field>
      <Field label="비용">
        <input
          type="number"
          min="0"
          step="1"
          value={form.amountKrw}
          onChange={(event) => setForm({ ...form, amountKrw: event.target.value })}
          className="input-base"
          placeholder="예: 500000"
        />
      </Field>
      <Field label="utm_source">
        <input
          value={form.utmSource}
          onChange={(event) => setForm({ ...form, utmSource: event.target.value })}
          className="input-base"
          placeholder="예: naver"
        />
      </Field>
      <Field label="utm_medium">
        <input
          value={form.utmMedium}
          onChange={(event) => setForm({ ...form, utmMedium: event.target.value })}
          className="input-base"
          placeholder="예: cpc"
        />
      </Field>
      <Field label="utm_campaign">
        <input
          value={form.utmCampaign}
          onChange={(event) => setForm({ ...form, utmCampaign: event.target.value })}
          className="input-base"
          placeholder="예: rigid_box"
        />
      </Field>
      <label className="block md:col-span-2">
        <span className="label-base">메모</span>
        <textarea
          value={form.memo}
          onChange={(event) => setForm({ ...form, memo: event.target.value })}
          className="input-base mt-2 min-h-20"
          placeholder="비용 입력 기준, 기간, 캠페인 메모"
        />
      </label>
    </div>
  );
}

function MarketingCostRow({ cost }: { cost: MarketingCostListItem }) {
  const router = useRouter();
  const [form, setForm] = useState<CostFormState>(toForm(cost));
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/marketing-costs/${cost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "저장에 실패했습니다.");
        return;
      }

      setMessage("저장되었습니다.");
      router.refresh();
    } catch {
      setMessage("저장 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("이 마케팅 비용 기록을 삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?")) return;

    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/marketing-costs/${cost.id}`, {
        method: "DELETE"
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "삭제에 실패했습니다.");
        return;
      }

      router.refresh();
    } catch {
      setMessage("삭제 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <CostFormFields form={form} setForm={setForm} />
      {message ? <p className="mt-3 text-sm text-neutral-600">{message}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          저장
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={isSaving}
          className="focus-ring rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

export function MarketingCostManager({ costs }: { costs: MarketingCostListItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState<CostFormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function createCost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/marketing-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "저장에 실패했습니다.");
        return;
      }

      setForm(emptyForm);
      setMessage("마케팅 비용이 추가되었습니다.");
      router.refresh();
    } catch {
      setMessage("저장 중 문제가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createCost} className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg font-bold text-ink">비용 추가</h2>
        <div className="mt-4">
          <CostFormFields form={form} setForm={setForm} />
        </div>
        {message ? <p className="mt-3 text-sm text-neutral-600">{message}</p> : null}
        <button
          type="submit"
          disabled={isSaving}
          className="focus-ring mt-4 rounded-md bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "비용 추가"}
        </button>
      </form>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-ink">비용 목록</h2>
          <p className="mt-1 text-sm text-neutral-600">
            광고비와 매출 지표는 수동 입력 데이터 기준의 참고용 성과입니다.
          </p>
        </div>
        {costs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-sm text-neutral-500">
            등록된 마케팅 비용이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {costs.map((cost) => (
              <MarketingCostRow key={cost.id} cost={cost} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
