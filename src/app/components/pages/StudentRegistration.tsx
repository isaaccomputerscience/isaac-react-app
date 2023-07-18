import React, { useState } from "react";
import { selectors, useAppSelector } from "../../state";
import {
  Card,
  CardBody,
  CardTitle,
  Col,
  Container,
  Form,
  FormFeedback,
  Row,
} from "reactstrap";
import {
  BooleanNotation,
  DisplaySettings,
  UserEmailPreferences,
  ValidationUser,
} from "../../../IsaacAppTypes";
import {
  loadZxcvbnIfNotPresent,
  REGISTER_CRUMB,
  validateForm,
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
import { PasswordInputs } from "../elements/inputs/PasswordInput";
import useRegistration from "../handlers/useRegistration";
import { RegistrationSubmit } from "../elements/inputs/RegistrationSubmit";

// TODO: useLocation hook to retrieve email/password when upgrading react router to v6+
export const StudentRegistration = () => {
  const user = useAppSelector(selectors.user.orNull);
  const errorMessage = useAppSelector(selectors.error.general);
  const { register, attemptedSignUp } = useRegistration({ isTeacher: false });

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

  const [unverifiedPassword, setUnverifiedPassword] = useState<
    string | undefined
  >();
  const [dobOver13CheckboxChecked, setDobOver13CheckboxChecked] =
    useState(false);

  if (user && user.loggedIn) {
    return <Redirect to="/" />;
  }

  const metaDescriptionCS =
    "Sign up for a free account and get powerful GCSE and A Level Computer Science resources and questions. For classwork, homework, and revision.";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    register({
      registrationUser: registrationUser,
      unverifiedPassword: unverifiedPassword,
      userContexts: userContexts,
      dobOver13CheckboxChecked: dobOver13CheckboxChecked,
      emailPreferences: emailPreferences,
      booleanNotation: booleanNotation,
      displaySettings: displaySettings,
    });
  };

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

          <Form name="register" onSubmit={handleSubmit} className="mt-3">
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

            <PasswordInputs
              userToUpdate={registrationUser}
              setUserToUpdate={setRegistrationUser}
              submissionAttempted={attemptedSignUp}
              unverifiedPassword={unverifiedPassword}
              setUnverifiedPassword={setUnverifiedPassword}
            />

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
              <RegistrationEmailPreference
                emailPreferences={emailPreferences}
                setEmailPreferences={setEmailPreferences}
                submissionAttempted={attemptedSignUp}
                userRole="STUDENT"
              />

            {/* Form Error */}
            <Row>
              <Col>
                <FormFeedback className="text-center always-show">
                  {attemptedSignUp &&
                    !validateForm(
                      registrationUser,
                      unverifiedPassword,
                      userContexts,
                      dobOver13CheckboxChecked,
                      emailPreferences
                    ) && <h5>Please fill out all fields</h5>}
                </FormFeedback>
                <h4 role="alert" className="text-danger text-center">
                  {errorMessage}
                </h4>
              </Col>
            </Row>
            <RegistrationSubmit />
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
};
