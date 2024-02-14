import React, { lazy } from "react";
import { AppQuestionDTO, IsaacQuestionProps, ValidatedChoice } from "../../IsaacAppTypes";
import { DOCUMENT_TYPE, REVERSE_GREEK_LETTERS_MAP } from "./";
import { ChoiceDTO, ContentDTO, ContentSummaryDTO } from "../../IsaacApiTypes";
import { selectors, setCurrentAttempt, useAppDispatch, useAppSelector } from "../state";
import { Immutable } from "immer";
const IsaacMultiChoiceQuestion = lazy(() => import("../components/content/IsaacMultiChoiceQuestion"));
const IsaacItemQuestion = lazy(() => import("../components/content/IsaacItemQuestion"));
const IsaacReorderQuestion = lazy(() => import("../components/content/IsaacReorderQuestion"));
const IsaacParsonsQuestion = lazy(() => import("../components/content/IsaacParsonsQuestion"));
const IsaacNumericQuestion = lazy(() => import("../components/content/IsaacNumericQuestion"));
const IsaacStringMatchQuestion = lazy(() => import("../components/content/IsaacStringMatchQuestion"));
const IsaacRegexMatchQuestion = lazy(() => import("../components/content/IsaacRegexMatchQuestion"));
const IsaacFreeTextQuestion = lazy(() => import("../components/content/IsaacFreeTextQuestion"));
const IsaacSymbolicLogicQuestion = lazy(() => import("../components/content/IsaacSymbolicLogicQuestion"));
const IsaacSymbolicQuestion = lazy(() => import("../components/content/IsaacSymbolicQuestion"));
const IsaacClozeQuestion = lazy(() => import("../components/content/IsaacClozeQuestion"));

export const HUMAN_QUESTION_TYPES: { [key: string]: string } = {
  isaacMultiChoiceQuestion: "Multiple choice",
  isaacItemQuestion: "Item",
  isaacReorderQuestion: "Reorder",
  isaacParsonsQuestion: "Parsons",
  isaacNumericQuestion: "Numeric",
  isaacSymbolicQuestion: "Symbolic",
  isaacStringMatchQuestion: "String match",
  isaacFreeTextQuestion: "Free text",
  isaacSymbolicLogicQuestion: "Boolean logic",
  isaacClozeQuestion: "Cloze drag and drop",
  default: "Multiple choice",
};

export const QUESTION_TYPES: {
  [key: string]: React.LazyExoticComponent<({ doc, questionId, readonly }: IsaacQuestionProps<any>) => JSX.Element>;
} = {
  isaacMultiChoiceQuestion: IsaacMultiChoiceQuestion,
  isaacItemQuestion: IsaacItemQuestion,
  isaacReorderQuestion: IsaacReorderQuestion,
  isaacParsonsQuestion: IsaacParsonsQuestion,
  isaacNumericQuestion: IsaacNumericQuestion,
  isaacSymbolicQuestion: IsaacSymbolicQuestion,
  isaacStringMatchQuestion: IsaacStringMatchQuestion,
  isaacRegexMatchQuestion: IsaacRegexMatchQuestion,
  isaacFreeTextQuestion: IsaacFreeTextQuestion,
  isaacSymbolicLogicQuestion: IsaacSymbolicLogicQuestion,
  isaacClozeQuestion: IsaacClozeQuestion,
  default: IsaacMultiChoiceQuestion,
};

export function isQuestion(doc: ContentDTO) {
  return doc.type ? doc.type in QUESTION_TYPES : false;
}

export function selectQuestionPart(questions?: AppQuestionDTO[], questionPartId?: string) {
  return questions?.filter((question) => question.id == questionPartId)[0];
}

// Inequality specific functions

export function sanitiseInequalityState(state: any) {
  const saneState = JSON.parse(JSON.stringify(state));
  if (saneState.result?.tex) {
    saneState.result.tex = saneState.result.tex
      .split("")
      .map((l: string) => (REVERSE_GREEK_LETTERS_MAP[l] ? "\\" + REVERSE_GREEK_LETTERS_MAP[l] : l))
      .join("");
  }
  if (saneState.result?.python) {
    saneState.result.python = saneState.result.python
      .split("")
      .map((l: string) => REVERSE_GREEK_LETTERS_MAP[l] || l)
      .join("");
  }
  if (saneState.result?.uniqueSymbols) {
    saneState.result.uniqueSymbols = saneState.result.uniqueSymbols
      .split("")
      .map((l: string) => REVERSE_GREEK_LETTERS_MAP[l] || l)
      .join("");
  }
  if (saneState.symbols) {
    for (const symbol of saneState.symbols) {
      if (symbol.expression.latex) {
        symbol.expression.latex = symbol.expression.latex
          .split("")
          .map((l: string) => (REVERSE_GREEK_LETTERS_MAP[l] ? "\\" + REVERSE_GREEK_LETTERS_MAP[l] : l))
          .join("");
      }
      if (symbol.expression.python) {
        symbol.expression.python = symbol.expression.python
          .split("")
          .map((l: string) => REVERSE_GREEK_LETTERS_MAP[l] || l)
          .join("");
      }
    }
  }
  return saneState;
}

export const parsePseudoSymbolicAvailableSymbols = (availableSymbols?: string[]) => {
  if (!availableSymbols) return;
  const theseSymbols = availableSymbols.slice(0).map((s) => s.trim());
  let i = 0;
  while (i < theseSymbols.length) {
    if (theseSymbols[i] === "_trigs") {
      theseSymbols.splice(i, 1, "cos()", "sin()", "tan()");
      i += 3;
    } else if (theseSymbols[i] === "_1/trigs") {
      theseSymbols.splice(i, 1, "cosec()", "sec()", "cot()");
      i += 3;
    } else if (theseSymbols[i] === "_inv_trigs") {
      theseSymbols.splice(i, 1, "arccos()", "arcsin()", "arctan()");
      i += 3;
    } else if (theseSymbols[i] === "_inv_1/trigs") {
      theseSymbols.splice(i, 1, "arccosec()", "arcsec()", "arccot()");
      i += 3;
    } else if (theseSymbols[i] === "_hyp_trigs") {
      theseSymbols.splice(i, 1, "cosh()", "sinh()", "tanh()", "cosech()", "sech()", "coth()");
      i += 6;
    } else if (theseSymbols[i] === "_inv_hyp_trigs") {
      theseSymbols.splice(i, 1, "arccosh()", "arcsinh()", "arctanh()", "arccosech()", "arcsech()", "arccoth()");
      i += 6;
    } else if (theseSymbols[i] === "_logs") {
      theseSymbols.splice(i, 1, "log()", "ln()");
      i += 2;
    } else if (theseSymbols[i] === "_no_alphabet") {
      theseSymbols.splice(i, 1);
    } else {
      i += 1;
    }
  }
  return theseSymbols;
};

/**
 * Essentially a useState for the current question attempt - used in all question components.
 * @param questionId  id of the question to return the current attempt of
 */
export function useCurrentQuestionAttempt<T extends ChoiceDTO>(questionId: string) {
  const dispatch = useAppDispatch();
  const pageQuestions = useAppSelector(selectors.questions.getQuestions);
  const questionPart = selectQuestionPart(pageQuestions, questionId);
  return {
    currentAttempt: questionPart?.currentAttempt as Immutable<T> | undefined,
    dispatchSetCurrentAttempt: (attempt: Immutable<T | ValidatedChoice<T>>) =>
      dispatch(setCurrentAttempt(questionId, attempt)),
    questionPart: questionPart,
  };
}
