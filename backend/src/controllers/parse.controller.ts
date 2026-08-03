import type { RequestHandler } from "express";
import { z } from "zod";

import {
  TextParserError,
  textParserService,
} from "../services/textParser.service.js";

const parseInputSchema = z.object({
  input: z.string().trim().min(1).max(500),
});

export const parseController: RequestHandler = (request, response, next) => {
  const parsedBody = parseInputSchema.safeParse(request.body);

  if (!parsedBody.success) {
    response.status(400).json({
      error: "Request body must contain a non-empty input string of at most 500 characters.",
    });
    return;
  }

  try {
    response.status(200).json(textParserService.parse(parsedBody.data.input));
  } catch (error: unknown) {
    if (error instanceof TextParserError) {
      response.status(400).json({ error: error.message });
      return;
    }

    next(error);
  }
};
