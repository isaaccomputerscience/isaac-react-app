import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  AppState,
  clearQuestionSearch,
  closeActiveModal,
  searchQuestions,
  useAppDispatch,
  useAppSelector,
} from "../../../state";
import { Col, Input, Label, Row, Table } from "reactstrap";
import { SortableTableHeader } from "../SortableTableHeader";
import { debounce, isEqual } from "lodash";
import Select, { MultiValue } from "react-select";
import {
  tags,
  DIFFICULTY_ICON_ITEM_OPTIONS,
  EXAM_BOARD_NULL_OPTIONS,
  getFilteredExamBoardOptions,
  getFilteredStageOptions,
  groupTagSelectionsByParent,
  Item,
  logEvent,
  searchResultIsPublic,
  selectOnChange,
  SortOrder,
  sortQuestions,
  STAGE,
  useUserContext,
} from "../../../services";
import { ContentSummary } from "../../../../IsaacAppTypes";
import { AudienceContext, Difficulty, ExamBoard } from "../../../../IsaacApiTypes";
import { GroupBase } from "react-select/dist/declarations/src/types";
import { Loading } from "../../handlers/IsaacSpinner";

// Immediately load GameboardBuilderRow, but allow splitting
const importGameboardBuilderRow = import("../GameboardBuilderRow");
const GameboardBuilderRow = lazy(() => importGameboardBuilderRow);

const selectStyle = {
  className: "basic-multi-select",
  classNamePrefix: "select",
  menuPortalTarget: document.body,
  styles: { menuPortal: (base: object) => ({ ...base, zIndex: 9999 }) },
};

interface QuestionSearchModalProps {
  originalSelectedQuestions: Map<string, ContentSummary>;
  setOriginalSelectedQuestions: (m: Map<string, ContentSummary>) => void;
  originalQuestionOrder: string[];
  setOriginalQuestionOrder: (a: string[]) => void;
  eventLog: object[];
}
export const QuestionSearchModal = ({
  originalSelectedQuestions,
  setOriginalSelectedQuestions,
  originalQuestionOrder,
  setOriginalQuestionOrder,
  eventLog,
}: QuestionSearchModalProps) => {
  const dispatch = useAppDispatch();
  const userContext = useUserContext();

  const [searchTopics, setSearchTopics] = useState<string[]>([]);
  const [searchQuestionName, setSearchQuestionName] = useState("");
  const [searchStages, setSearchStages] = useState<STAGE[]>([]);
  const [searchDifficulties, setSearchDifficulties] = useState<Difficulty[]>([]);
  const [searchExamBoards, setSearchExamBoards] = useState<ExamBoard[]>([]);
  useEffect(
    function populateExamBoardFromUserContext() {
      if (!EXAM_BOARD_NULL_OPTIONS.has(userContext.examBoard)) setSearchExamBoards([userContext.examBoard]);
    },
    [userContext.examBoard],
  );

  const searchBook: string[] = useMemo(() => [], []);
  const isBookSearch = searchBook.length > 0;

  const creationContext: AudienceContext = !isBookSearch
    ? {
        stage: searchStages.length > 0 ? searchStages : undefined,
        difficulty: searchDifficulties.length > 0 ? searchDifficulties : undefined,
        examBoard: searchExamBoards.length > 0 ? searchExamBoards : undefined,
      }
    : {};

  const [questionsSort, setQuestionsSort] = useState<Record<string, SortOrder>>({ difficulty: SortOrder.ASC });
  const [selectedQuestions, setSelectedQuestions] = useState<Map<string, ContentSummary>>(
    new Map(originalSelectedQuestions),
  );
  const [questionOrder, setQuestionOrder] = useState([...originalQuestionOrder]);

  const questions = useAppSelector((state: AppState) => state && state.questionSearchResult);
  const user = useAppSelector((state: AppState) => state && state.user);

  const searchDebounce = useCallback(
    debounce(
      (
        searchString: string,
        topics: string[],
        examBoards: string[],
        book: string[],
        stages: string[],
        difficulties: string[],
        startIndex: number,
      ) => {
        const isBookSearch = book.length > 0; // Tasty.
        if ([searchString, topics, book, stages, difficulties, examBoards].every((v) => v.length === 0)) {
          // Nothing to search for
          dispatch(clearQuestionSearch);
          return;
        }

        const tags = (
          isBookSearch ? book : [...[topics].map((tags) => tags.join(" "))].filter((query) => query != "")
        ).join(" ");
        const examBoardString = examBoards.join(",");

        dispatch(
          searchQuestions({
            searchString: searchString,
            tags,
            stages: stages.join(",") || undefined,
            difficulties: difficulties.join(",") || undefined,
            examBoards: examBoardString,
            startIndex,
            limit: 300,
          }),
        );

        logEvent(eventLog, "SEARCH_QUESTIONS", {
          searchString,
          topics,
          examBoards,
          book,
          stages,
          difficulties,
          startIndex,
        });
      },
      250,
    ),
    [],
  );

  const sortableTableHeaderUpdateState =
    (
      sortState: { [s: string]: string },
      setSortState: React.Dispatch<React.SetStateAction<NonNullable<unknown>>>,
      key: string,
    ) =>
    (order: string) => {
      const newSortState = { ...sortState };
      newSortState[key] = order;
      setSortState(newSortState);
    };

  const tagOptions: { options: Item<string>[]; label: string }[] =
    tags.allSubcategoryTags.map(groupTagSelectionsByParent);
  const groupBaseTagOptions: GroupBase<Item<string>>[] = tagOptions;

  useEffect(() => {
    searchDebounce(searchQuestionName, searchTopics, searchExamBoards, searchBook, searchStages, searchDifficulties, 0);
  }, [
    searchDebounce,
    searchQuestionName,
    searchTopics,
    searchExamBoards,
    searchBook,
    searchStages,
    searchDifficulties,
  ]);

  const sortedQuestions = useMemo(() => {
    return (
      questions &&
      sortQuestions(
        isBookSearch ? { title: SortOrder.ASC } : questionsSort,
        creationContext,
      )(
        questions.filter((question) => {
          const qIsPublic = searchResultIsPublic(question, user);
          if (isBookSearch) return qIsPublic;
          const qTopicsMatch =
            searchTopics.length === 0 ||
            (question.tags && question.tags.filter((tag) => searchTopics.includes(tag)).length > 0);

          return qIsPublic && qTopicsMatch;
        }),
      )
    );
  }, [questions, user, searchTopics, isBookSearch, questionsSort, creationContext]);

  const addSelectionsRow = (
    <div className="d-lg-flex align-items-baseline">
      <div className="flex-grow-1 mb-1">
        <strong className={selectedQuestions.size > 10 ? "text-danger" : ""}>
          {`${selectedQuestions.size} question${selectedQuestions.size !== 1 ? "s" : ""} selected`}
        </strong>
      </div>
      <div>
        <Input
          type="button"
          value="Add selections to gameboard"
          disabled={isEqual(new Set(originalSelectedQuestions.keys()), new Set(selectedQuestions.keys()))}
          className={"btn btn-block btn-secondary border-0"}
          onClick={() => {
            setOriginalSelectedQuestions(selectedQuestions);
            setOriginalQuestionOrder(questionOrder);
            dispatch(closeActiveModal());
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="mb-4">
      <Row>
        <Col lg={12} className={`text-wrap mt-2 ${isBookSearch ? "d-none" : ""}`}>
          <Label htmlFor="question-search-topic">Topic</Label>
          <Select
            inputId="question-search-topic"
            isMulti
            placeholder="Any"
            {...selectStyle}
            options={groupBaseTagOptions}
            onChange={(x: readonly Item<string>[], _) => {
              selectOnChange(setSearchTopics, true)(x);
            }}
          />
        </Col>
      </Row>
      <Row className={isBookSearch ? "d-none" : ""}>
        <Col lg={6} className={`text-wrap my-2`}>
          <Label htmlFor="question-search-stage">Stage</Label>
          <Select
            inputId="question-search-stage"
            isClearable
            isMulti
            placeholder="Any"
            {...selectStyle}
            options={getFilteredStageOptions()}
            onChange={selectOnChange(setSearchStages, true)}
          />
        </Col>
        <Col lg={6} className={`text-wrap my-2 ${isBookSearch ? "d-none" : ""}`}>
          <Label htmlFor="question-search-difficulty">Difficulty</Label>
          <Select
            inputId="question-search-difficulty"
            isClearable
            isMulti
            placeholder="Any"
            {...selectStyle}
            options={DIFFICULTY_ICON_ITEM_OPTIONS}
            onChange={selectOnChange(setSearchDifficulties, true)}
          />
        </Col>
        <Col lg={6} className={`text-wrap my-2`}>
          <Label htmlFor="question-search-exam-board">Exam Board</Label>
          <Select
            inputId="question-search-exam-board"
            isClearable
            isMulti
            placeholder="Any"
            {...selectStyle}
            value={getFilteredExamBoardOptions({ byStages: searchStages }).filter((o) =>
              searchExamBoards.includes(o.value),
            )}
            options={getFilteredExamBoardOptions({ byStages: searchStages })}
            onChange={(s: MultiValue<Item<ExamBoard>>) => selectOnChange(setSearchExamBoards, true)(s)}
          />
        </Col>
      </Row>
      <Row></Row>
      <Row>
        <Col lg={12} className="text-wrap mt-2">
          <Label htmlFor="question-search-title">Search</Label>
          <Input
            id="question-search-title"
            type="text"
            placeholder="e.g. Creating an AST"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuestionName(e.target.value);
            }}
          />
        </Col>
      </Row>
      <div className="mt-4">{addSelectionsRow}</div>
      <Suspense fallback={<Loading />}>
        <Table bordered responsive className="mt-4">
          <thead>
            <tr>
              <th className="w-5"> </th>
              <SortableTableHeader
                className="w-40"
                title="Question title"
                updateState={sortableTableHeaderUpdateState(questionsSort, setQuestionsSort, "title")}
                enabled={!isBookSearch}
              />
              <th className="w-25">Topic</th>
              <th className="w-15">Stage</th>
              <th className="w-10">Difficulty</th>
              <th className="w-5">Exam boards</th>
            </tr>
          </thead>
          <tbody>
            {sortedQuestions?.map((question) => (
              <GameboardBuilderRow
                key={`question-search-modal-row-${question.id}`}
                question={question}
                selectedQuestions={selectedQuestions}
                setSelectedQuestions={setSelectedQuestions}
                questionOrder={questionOrder}
                setQuestionOrder={setQuestionOrder}
                creationContext={creationContext}
              />
            ))}
          </tbody>
        </Table>
      </Suspense>
      {questions && questions.length > 5 && <div className="mt-2">{addSelectionsRow}</div>}
    </div>
  );
};
