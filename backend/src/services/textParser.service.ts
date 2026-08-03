import type {
  ParsedExpenseInput,
  SupportedCurrency,
} from "./textParser.service.types.js";

const amountPattern = /\d+(?:[.,]\d+)*/u;
const currencyPattern = /₺|\$|€|£|\b(?:TRY|TL|USD|EUR|GBP)\b/iu;
const allCurrencyPatterns = /₺|\$|€|£|\b(?:TRY|TL|USD|EUR|GBP)\b/giu;

const currencyByIndicator: Readonly<Record<string, SupportedCurrency>> = {
  "₺": "TRY",
  TL: "TRY",
  TRY: "TRY",
  $: "USD",
  USD: "USD",
  "€": "EUR",
  EUR: "EUR",
  "£": "GBP",
  GBP: "GBP",
};

const turkishWeekdayByName: Readonly<Record<string, number>> = {
  pazar: 0,
  pazartesi: 1,
  salı: 2,
  çarşamba: 3,
  perşembe: 4,
  cuma: 5,
  cumartesi: 6,
};

const englishWeekdayByName: Readonly<Record<string, number>> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const relativeDayPattern = /bugün|dün|today|yesterday/iu;
const previousTurkishWeekdayPattern =
  /geçen\s+(pazar|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi)/iu;
const previousEnglishWeekdayPattern =
  /last\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/iu;

export class TextParserError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "TextParserError";
  }
}

const parseLocalizedAmount = (value: string): number => {
  const groups = value.split(/[.,]/u);

  if (groups.length === 1) {
    return Number(value);
  }

  const separators = [...value].filter((character) => character === "." || character === ",");
  const usesBothSeparators = separators.includes(".") && separators.includes(",");
  // Repeated three-digit groups represent thousands, regardless of whether "." or "," is used.
  const usesThousandsGrouping = groups.slice(1).every((group) => group.length === 3);

  if (!usesBothSeparators && usesThousandsGrouping) {
    return Number(groups.join(""));
  }

  // For mixed or irregular separators, the final separator is treated as the decimal separator.
  const fractionalDigits = groups.at(-1)?.length ?? 0;
  const digitsOnly = groups.join("");
  const decimalValue = `${digitsOnly.slice(0, -fractionalDigits)}.${digitsOnly.slice(-fractionalDigits)}`;

  return Number(decimalValue);
};

const resolveCurrency = (input: string): SupportedCurrency => {
  const indicator = input.match(currencyPattern)?.[0];

  if (!indicator) {
    return "TRY";
  }

  return currencyByIndicator[indicator.toLocaleUpperCase("tr-TR")] ?? "TRY";
};

const previousWeekday = (referenceDate: Date, targetDay: number): Date => {
  const date = new Date(referenceDate);
  // "Geçen" always points backward, including seven days when today is the requested weekday.
  const elapsedDays = (date.getDay() - targetDay + 7) % 7 || 7;
  date.setDate(date.getDate() - elapsedDays);
  return date;
};

const resolveTransactionDate = (input: string, referenceDate: Date): Date => {
  const date = new Date(referenceDate);
  const normalizedInput = input.toLocaleLowerCase("tr-TR");

  if (/dün|yesterday/iu.test(normalizedInput)) {
    date.setDate(date.getDate() - 1);
    return date;
  }

  const turkishWeekday = normalizedInput.match(previousTurkishWeekdayPattern)?.[1];
  if (turkishWeekday) {
    return previousWeekday(date, turkishWeekdayByName[turkishWeekday] ?? date.getDay());
  }

  const englishWeekday = normalizedInput.match(previousEnglishWeekdayPattern)?.[1];
  if (englishWeekday) {
    return previousWeekday(date, englishWeekdayByName[englishWeekday] ?? date.getDay());
  }

  return date;
};

const cleanDescription = (input: string, matchedAmount: string): string => {
  const description = input
    .replace(matchedAmount, " ")
    .replace(allCurrencyPatterns, " ")
    .replace(previousTurkishWeekdayPattern, " ")
    .replace(previousEnglishWeekdayPattern, " ")
    .replace(relativeDayPattern, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return description || "Diğer";
};

export class TextParserService {
  public parse(input: string, referenceDate: Date = new Date()): ParsedExpenseInput {
    const normalizedInput = input.trim();

    if (!normalizedInput) {
      throw new TextParserError("Input cannot be empty.");
    }

    const matchedAmount = normalizedInput.match(amountPattern)?.[0];

    if (!matchedAmount) {
      throw new TextParserError("Input must include an amount.");
    }

    const amount = parseLocalizedAmount(matchedAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new TextParserError("Amount must be a positive number.");
    }

    return {
      amount,
      currency: resolveCurrency(normalizedInput),
      description: cleanDescription(normalizedInput, matchedAmount),
      transactionDate: resolveTransactionDate(normalizedInput, referenceDate),
    };
  }
}

export const textParserService = new TextParserService();
