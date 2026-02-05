import React, { ReactElement, useEffect, useRef } from "react";
import { UncontrolledTooltip, Button } from "reactstrap";
import { Link } from "react-router-dom";
import {
  AUDIENCE_DISPLAY_FIELDS,
  filterAudienceViewsByProperties,
  SITE_SUBJECT_TITLE,
  STAGE,
  stageLabelMap,
  useUserContext,
} from "../../services";
import { AppState, mainContentIdSlice, useAppDispatch, useAppSelector } from "../../state";
import { ViewingContext } from "../../../IsaacAppTypes";
import { DifficultyIcons } from "./svg/DifficultyIcons";
import classnames from "classnames";
import { Helmet } from "react-helmet";
import { Markup } from "./markup";
import { EditablePageTitle } from "./inputs/EditablePageTitle";

function AudienceViewer({ audienceViews }: { audienceViews: ViewingContext[] }) {
  const userContext = useUserContext();
  const viewsWithMyStage = audienceViews.filter((vc) => vc.stage === userContext.stage);
  // If there is a possible audience view that is correct for our user context, show that specific one
  const viewsToUse = viewsWithMyStage.length > 0 ? viewsWithMyStage.slice(0, 1) : audienceViews;
  const filteredViews = filterAudienceViewsByProperties(viewsToUse, AUDIENCE_DISPLAY_FIELDS);

  return (
    <div className="h-subtitle pt-sm-0 mb-sm-0 d-sm-flex">
      {filteredViews.map((view, i) => (
        <div key={`${view.stage} ${view.difficulty} ${view.examBoard}`} className={"d-flex d-sm-block"}>
          {view.stage && view.stage !== STAGE.ALL && (
            <div className="text-center align-self-center">{stageLabelMap[view.stage]}</div>
          )}
          {view.difficulty && (
            <div className={classnames("ml-2 ml-sm-0", { "mr-2": i > 0 })} data-testid="difficulty-icons">
              <DifficultyIcons difficulty={view.difficulty} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export interface PageTitleProps {
  currentPageTitle: string;
  subTitle?: string;
  disallowLaTeX?: boolean;
  help?: ReactElement;
  boosterVideoButton?: boolean;
  className?: string;
  audienceViews?: ViewingContext[];
  onTitleEdit?: (newTitle: string) => void;
}

export const PageTitle = ({
  currentPageTitle,
  subTitle,
  disallowLaTeX,
  help,
  boosterVideoButton,
  className,
  audienceViews,
  onTitleEdit,
}: PageTitleProps) => {
  const dispatch = useAppDispatch();
  const openModal = useAppSelector((state: AppState) => Boolean(state?.activeModals?.length));
  const user = useAppSelector((state: AppState) => state?.user);
  const headerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    dispatch(mainContentIdSlice.actions.set("main-heading"));
  }, [dispatch]);

  useEffect(() => {
    document.title = `${currentPageTitle} — Isaac ${SITE_SUBJECT_TITLE}`;
    const element = headerRef.current;
    if (element && (globalThis as { followedAtLeastOneSoftLink?: boolean }).followedAtLeastOneSoftLink && !openModal) {
      element.focus();
    }
  }, [currentPageTitle, openModal]);

  // Extract nested ternary logic
  const renderHelpOrBoosterButton = () => {
    if (boosterVideoButton) {
      const targetPath = user?.loggedIn
        ? "/booster_video_binary_conversion_and_addition"
        : "/login?target=/booster_video_binary_conversion_and_addition";

      return (
        <Button tag={Link} to={targetPath} className="primary-button text-light align-self-center ml-sm-2">
          Watch booster videos
        </Button>
      );
    }

    if (help) {
      return (
        <>
          <div id="title-help" className="title-help">
            Help
          </div>
          <UncontrolledTooltip target="#title-help" placement="bottom">
            {help}
          </UncontrolledTooltip>
        </>
      );
    }

    return null;
  };

  return (
    <h1 id="main-heading" tabIndex={-1} ref={headerRef} className={`h-title h-secondary d-sm-flex ${className ?? ""}`}>
      <div className="mr-auto" data-testid={"main-heading"}>
        {onTitleEdit ? (
          <EditablePageTitle onEdit={onTitleEdit} currentPageTitle={currentPageTitle} />
        ) : (
          formatPageTitle(currentPageTitle, disallowLaTeX)
        )}
        {subTitle && <span className="h-subtitle d-none d-sm-block">{subTitle}</span>}
      </div>
      <Helmet>
        <meta property="og:title" content={currentPageTitle} />
      </Helmet>
      {audienceViews && <AudienceViewer audienceViews={audienceViews} />}
      {renderHelpOrBoosterButton()}
    </h1>
  );
};

export const formatPageTitle = (currentPageTitle: string, disallowLaTeX?: boolean) => (
  <Markup encoding={disallowLaTeX ? "plaintext" : "latex"}>{currentPageTitle}</Markup>
);
