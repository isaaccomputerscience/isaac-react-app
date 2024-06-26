import React, { useEffect, useState } from "react";
import {
  isaacApi,
  logAction,
  saveGameboard,
  selectors,
  setAssignBoardPath,
  useAppDispatch,
  useAppSelector,
} from "../../state";
import { Link } from "react-router-dom";
import { Button, Col, Container, ListGroup, ListGroupItem, Row } from "reactstrap";
import { GameboardDTO, GameboardItem, IsaacWildcard } from "../../../IsaacApiTypes";
import { TitleAndBreadcrumb } from "../elements/TitleAndBreadcrumb";
import {
  AUDIENCE_DISPLAY_FIELDS,
  determineAudienceViews,
  filterAudienceViewsByProperties,
  isDefined,
  isFound,
  isTeacherOrAbove,
  isTutorOrAbove,
  TAG_ID,
  TAG_LEVEL,
  tags,
} from "../../services";
import { Redirect, useLocation } from "react-router";
import queryString from "query-string";
import { StageAndDifficultySummaryIcons } from "../elements/StageAndDifficultySummaryIcons";
import { Markup } from "../elements/markup";
import { skipToken } from "@reduxjs/toolkit/query";
import { ShowLoadingQuery } from "../handlers/ShowLoadingQuery";

function extractFilterQueryString(gameboard: GameboardDTO): string {
  const csvQuery: { [key: string]: string } = {};
  if (gameboard.gameFilter) {
    Object.entries(gameboard.gameFilter).forEach(([key, values]) => {
      csvQuery[key] = values.join(",");
    });
  }
  return queryString.stringify(csvQuery, { encode: false });
}

const GameboardItemComponent = ({ gameboard, question }: { gameboard: GameboardDTO; question: GameboardItem }) => {
  let itemClasses = "p-3 content-summary-link text-info bg-transparent";
  const itemSubject = tags.getSpecifiedTag(TAG_LEVEL.subject, question.tags as TAG_ID[]);
  let iconHref = "/assets/question.svg";
  let message = "";
  const messageClasses = "";

  switch (question.state) {
    case "PERFECT":
      itemClasses += " bg-success";
      message = "perfect!";
      iconHref = "/assets/tick-rp.svg";
      break;
    case "PASSED":
    case "IN_PROGRESS":
      message = "in progress";
      iconHref = "/assets/incomplete.svg";
      break;
    case "FAILED":
      message = "try again!";
      iconHref = "/assets/cross-rp.svg";
      break;
  }

  const questionTags = tags.getByIdsAsHierarchy((question.tags || []) as TAG_ID[]).filter((t, i) => i !== 0); // CS always has Computer Science at the top level

  return (
    <ListGroupItem key={question.id} className={itemClasses}>
      <Link to={`/questions/${question.id}?board=${gameboard.id}`} className="align-items-center">
        <span>
          <img src={iconHref} alt="" />
        </span>
        <div className={`d-md-flex flex-fill`}>
          {/* TODO CP shouldn't the subject colour here depend on the contents/tags of the gameboard? */}
          <div className={"flex-grow-1 " + itemSubject?.id}>
            <Markup encoding={"latex"}>{question.title}</Markup>
            {message && <span className={"gameboard-item-message" + messageClasses}>{message}</span>}
            {questionTags && (
              <div className="hierarchy-tags">
                {questionTags.map((tag) => (
                  <span className="hierarchy-tag" key={tag.id}>
                    {tag.title}
                  </span>
                ))}
              </div>
            )}
          </div>

          {question.audience && (
            <StageAndDifficultySummaryIcons
              audienceViews={filterAudienceViewsByProperties(
                determineAudienceViews(question.audience, question.creationContext),
                AUDIENCE_DISPLAY_FIELDS,
              )}
            />
          )}
        </div>
      </Link>
    </ListGroupItem>
  );
};

export const Wildcard = ({ wildcard }: { wildcard: IsaacWildcard }) => {
  const itemClasses = "p-3 content-summary-link text-info bg-transparent";
  const icon = <img src="/assets/wildcard.svg" alt="Optional extra information icon" />;
  return (
    <ListGroupItem key={wildcard.id} className={itemClasses}>
      <a href={wildcard.url} className="align-items-center">
        <span className="gameboard-item-icon">{icon}</span>
        <div className={"flex-grow-1"}>
          <span>{wildcard.title}</span>
          {wildcard.description && (
            <div className="hierarchy-tags">
              <span className="hierarchy-tag">{wildcard.description}</span>
            </div>
          )}
        </div>
      </a>
    </ListGroupItem>
  );
};

export const GameboardViewerInner = ({ gameboard }: { gameboard: GameboardDTO }) => {
  return (
    <ListGroup className="link-list list-group-links list-gameboard">
      {gameboard.contents?.map((q) => <GameboardItemComponent key={q.id} gameboard={gameboard} question={q} />)}
    </ListGroup>
  );
};

export const GameboardViewer = ({ gameboard, className }: { gameboard: GameboardDTO; className?: string }) => (
  <Row className={className}>
    <Col lg={{ size: 10, offset: 1 }}>
      <GameboardViewerInner gameboard={gameboard} />
    </Col>
  </Row>
);

const GameboardDetails = ({ gameboard }: { gameboard: GameboardDTO }) => {
  const dispatch = useAppDispatch();
  const [gameboardTitle, setGameboardTitle] = useState<string | undefined>();

  const user = useAppSelector(selectors.user.orNull);

  const isGameboardOwner = (user?.loggedIn && isTeacherOrAbove(user) && gameboard?.ownerUserId === user.id) ?? false;

  const changeGameboardTitle = (newTitle: string) => {
    if (gameboard?.id && user?.loggedIn) {
      dispatch(
        saveGameboard({
          boardId: gameboard.id,
          user: user,
          boardTitle: newTitle,
        }),
      ).then(() => {
        setGameboardTitle(newTitle);
      });
    }
  };

  useEffect(() => {
    if (gameboard) {
      setGameboardTitle(gameboard.title);
    }
  }, [gameboard]);

  // Show filter
  const { filter } = queryString.parse(location.search);
  let showFilter = false;
  if (filter) {
    const filterValue = filter instanceof Array ? filter[0] : filter;
    showFilter = isDefined(filterValue) && filterValue.toLowerCase() === "true";
  }

  if (showFilter) {
    return <Redirect to={`/gameboards/new?${extractFilterQueryString(gameboard)}#${gameboard.id}`} />;
  }
  return (
    <>
      <TitleAndBreadcrumb
        onTitleEdit={isGameboardOwner ? changeGameboardTitle : undefined}
        currentPageTitle={gameboardTitle ?? "Filter Generated Gameboard"}
      />
      <GameboardViewer gameboard={gameboard} className="mt-4 mt-lg-5" />
      {user && isTutorOrAbove(user) ? (
        <Row className="col-8 offset-2">
          <Col className="mt-4">
            <Button tag={Link} to={`/add_gameboard/${gameboard.id}`} color="primary" outline className="btn-block">
              Set as assignment
            </Button>
          </Col>
          <Col className="mt-4">
            <Button
              tag={Link}
              to={{ pathname: "/gameboard_builder", search: `?base=${gameboard.id}` }}
              color="primary"
              block
              outline
            >
              Duplicate and edit
            </Button>
          </Col>
        </Row>
      ) : (
        gameboard &&
        !gameboard.savedToCurrentUser && (
          <Row>
            <Col className="mt-4" sm={{ size: 8, offset: 2 }} md={{ size: 4, offset: 4 }}>
              <Button
                tag={Link}
                to={`/add_gameboard/${gameboard.id}`}
                onClick={() => setAssignBoardPath("/set_assignments")}
                color="primary"
                outline
                className="btn-block"
              >
                Save to My gameboards
              </Button>
            </Col>
          </Row>
        )
      )}
    </>
  );
};

export const Gameboard = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const gameboardId = location.hash ? location.hash.slice(1) : null;
  const gameboardQuery = isaacApi.endpoints.getGameboardById.useQuery(gameboardId || skipToken);
  const { data: gameboard } = gameboardQuery;

  // Only log a gameboard view when we have a gameboard loaded:
  useEffect(() => {
    if (isDefined(gameboard) && isFound(gameboard)) {
      dispatch(logAction({ type: "VIEW_GAMEBOARD_BY_ID", gameboardId: gameboard.id }));
    }
  }, [dispatch, gameboard]);

  const notFoundComponent = (
    <Container>
      <TitleAndBreadcrumb breadcrumbTitleOverride="Gameboard" currentPageTitle="Gameboard not found" />
      <h3 className="my-4">
        <small>
          {"We're sorry, we were not able to find a gameboard with the id "}
          <code>{gameboardId}</code>
          {"."}
        </small>
      </h3>
    </Container>
  );

  const renderGameboardDetails = (gameboard: GameboardDTO) => <GameboardDetails gameboard={gameboard} />;

  return !gameboardId ? (
    <Redirect to="/gameboards#example-gameboard" />
  ) : (
    <Container className="mb-5">
      <ShowLoadingQuery
        query={gameboardQuery}
        defaultErrorTitle={`Error fetching gameboard with id: ${gameboardId}`}
        ifNotFound={notFoundComponent}
        thenRender={renderGameboardDetails}
      />
    </Container>
  );
};
