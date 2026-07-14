import "server-only";

import {
  CatalogUnavailableError,
  InvalidQueryError,
  UnschedulableCoursesError,
  type FieldIssue,
} from "../contracts/errors";

interface BackendError {
  error?: { message?: string; details?: unknown };
}

/** 존재하지 않는 리소스(404). `CatalogUnavailableError`와 달리 장애가 아니라 "없음"을 뜻한다. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

function baseUrl(): string {
  const url = process.env.API_BASE_URL;
  if (!url) throw new CatalogUnavailableError("API_BASE_URL이 설정되지 않았습니다.");
  return url.replace(/\/$/, "");
}

function isFieldIssues(details: unknown): details is FieldIssue[] {
  return (
    Array.isArray(details) &&
    details.every(
      (item) =>
        typeof item === "object" && item !== null && "field" in item && "message" in item,
    )
  );
}

function isCourseRefs(details: unknown): details is Array<{ id: string; name: string }> {
  return (
    Array.isArray(details) &&
    details.every(
      (item) => typeof item === "object" && item !== null && "id" in item && "name" in item,
    )
  );
}

/** 백엔드의 에러 응답을 도메인 에러로 바꾼다. 백엔드 스키마는 이 폴더 밖으로 새어나가지 않는다. */
async function toDomainError(response: Response): Promise<Error> {
  let body: BackendError = {};
  try {
    body = (await response.json()) as BackendError;
  } catch {
    return new CatalogUnavailableError("백엔드 응답을 읽을 수 없습니다.");
  }

  const message = body.error?.message ?? "요청을 처리하지 못했습니다.";
  const details = body.error?.details;

  if (response.status === 404) {
    return new NotFoundError(message);
  }
  if (response.status === 400 && isCourseRefs(details)) {
    return new UnschedulableCoursesError(message, details);
  }
  if (response.status === 400) {
    return new InvalidQueryError(message, isFieldIssues(details) ? details : []);
  }
  return new CatalogUnavailableError(message);
}

export async function backendGet<T>(path: string, revalidate: number): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, { next: { revalidate } });
  } catch {
    throw new CatalogUnavailableError("백엔드에 연결하지 못했습니다.");
  }

  if (!response.ok) throw await toDomainError(response);
  return (await response.json()) as T;
}

export async function backendPost<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    throw new CatalogUnavailableError("백엔드에 연결하지 못했습니다.");
  }

  if (!response.ok) throw await toDomainError(response);
  return (await response.json()) as T;
}
