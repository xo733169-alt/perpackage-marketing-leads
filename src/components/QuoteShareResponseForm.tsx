"use client";

import { useState } from "react";
import {
  QUOTE_CUSTOMER_RESPONSE_LABELS,
  type QuoteCustomerResponseType
} from "@/lib/quote-share-schema";

const responseOptions: { value: QuoteCustomerResponseType; label: string; description: string }[] = [
  {
    value: "ACCEPTED",
    label: "견적안 수락",
    description: "담당자가 확인 후 다음 절차를 안내드립니다."
  },
  {
    value: "REJECTED",
    label: "견적안 거절",
    description: "거절 의견을 남기면 담당자가 확인합니다."
  },
  {
    value: "REVISION_REQUESTED",
    label: "수정 요청",
    description: "수정이 필요한 사양이나 요청사항을 남겨주세요."
  }
];

const successMessages: Record<QuoteCustomerResponseType, string> = {
  ACCEPTED: "견적안 수락이 접수되었습니다. 담당자가 확인 후 다음 절차를 안내드리겠습니다.",
  REJECTED: "견적안 거절 의견이 접수되었습니다.",
  REVISION_REQUESTED: "수정 요청이 접수되었습니다. 담당자가 확인 후 다시 안내드리겠습니다."
};

type ResponseFieldErrors = {
  responseType?: string;
  responderName?: string;
  message?: string;
};

export function QuoteShareResponseForm({ token }: { token: string }) {
  const [responseType, setResponseType] = useState<QuoteCustomerResponseType | "">("");
  const [responderName, setResponderName] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ResponseFieldErrors>({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [successType, setSuccessType] = useState<QuoteCustomerResponseType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitMessage("");

    if (!responseType) {
      setFieldErrors({ responseType: "응답 유형을 선택해 주세요." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/quote-share/${encodeURIComponent(token)}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseType,
          responderName,
          message
        })
      });
      const data = (await response.json()) as {
        message?: string;
        fieldErrors?: ResponseFieldErrors;
        responseType?: QuoteCustomerResponseType;
      };

      if (!response.ok) {
        setSubmitMessage(data.message ?? "응답 접수 중 문제가 발생했습니다.");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }

      const submittedType = data.responseType ?? responseType;
      setSuccessType(submittedType);
      setSubmitMessage(successMessages[submittedType]);
    } catch {
      setSubmitMessage("응답 접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successType) {
    return (
      <div className="rounded-lg border border-line bg-ivory p-5">
        <p className="text-sm font-bold text-ink">{successMessages[successType]}</p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          고객 수락은 결제나 전자계약이 아니며, 페르패키지 담당자가 확인 후 다음 절차를 안내드립니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-xl font-black text-ink">견적안 확인</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        아래 응답은 담당자 확인을 위한 의견 접수입니다. 결제나 전자계약 완료가 아닙니다.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {responseOptions.map((option) => {
          const isSelected = responseType === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setResponseType(option.value)}
              className={
                isSelected
                  ? "focus-ring rounded-md border border-ink bg-ink p-4 text-left text-white"
                  : "focus-ring rounded-md border border-line bg-white p-4 text-left text-ink transition hover:border-ink"
              }
            >
              <span className="block text-sm font-black">{option.label}</span>
              <span className={isSelected ? "mt-2 block text-xs leading-5 text-white/80" : "mt-2 block text-xs leading-5 text-neutral-600"}>
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
      {fieldErrors.responseType ? <p className="mt-2 text-sm text-red-700">{fieldErrors.responseType}</p> : null}

      <div className="mt-5 grid gap-4">
        <label className="block text-sm font-bold text-ink">
          담당자명
          <input
            value={responderName}
            onChange={(event) => setResponderName(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            placeholder="담당자명을 입력해 주세요."
            maxLength={50}
          />
        </label>
        {fieldErrors.responderName ? <p className="text-sm text-red-700">{fieldErrors.responderName}</p> : null}

        <label className="block text-sm font-bold text-ink">
          메시지
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="focus-ring mt-2 min-h-28 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            placeholder="수정이 필요한 내용이나 추가 요청사항을 입력해 주세요."
            maxLength={1000}
          />
        </label>
        {fieldErrors.message ? <p className="text-sm text-red-700">{fieldErrors.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="focus-ring mt-5 w-full rounded-md bg-ink px-4 py-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "응답 접수 중..." : responseType ? `${QUOTE_CUSTOMER_RESPONSE_LABELS[responseType]} 의견 접수` : "응답 선택 후 접수"}
      </button>

      {submitMessage ? <p className="mt-3 text-sm text-neutral-700">{submitMessage}</p> : null}
    </form>
  );
}
