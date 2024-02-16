import { Immutable } from "immer";
import {
  ChoiceQuestionDTO,
  ContentBaseDTO,
  ContentDTO,
  EventBookingDTO,
  QuestionValidationResponseDTO,
  UserSummaryWithEmailAddressAndGenderDTO,
} from "./IsaacApiTypesGenerated";

export interface AnsweredQuestionsByDate {
  [date: string]: number;
}

export interface TestCaseDTO extends QuestionValidationResponseDTO {
  expected?: boolean;
}

export interface TestQuestionDTO extends ChoiceQuestionDTO {
  testCases?: TestCaseDTO[];
}

// TODO move hiding past bast attempts into the backend for more flexibility
// We use `null` to mean "best attempt hidden" so that all checks for whether `bestAttempt` is defined automatically
// return false if it's hidden, without having to wrap all of these checks in an `isDefinedOrHidden()` predicate.
// This latter approach would be more principled however. As it is, we make it clear at the type level that BestAttemptHidden
// is "null with meaning" which should be fine for now, especially if we move best-attempt-hiding to the backend.
export type BestAttemptHidden = null;
export const BEST_ATTEMPT_HIDDEN: BestAttemptHidden = null;
export interface QuestionDTO extends ContentDTO {
  hints?: ContentBaseDTO[];
  bestAttempt?: Immutable<QuestionValidationResponseDTO> | BestAttemptHidden;
}

export interface DetailedEventBookingDTO extends EventBookingDTO {
  additionalInformation?: { [index: string]: string };
  userBooked?: UserSummaryWithEmailAddressAndGenderDTO;
}

export interface TOTPSharedSecret {
  userId: number;
  sharedSecret: string;
  created: EpochTimeStamp;
}

// temporary changes to the MisuseStatisticDTO until typescript generator plugin is correctly giving required properties
export interface MisuseStatisticDTO {
  agentIdentifier: string;
  eventType: string;
  isMisused: boolean;
  isOverSoftThreshold: boolean;
  lastEventTimestamp?: number;
  currentCounter: number;
}
