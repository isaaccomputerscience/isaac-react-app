import React from "react";
import { TrackedRoute } from "../navigation/TrackedRoute";
import { AllTopics, AllTopicsWithoutAStage } from "../pages/AllTopics";
import { GCSETeachingOrder } from "../pages/GCSETeachingOrder";
import StaticPageRoute from "../navigation/StaticPageRoute";
import { ComingSoon } from "../pages/ComingSoon";
import { Topic } from "../pages/Topic";
import { Students } from "../pages/Students";
import { TeacherTools } from "../pages/TeacherTools";
import { AssignmentProgress } from "../pages/AssignmentProgress";
import { Redirect } from "react-router";
import { isLoggedIn, isTutorOrAbove, STAGE } from "../../services";
import { SingleAssignmentProgress } from "../pages/SingleAssignmentProgress";
import { Glossary } from "../pages/Glossary";

let key = 0;
export const Routes = [
  // Student and teacher
  <TrackedRoute key={key++} exact path="/students" component={Students} />,
  <TrackedRoute key={key++} exact path="/teachers" component={TeacherTools} />,

  // Assignments
  <TrackedRoute key={key++} exact path="/my_markbook" ifUser={isTutorOrAbove} component={AssignmentProgress} />,
  <Redirect key={key++} from="/assignment_progress" to="/my_markbook" />,
  <TrackedRoute
    key={key++}
    exact
    path="/my_markbook/:assignmentId"
    ifUser={isTutorOrAbove}
    component={SingleAssignmentProgress}
  />,
  <Redirect key={key++} from="/assignment_progress/:assignmentId" to="/my_markbook/:assignmentId" />,

  // Topics
  <Redirect key={key++} from="/topics/procedural_and_structured_programming" to="/topics/procedural_programming" />,
  <Redirect key={key++} from="/topics/guis" to="/topics/event_driven_programming" />,
  <Redirect key={key++} from="/topics/searching_sorting_pathfinding" to="/topics/searching" />,
  <Redirect key={key++} from="/topics/theory_of_computation" to="/topics/models_of_computation" />,
  <Redirect key={key++} from="/topics/operating_systems_and_software" to="/topics/operating_systems" />,
  <Redirect key={key++} from="/topics/number_bases" to="/topics/number_representation" />,
  <Redirect key={key++} from="/topics/string_manipulation" to="/topics/string_handling" />,

  <TrackedRoute
    key={key++}
    exact
    path="/topics"
    component={AllTopicsWithoutAStage}
    userAgent={globalThis.navigator.userAgent}
  />,
  <TrackedRoute
    key={key++}
    exact
    path="/topics/gcse"
    component={AllTopics}
    componentProps={{ stage: STAGE.GCSE }}
    userAgent={globalThis.navigator.userAgent}
  />,
  <TrackedRoute
    key={key++}
    exact
    path="/topics/a_level"
    userAgent={globalThis.navigator.userAgent}
    component={AllTopics}
    componentProps={{ stage: STAGE.A_LEVEL }}
  />,
  <TrackedRoute
    key={key++}
    exact
    path="/topics/:topicName"
    ifUser={isLoggedIn}
    userAgent={globalThis.navigator.userAgent}
    component={Topic}
  />,

  // Glossary:
  <TrackedRoute key={key++} exact path="/glossary" component={Glossary} userAgent={globalThis.navigator.userAgent} />,

  // Static pages:
  <StaticPageRoute key={key++} exact path="/about" pageId="about_us" />,
  <StaticPageRoute key={key++} exact path="/safeguarding" pageId="events_safeguarding" />,
  <TrackedRoute
    key={key++}
    exact
    ifUser={isTutorOrAbove}
    path="/gcse_teaching_order"
    component={GCSETeachingOrder}
    componentProps={{ stage: STAGE.GCSE }}
    userAgent={globalThis.navigator.userAgent}
  />,
  <TrackedRoute
    key={key++}
    exact
    ifUser={isTutorOrAbove}
    path="/teacher_gcse_revision_page"
    component={GCSETeachingOrder}
    componentProps={{ stage: STAGE.GCSE }}
    userAgent={globalThis.navigator.userAgent}
  />,

  <StaticPageRoute key={key++} exact ifUser={isTutorOrAbove} path="/teaching_order" pageId="teaching_order" />,
  <StaticPageRoute key={key++} exact path="/teachcomputing" pageId="teach_computing" />,
  <StaticPageRoute key={key++} exact path="/gcse_programming_challenges" pageId="gcse_programming_challenges" />,

  <TrackedRoute key={key++} exact path="/coming_soon" component={ComingSoon} />,
];
