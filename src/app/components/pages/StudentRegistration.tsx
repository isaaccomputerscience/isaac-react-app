import React, { useState } from "react";
import {
  selectors,
  updateCurrentUser,
  useAppDispatch,
  useAppSelector,
} from "../../state";
import { Link } from "react-router-dom";
import ReactGA from "react-ga";
import ReactGA4 from "react-ga4";
import {
  Card,
  CardBody,
  CardTitle,
  Col,
  Container,
  Form,
  FormFeedback,
  Input,
  Row,
} from "reactstrap";
import {
  BooleanNotation,
  DisplaySettings,
  UserEmailPreferences,
  ValidationUser,
} from "../../../IsaacAppTypes";
import {
  FIRST_LOGIN_STATE,
  isDobOverThirteen,
  KEY,
  loadZxcvbnIfNotPresent,
  persistence,
  REGISTER_CRUMB,
  validateEmail,
  validateEmailPreferences,
  validateName,
  validatePassword,
  validateUserContexts,
  validateUserGender,
} from "../../services";
import { TitleAndBreadcrumb } from "../elements/TitleAndBreadcrumb";
import { Redirect } from "react-router";
import { MetaDescription } from "../elements/MetaDescription";
import { SchoolInput } from "../elements/inputs/SchoolInput";
import { UserContext } from "../../../IsaacApiTypes";
import { Immutable } from "immer";
import { RegistrationContext } from "../elements/inputs/RegistrationContext";
import { RegistrationEmailPreference } from "../elements/inputs/RegistrationEmailPreference";
import { GenderInput } from "../elements/inputs/GenderInput";
import { EmailInput } from "../elements/inputs/EmailInput";
import { RegistrationNameInput } from "../elements/inputs/RegistrationNameInput";
import { RegistrationDobInput } from "../elements/inputs/RegistrationDobInput";
import { PasswordInput } from "../elements/inputs/PasswordInput";

// TODO: useLocation hook to retrieve email/password when upgrading react router to v6+
export const StudentRegistration = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectors.user.orNull);
  const errorMessage = useAppSelector(selectors.error.general);

  const [booleanNotation, setBooleanNotation] = useState<
    BooleanNotation | undefined
  >();
  const [displaySettings, setDisplaySettings] = useState<
    DisplaySettings | undefined
  >();
  const [userContexts, setUserContexts] = useState<UserContext[]>([{}]);
  const [emailPreferences, setEmailPreferences] = useState<
    UserEmailPreferences | undefined
  >({ ASSIGNMENTS: true });

  // Inputs which trigger re-render
  const [registrationUser, setRegistrationUser] = useState<
    Immutable<ValidationUser>
  >({
    ...user,
    email: undefined,
    dateOfBirth: undefined,
    password: null,
    familyName: undefined,
    givenName: undefined,
    gender: undefined,
    schoolId: undefined,
    schoolOther: undefined,
  });

  loadZxcvbnIfNotPresent();

  const [unverifiedPassword, setUnverifiedPassword] = useState<string | undefined>();
  const [dobOver13CheckboxChecked, setDobOver13CheckboxChecked] =
    useState(false);
  const [attemptedSignUp, setAttemptedSignUp] = useState(false);

  const validateForm =
    validateName(registrationUser.familyName) &&
    validateName(registrationUser.givenName) &&
    validatePassword(registrationUser.password || "") &&
    registrationUser.password == unverifiedPassword &&
    validateEmail(registrationUser.email) &&
    (isDobOverThirteen(registrationUser.dateOfBirth) ||
      dobOver13CheckboxChecked) &&
    validateUserGender(registrationUser) &&
    validateUserContexts(userContexts) &&
    validateEmailPreferences(emailPreferences);

  // Form's submission method
  const register = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttemptedSignUp(true);

    if (validateForm) {
      const userPreferencesToUpdate = {
        BOOLEAN_NOTATION: booleanNotation,
        DISPLAY_SETTING: displaySettings,
        EMAIL_PREFERENCE: emailPreferences,
      };
      persistence.session.save(KEY.FIRST_LOGIN, FIRST_LOGIN_STATE.FIRST_LOGIN);

      const newUser = { ...registrationUser, loggedIn: false };
      const newUserLoggedIn = { ...registrationUser, loggedIn: true };

      dispatch(
        updateCurrentUser(
          newUser,
          userPreferencesToUpdate,
          userContexts,
          null,
          newUserLoggedIn,
          true
        )
      );
      // FIXME - the below ought to be in an action, but we don't know that the update actually registration:
      ReactGA.event({
        category: "user",
        action: "registration",
        label: "Create Account (SEGUE)",
      });
      ReactGA4.event({
        category: "user",
        action: "registration",
        label: "Create Account (SEGUE)",
      });
    }
  };

  if (user && user.loggedIn) {
    return <Redirect to="/" />;
  }

  const metaDescriptionCS =
    "Sign up for a free account and get powerful GCSE and A Level Computer Science resources and questions. For classwork, homework, and revision.";

  // Render
  return (
    <Container id="registration-page" className="mb-5">
      <TitleAndBreadcrumb
        currentPageTitle="Register as a student"
        breadcrumbTitleOverride="Student"
        intermediateCrumbs={[REGISTER_CRUMB]}
        className="mb-4"
      />
      <MetaDescription description={metaDescriptionCS} />

      <Card>
        <CardBody>
          <CardTitle tag="h3">About you</CardTitle>

          <Form name="register" onSubmit={register} className="mt-3">
            {/* Name */}
            <Row>
              <RegistrationNameInput
                userToUpdate={registrationUser}
                setUserToUpdate={setRegistrationUser}
                attemptedSignUp={attemptedSignUp}
              />
            </Row>

            {/* School and DOB */}
            <Row>
              <Col md={6}>
                <SchoolInput
                  userToUpdate={registrationUser}
                  setUserToUpdate={setRegistrationUser}
                  submissionAttempted={attemptedSignUp}
                  required
                />
              </Col>
              <Col md={6}>
                <RegistrationDobInput
                  userToUpdate={registrationUser}
                  setUserToUpdate={setRegistrationUser}
                  attemptedSignUp={attemptedSignUp}
                  dobOver13CheckboxChecked={dobOver13CheckboxChecked}
                  setDobOver13CheckboxChecked={setDobOver13CheckboxChecked}
                />
              </Col>
            </Row>

            {/* Email address and gender */}

            <Row>
              <Col md={6}>
                <EmailInput
                  userToUpdate={registrationUser}
                  setUserToUpdate={setRegistrationUser}
                  submissionAttempted={attemptedSignUp}
                />
              </Col>
              <Col md={6}>
                <GenderInput
                  userToUpdate={registrationUser}
                  setUserToUpdate={setRegistrationUser}
                  submissionAttempted={attemptedSignUp}
                  idPrefix="registration"
                />
              </Col>
            </Row>

            {/* Password */}
            <Row>
              <Col md={6}>
                <PasswordInput
                  fieldType="password"
                  userToUpdate={registrationUser}
                  setUserToUpdate={setRegistrationUser}
                  setUnverifiedPassword={setUnverifiedPassword}
                  submissionAttempted={attemptedSignUp}
                  unverifiedPassword={unverifiedPassword}
               />
              </Col>
              <Col md={6}>
                <PasswordInput
                  fieldType="confirmPassword"
                  userToUpdate={registrationUser}
                  setUserToUpdate={setRegistrationUser}
                  setUnverifiedPassword={setUnverifiedPassword}
                  submissionAttempted={attemptedSignUp}
                  unverifiedPassword={unverifiedPassword}
                />
              </Col>
            </Row>

            {/* User contexts */}
            <Col className="px-0 pb-3">
              <RegistrationContext
                userContexts={userContexts}
                setUserContexts={setUserContexts}
                displaySettings={displaySettings}
                setDisplaySettings={setDisplaySettings}
                setBooleanNotation={setBooleanNotation}
                submissionAttempted={attemptedSignUp}
                userRole="STUDENT"
              />
            </Col>

            <hr className="text-center" />

            {/*Email Preferences */}

            <Row className="m-0">
              <RegistrationEmailPreference
                emailPreferences={emailPreferences}
                setEmailPreferences={setEmailPreferences}
                submissionAttempted={attemptedSignUp}
                userRole="STUDENT"
              />
            </Row>

            {/* Form Error */}
            <Row>
              <Col>
                <FormFeedback className="text-center always-show">
                  {attemptedSignUp && !validateForm && (
                    <h5>Please fill out all fields</h5>
                  )}
                </FormFeedback>
                <h4 role="alert" className="text-danger text-center">
                  {errorMessage}
                </h4>
              </Col>
            </Row>
            <Row>
              <Col className="text-center text-muted mt-3">
                {"By clicking 'Register my account', you accept our "}
                <Link to="/terms" target="_blank">
                  Terms of Use
                </Link>
                . Find out about our{" "}
                <Link to="/privacy" target="_blank">
                  Privacy Policy
                </Link>
                .
              </Col>
            </Row>

            {/* Submit */}
            <Row className="mt-4 mb-2">
              <Col md={{ size: 6, offset: 3 }}>
                <Input
                  type="submit"
                  value="Register my account"
                  className="btn btn-block btn-secondary border-0"
                />
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
};
