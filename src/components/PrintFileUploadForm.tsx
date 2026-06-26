"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  DEFAULT_UPLOAD_ALLOWED_EXTENSIONS,
  formatFileSize,
  getPrintFileValidationError,
  getUploadLimitConfig,
  isSvgPrintFile,
  toPrintFileFieldErrors,
  uploadProjectCreateSchema,
  type PrintFileFieldErrors
} from "@/lib/print-file-upload-schema";

type SubmitState = {
  message?: string;
  fieldErrors: PrintFileFieldErrors;
};

type CreatedProject = {
  id: string;
  uploadCode?: string | null;
  cafe24OrderNumber: string;
  createdAt?: string;
};

type PreparedUpload = {
  file: {
    id: string;
  };
  upload: {
    uploadUrl: string;
    method: "PUT";
    headers: Record<string, string>;
  };
};

type CompletedUpload = {
  file?: {
    id: string;
    originalFilename: string;
    fileSize: number;
    fileExtension: string;
    version: number;
    uploadedAt: string | null;
  };
};

type UploadedFileResult = NonNullable<CompletedUpload["file"]>;

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-700">{message}</p>;
}

function TextField({
  id,
  label,
  type = "text",
  required,
  error
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      <input id={id} name={id} type={type} required={required} className="input-base mt-2" />
      <FieldError message={error} />
    </label>
  );
}

function TextareaField({
  id,
  label,
  rows = 4,
  helper,
  error
}: {
  id: string;
  label: string;
  rows?: number;
  helper?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="label-base">{label}</span>
      {helper ? <span className="mt-1 block text-xs leading-5 text-neutral-500">{helper}</span> : null}
      <textarea id={id} name={id} rows={rows} className="input-base mt-2 min-h-28" />
      <FieldError message={error} />
    </label>
  );
}

async function readJsonResponse<T>(response: Response): Promise<T & { message?: string; fieldErrors?: PrintFileFieldErrors }> {
  return (await response.json().catch(() => ({}))) as T & {
    message?: string;
    fieldErrors?: PrintFileFieldErrors;
  };
}

function buildProjectPayload(formData: FormData) {
  return {
    cafe24OrderNumber: getFormValue(formData, "cafe24OrderNumber"),
    companyName: getFormValue(formData, "companyName"),
    contactName: getFormValue(formData, "contactName"),
    customerName: getFormValue(formData, "customerName"),
    phone: getFormValue(formData, "phone"),
    email: getFormValue(formData, "email"),
    contactMethod: getFormValue(formData, "contactMethod"),
    productName: getFormValue(formData, "productName"),
    productOptionText: getFormValue(formData, "productOptionText"),
    requestMemo: getFormValue(formData, "requestMemo"),
    privacyConsent: formData.get("privacyConsent") === "on"
  };
}

export function PrintFileUploadForm() {
  const router = useRouter();
  const limits = useMemo(() => getUploadLimitConfig(), []);
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<SubmitState>({ fieldErrors: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  const allowedExtensionsLabel = useMemo(
    () => DEFAULT_UPLOAD_ALLOWED_EXTENSIONS.map((item) => item.toUpperCase()).join(", "),
    []
  );
  const selectedTotalBytes = files.reduce((total, file) => total + file.size, 0);
  const hasSvgFile = files.some((file) => isSvgPrintFile(file.name));

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    noKeyboard: true,
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "application/postscript": [".ai", ".eps"],
      "application/dxf": [".dxf"],
      "application/zip": [".zip"],
      "image/vnd.adobe.photoshop": [".psd"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/svg+xml": [".svg"],
      "application/octet-stream": [".ai", ".eps", ".psd", ".dxf"],
      "text/plain": [".dxf"]
    },
    onDrop(acceptedFiles) {
      const nextFiles = [...files, ...acceptedFiles];
      const invalid = nextFiles
        .map((file) => getPrintFileValidationError(file, limits))
        .find((message): message is string => Boolean(message));

      if (invalid) {
        setState((current) => ({
          ...current,
          fieldErrors: { ...current.fieldErrors, file: invalid },
          message: undefined
        }));
        return;
      }

      const nextTotal = nextFiles.reduce((total, file) => total + file.size, 0);
      if (nextTotal > limits.maxProjectSizeBytes) {
        setState((current) => ({
          ...current,
          fieldErrors: {
            ...current.fieldErrors,
            file: `전체 파일 용량은 ${formatFileSize(limits.maxProjectSizeBytes)} 이하로 준비해 주세요.`
          },
          message: undefined
        }));
        return;
      }

      setFiles(nextFiles);
      setState((current) => ({
        ...current,
        fieldErrors: { ...current.fieldErrors, file: undefined }
      }));
    }
  });

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function createProject(formData: FormData): Promise<CreatedProject> {
    const payload = buildProjectPayload(formData);
    const parsed = uploadProjectCreateSchema.safeParse(payload);

    if (!parsed.success) {
      setState({
        fieldErrors: toPrintFileFieldErrors(parsed.error),
        message: "입력 내용을 다시 확인해 주세요."
      });
      throw new Error("invalid-project-input");
    }

    const response = await fetch("/api/uploads/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data)
    });
    const data = await readJsonResponse<{ project?: CreatedProject }>(response);

    if (!response.ok || !data.project) {
      setState({
        fieldErrors: data.fieldErrors ?? {},
        message: data.message ?? "업로드 정보를 저장하는 중 문제가 발생했습니다."
      });
      throw new Error("project-create-failed");
    }

    return data.project;
  }

  async function uploadFile(projectId: string, file: File, index: number) {
    setProgressMessage(`${index + 1}번째 파일 업로드 준비 중입니다.`);
    const prepareResponse = await fetch("/api/uploads/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "prepare",
        projectId,
        originalFilename: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream"
      })
    });
    const prepared = await readJsonResponse<PreparedUpload>(prepareResponse);

    if (!prepareResponse.ok || !prepared.file?.id || !prepared.upload?.uploadUrl) {
      throw new Error(prepared.message ?? "파일 업로드 주소를 만들 수 없습니다.");
    }

    setProgressMessage(`${index + 1}번째 파일을 전송 중입니다.`);
    const uploadResponse = await fetch(prepared.upload.uploadUrl, {
      method: prepared.upload.method,
      headers: prepared.upload.headers,
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error("파일 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }

    setProgressMessage(`${index + 1}번째 파일 전송을 확인 중입니다.`);
    const completeResponse = await fetch("/api/uploads/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "complete",
        projectId,
        fileId: prepared.file.id
      })
    });
    const completed = await readJsonResponse<CompletedUpload>(completeResponse);

    if (!completeResponse.ok) {
      throw new Error(completed.message ?? "파일 전송 확인에 실패했습니다.");
    }

    return completed.file ?? {
      id: prepared.file.id,
      originalFilename: file.name,
      fileSize: file.size,
      fileExtension: file.name.split(".").pop()?.toLowerCase() ?? "",
      version: index + 1,
      uploadedAt: null
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ fieldErrors: {} });
    setProgressMessage("");

    if (!files.length) {
      setState({
        fieldErrors: { file: "업로드할 인쇄파일을 선택해 주세요." }
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const project = await createProject(new FormData(event.currentTarget));
      const uploadedFiles: UploadedFileResult[] = [];

      for (let index = 0; index < files.length; index += 1) {
        uploadedFiles.push(await uploadFile(project.id, files[index], index));
      }

      window.sessionStorage.setItem(
        "perpackage-print-upload-result",
        JSON.stringify({
          uploadCode: project.uploadCode,
          orderNumber: project.cafe24OrderNumber,
          receivedAt: new Date().toISOString(),
          files: uploadedFiles.map((file) => ({
            name: file.originalFilename,
            size: file.fileSize,
            extension: file.fileExtension,
            uploadedAt: file.uploadedAt
          }))
        })
      );
      const successPath = project.cafe24OrderNumber
        ? `/upload/success?order=${encodeURIComponent(project.cafe24OrderNumber)}`
        : "/upload/success";
      router.push(successPath);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("invalid-")) {
        return;
      }

      setState({
        fieldErrors: {},
        message: error instanceof Error ? error.message : "업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="min-w-0 space-y-8" noValidate>
      {state.message ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.message}</div> : null}

      <fieldset className="min-w-0 rounded-lg border border-line bg-paper p-5 sm:p-6">
        <legend className="px-2 text-base font-bold text-ink">주문 정보</legend>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <TextField id="cafe24OrderNumber" label="Cafe24 주문번호" error={state.fieldErrors.cafe24OrderNumber} />
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              주문번호가 있는 경우 입력해 주세요. 주문번호가 없어도 파일 접수는 가능합니다.
            </p>
          </div>
          <TextField id="productName" label="상품명" error={state.fieldErrors.productName} />
          <TextField id="productOptionText" label="상품 옵션" error={state.fieldErrors.productOptionText} />
        </div>
      </fieldset>

      <fieldset className="min-w-0 rounded-lg border border-line bg-paper p-5 sm:p-6">
        <legend className="px-2 text-base font-bold text-ink">고객 정보</legend>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <TextField id="companyName" label="업체명" error={state.fieldErrors.companyName} />
          <TextField id="customerName" label="업체명 또는 고객명" required error={state.fieldErrors.customerName} />
          <TextField id="contactName" label="담당자명" required error={state.fieldErrors.contactName} />
          <TextField id="phone" label="연락처" required error={state.fieldErrors.phone} />
          <TextField id="email" label="이메일" type="email" error={state.fieldErrors.email} />
          <TextField id="contactMethod" label="기타 연락 방법" error={state.fieldErrors.contactMethod} />
        </div>
      </fieldset>

      <fieldset className="min-w-0 rounded-lg border border-line bg-paper p-5 sm:p-6">
        <legend className="px-2 text-base font-bold text-ink">인쇄파일</legend>
        <div className="mt-5 rounded-lg border border-brass/30 bg-white p-4 text-sm leading-6 text-charcoal">
          <p className="font-semibold text-ink">AI, PDF, ZIP 형식을 권장합니다.</p>
          <p className="mt-1">SVG 파일은 업로드할 수 있으나 제작 전 확인이 필요합니다.</p>
          <p className="mt-1">대용량 파일은 압축(zip) 후 업로드해 주세요.</p>
          <p className="mt-1">
            일반 파일은 최대 {formatFileSize(limits.maxFileSizeBytes)}, ZIP 파일은 최대 {formatFileSize(limits.maxZipSizeBytes)}까지 전송할 수 있습니다.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={
            isDragActive
              ? "mt-5 rounded-lg border-2 border-dashed border-ink bg-white p-6 text-center"
              : "mt-5 rounded-lg border-2 border-dashed border-line bg-white p-6 text-center"
          }
        >
          <input {...getInputProps()} />
          <p className="text-sm font-bold text-ink [overflow-wrap:anywhere]">파일을 이 영역으로 끌어오거나 파일 선택 버튼을 눌러주세요.</p>
          <p className="mt-2 text-xs leading-5 text-neutral-500">허용 형식: {allowedExtensionsLabel}</p>
          <button
            type="button"
            onClick={open}
            className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-ink bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ivory"
          >
            파일 선택
          </button>
        </div>
        <FieldError message={state.fieldErrors.file} />

        {files.length ? (
          <div className="mt-5 overflow-hidden rounded-lg border border-line bg-white">
            <div className="border-b border-line px-4 py-3 text-sm font-bold text-ink">
              선택된 파일 {files.length}개 · 전체 {formatFileSize(selectedTotalBytes)}
            </div>
            <ul className="divide-y divide-line">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.size}-${index}`} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-ink">{file.name}</p>
                    <p className="mt-1 text-xs text-neutral-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="focus-ring w-fit rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-ink transition hover:border-ink"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {hasSvgFile ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            SVG 파일은 제작 전 확인이 필요합니다. 담당자가 파일을 확인한 뒤 필요한 내용을 안내드립니다.
          </div>
        ) : null}
      </fieldset>

      <fieldset className="min-w-0 rounded-lg border border-line bg-paper p-5 sm:p-6">
        <legend className="px-2 text-base font-bold text-ink">요청사항</legend>
        <div className="mt-5">
          <TextareaField
            id="requestMemo"
            label="파일 관련 요청사항"
            helper="예: 칼선은 1번 파일 기준입니다, 로고 위치 확인 부탁드립니다, 최종 인쇄파일입니다."
            error={state.fieldErrors.requestMemo}
          />
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-charcoal">
          <input name="privacyConsent" type="checkbox" className="mt-1 h-4 w-4 rounded border-line text-ink" />
          <span>파일 확인과 안내를 위한 개인정보 수집 및 이용에 동의합니다. 고객 정보, 연락처, 업로드 파일 정보가 함께 저장됩니다.</span>
        </label>
        <FieldError message={state.fieldErrors.privacyConsent} />
      </fieldset>

      {progressMessage ? <p className="rounded-md border border-line bg-white px-4 py-3 text-sm text-charcoal">{progressMessage}</p> : null}

      <div className="flex flex-col gap-3 pb-8 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "업로드 처리 중..." : "인쇄파일 업로드하기"}
        </button>
        <p className="text-sm leading-6 text-neutral-600">
          담당자가 파일을 확인한 뒤 수정이 필요한 부분이 있으면 별도로 안내드립니다.
        </p>
      </div>
    </form>
  );
}
