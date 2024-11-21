// src/common/utils/validation.ts
import { z } from "zod";

import { ValidationError } from "../errors/domain-error";
import { Result } from "../types/result";

export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Result<T, ValidationError> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: new ValidationError(error.message),
      };
    }
    return {
      success: false,
      error: new ValidationError("Unknown validation error"),
    };
  }
}
