import "server-only";

import type {
  GenerateRequest,
  GenerateResult,
  TimetableMaker,
} from "../contracts/timetable-maker";
import { backendPost } from "./backend-client";

function toPayload(request: GenerateRequest): unknown {
  const { constraints } = request;
  const credits =
    constraints.minCredits === null && constraints.maxCredits === null
      ? undefined
      : {
          ...(constraints.minCredits !== null ? { min: constraints.minCredits } : {}),
          ...(constraints.maxCredits !== null ? { max: constraints.maxCredits } : {}),
        };

  return {
    baskets: request.baskets.map((basket) => ({
      label: basket.label,
      required: basket.required,
      courseIds: basket.courseIds,
    })),
    constraints: {
      ...(constraints.freeDays.length > 0 ? { freeDays: constraints.freeDays } : {}),
      ...(constraints.avoidBefore ? { avoidBefore: constraints.avoidBefore } : {}),
      ...(constraints.avoidAfter ? { avoidAfter: constraints.avoidAfter } : {}),
      ...(credits ? { credits } : {}),
    },
    ...(request.limit ? { limit: request.limit } : {}),
  };
}

export class HttpTimetableMaker implements TimetableMaker {
  async generate(request: GenerateRequest): Promise<GenerateResult> {
    return backendPost<GenerateResult>("/api/timetables/generate", toPayload(request));
  }
}
