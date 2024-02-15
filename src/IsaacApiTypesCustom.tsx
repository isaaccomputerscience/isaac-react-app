/* eslint-disable @typescript-eslint/no-empty-interface */
/* tslint:disable */

import { ChoiceQuestionDTO, QuestionValidationResponseDTO } from "./IsaacApiTypesGenerated";

export interface AnsweredQuestionsByDate {
  [date: string]: number;
}

export interface TestCaseDTO extends QuestionValidationResponseDTO {
  expected?: boolean;
}

export interface TestQuestionDTO extends ChoiceQuestionDTO {
  testCases?: TestCaseDTO[];
}
