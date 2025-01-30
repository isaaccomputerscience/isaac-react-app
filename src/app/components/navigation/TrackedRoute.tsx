import React, { useEffect } from "react";
import { Redirect, Route, RouteComponentProps, RouteProps } from "react-router";
import ReactGA from "react-ga4";
import { FigureNumberingContext, PotentialUser } from "../../../IsaacAppTypes";
import { ShowLoading } from "../handlers/ShowLoading";
import { selectors, useAppSelector } from "../../state";
import {
  GOOGLE_ANALYTICS_4_MEASUREMENT_ID,
  isTeacherOrAbove,
  isTutorOrAbove,
  KEY,
  persistence,
  TEACHER_REQUEST_ROUTE,
} from "../../services";
import { Unauthorised } from "../pages/Unauthorised";
import { Immutable } from "immer";

ReactGA.initialize(GOOGLE_ANALYTICS_4_MEASUREMENT_ID);

export interface FieldsObject {
  [i: string]: any;
}

const trackPage = (page: string, options?: FieldsObject) => {
  ReactGA.set({ page, ...options });
  ReactGA.send({ hitType: "pageview", page });
};

interface UserFilterProps {
  ifUser?: (user: Immutable<PotentialUser>) => boolean;
}

type TrackedRouteProps = RouteProps & {
  trackingOptions?: FieldsObject;
  componentProps?: FieldsObject;
  userAgent?: string;
} & UserFilterProps;
type TrackedRouteComponentProps = RouteComponentProps & {
  component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
  trackingOptions?: FieldsObject;
};

const WrapperComponent = function ({ component: Component, trackingOptions, ...props }: TrackedRouteComponentProps) {
  useEffect(() => {
    trackPage(props.location.pathname, trackingOptions);
  }, [props.location.pathname, trackingOptions]);
  return (
    <FigureNumberingContext.Provider value={{}}>
      {" "}
      {/* Create a figure numbering scope for each page */}
      <Component {...props} />
    </FigureNumberingContext.Provider>
  );
};

export const isBot = function (userAgent?: string): boolean {
  const botUserAgents: string[] = [
    "compatible; Googlebot/2.1; +http://www.google.com/bot.html",
    "compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm",
  ];
  return botUserAgents.some((bot) => userAgent?.includes(bot) ?? false);
};

export const TrackedRoute = function ({ component, trackingOptions, componentProps, ...rest }: TrackedRouteProps) {
  const user = useAppSelector(selectors.user.orNull);
  if (component) {
    if (rest.ifUser !== undefined) {
      const { ifUser, userAgent, ...rest$ } = rest;
      return (
        <Route
          {...rest$}
          render={(props) => {
            const propsWithUser = { user, ...props };
            const userNeedsToBeTutorOrTeacher =
              rest.ifUser && [isTutorOrAbove.name, isTeacherOrAbove.name].includes(rest.ifUser.name); // TODO we should try to find a more robust way than this
            return (
              <ShowLoading until={user}>
                {(user && ifUser(user)) || isBot(userAgent) ? (
                  <WrapperComponent
                    component={component}
                    trackingOptions={trackingOptions}
                    {...propsWithUser}
                    {...componentProps}
                  />
                ) : user && !user.loggedIn && !isTutorOrAbove(user) && userNeedsToBeTutorOrTeacher ? (
                  persistence.save(KEY.AFTER_AUTH_PATH, props.location.pathname + props.location.search) && (
                    <Redirect to="/login" />
                  )
                ) : user && !isTutorOrAbove(user) && userNeedsToBeTutorOrTeacher ? (
                  <Redirect to={TEACHER_REQUEST_ROUTE} />
                ) : user && user.loggedIn && !ifUser(user) ? (
                  <Unauthorised />
                ) : (
                  persistence.save(
                    KEY.AFTER_AUTH_PATH,
                    props.location.pathname + props.location.search + props.location.hash,
                  ) && <Redirect to="/login" />
                )}
              </ShowLoading>
            );
          }}
        />
      );
    } else {
      return (
        <Route
          {...rest}
          render={(props) => {
            return (
              <WrapperComponent
                component={component}
                trackingOptions={trackingOptions}
                {...props}
                {...componentProps}
              />
            );
          }}
        />
      );
    }
  } else {
    throw new Error("TrackedRoute only works on components, got: " + JSON.stringify(rest));
  }
};
