import type { RequestHandler } from "express";
import { z } from "zod";

import { CurrencyRateUnavailableError } from "../services/currency.errors.js";
import {
  ExpenseNotFoundError,
  ExpenseService,
  ExpenseValidationError,
} from "../services/expense.service.js";
import type { UpdateExpenseInput } from "../services/expense.service.types.js";
import { TextParserError } from "../services/textParser.service.js";

const quickAddSchema = z.object({
  input: z.string().trim().min(1).max(500),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const expenseIdSchema = z.string().uuid();

const updateExpenseSchema = z
  .object({
    amount: z.number().positive().max(999_999_999_999.99).optional(),
    description: z.string().trim().min(1).max(500).optional(),
    transactionDate: z.coerce.date().optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one expense field is required.",
  });

export class ExpenseController {
  public constructor(private readonly expenseService: ExpenseService) {}

  public quickAdd: RequestHandler = async (request, response, next) => {
    const parsedBody = quickAddSchema.safeParse(request.body);

    if (!request.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!parsedBody.success) {
      response.status(400).json({ error: "A non-empty input string is required." });
      return;
    }

    try {
      const expense = await this.expenseService.quickAdd(request.user.id, parsedBody.data.input);
      response.status(201).json({ expense });
    } catch (error: unknown) {
      this.handleServiceError(error, response, next);
    }
  };

  public list: RequestHandler = async (request, response, next) => {
    const pagination = paginationSchema.safeParse(request.query);

    if (!request.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!pagination.success) {
      response.status(400).json({ error: "Pagination parameters are invalid." });
      return;
    }

    try {
      const result = await this.expenseService.list(
        request.user.id,
        pagination.data.page,
        pagination.data.limit,
      );
      response.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  };

  public update: RequestHandler = async (request, response, next) => {
    const expenseId = expenseIdSchema.safeParse(request.params.id);
    const parsedBody = updateExpenseSchema.safeParse(request.body);

    if (!request.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!expenseId.success || !parsedBody.success) {
      response.status(400).json({ error: "Expense id or update fields are invalid." });
      return;
    }

    try {
      const updateInput: UpdateExpenseInput = {};

      if (parsedBody.data.amount !== undefined) {
        updateInput.amount = parsedBody.data.amount;
      }

      if (parsedBody.data.description !== undefined) {
        updateInput.description = parsedBody.data.description;
      }

      if (parsedBody.data.transactionDate !== undefined) {
        updateInput.transactionDate = parsedBody.data.transactionDate;
      }

      const expense = await this.expenseService.update(
        request.user.id,
        expenseId.data,
        updateInput,
      );
      response.status(200).json({ expense });
    } catch (error: unknown) {
      this.handleServiceError(error, response, next);
    }
  };

  public delete: RequestHandler = async (request, response, next) => {
    const expenseId = expenseIdSchema.safeParse(request.params.id);

    if (!request.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!expenseId.success) {
      response.status(400).json({ error: "Expense id is invalid." });
      return;
    }

    try {
      await this.expenseService.delete(request.user.id, expenseId.data);
      response.status(204).send();
    } catch (error: unknown) {
      this.handleServiceError(error, response, next);
    }
  };

  private handleServiceError(
    error: unknown,
    response: Parameters<RequestHandler>[1],
    next: Parameters<RequestHandler>[2],
  ): void {
    if (error instanceof ExpenseNotFoundError) {
      response.status(404).json({ error: error.message });
      return;
    }

    if (error instanceof ExpenseValidationError || error instanceof TextParserError) {
      response.status(400).json({ error: error.message });
      return;
    }

    if (error instanceof CurrencyRateUnavailableError) {
      response.status(502).json({ error: error.message });
      return;
    }

    next(error);
  }
}
