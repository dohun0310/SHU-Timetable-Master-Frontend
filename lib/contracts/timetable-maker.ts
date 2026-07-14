import type { Constraints, Timetable } from "../timetable/types";

export interface BasketRequest {
  label: string;
  required: boolean;
  courseIds: string[];
}

export interface GenerateRequest {
  baskets: BasketRequest[];
  constraints: Constraints;
  limit?: number;
}

export interface GenerateResult {
  count: number;
  truncated: boolean;
  timetables: Timetable[];
}

export interface TimetableMaker {
  generate(request: GenerateRequest): Promise<GenerateResult>;
}
