export interface FieldIssue {
  field: string;
  message: string;
}

/** 백엔드가 400으로 거절한 검색 조건. 어떤 필터가 틀렸는지 알려준다. */
export class InvalidQueryError extends Error {
  constructor(
    message: string,
    readonly issues: FieldIssue[],
  ) {
    super(message);
    this.name = "InvalidQueryError";
  }
}

/** 강의시간을 온전히 알 수 없어 자동 조합에 넣을 수 없는 강좌가 있을 때. */
export class UnschedulableCoursesError extends Error {
  constructor(
    message: string,
    readonly courses: Array<{ id: string; name: string }>,
  ) {
    super(message);
    this.name = "UnschedulableCoursesError";
  }
}

/** 백엔드에 닿지 못했거나 5xx. 이때는 저장본을 만료 판정하지 않는다. */
export class CatalogUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogUnavailableError";
  }
}
