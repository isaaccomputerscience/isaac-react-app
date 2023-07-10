import React, { useEffect, useState } from "react";
import {
  selectors,
  submitMessage,
  updateCurrentUser,
  useAppDispatch,
  useAppSelector,
} from "../../state";
import { Link } from "react-router-dom";
import ReactGA from "react-ga";
import ReactGA4 from "react-ga4";
import {
  Button,
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
  allowedDomain,
  api,
  FIRST_LOGIN_STATE,
  isDobOverThirteen,
  KEY,
  loadZxcvbnIfNotPresent,
  persistence,
  REGISTER_CRUMB,
  schoolNameWithPostcode,
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
import TeacherVerification from "../elements/inputs/TeacherVerification";

const metaDescriptionCS =
  "Sign up for a free account and get powerful GCSE and A Level Computer Science resources and questions. For classwork, homework, and revision.";

export const TeacherRegistrationTerms = ({
  acceptConditions,
}: {
  acceptConditions: (arg0: boolean) => void;
}) => {
  return (
    <Container id="teacher-conditions" className="mb-5">
      <TitleAndBreadcrumb
        currentPageTitle="Conditions for Teacher accounts"
        breadcrumbTitleOverride="Teacher"
        intermediateCrumbs={[REGISTER_CRUMB]}
        className="mb-4"
      />
      <MetaDescription description={metaDescriptionCS} />
      <p className="mt-5">
        To be eligible to upgrade your Isaac Computer Science account to a
        teacher account, you must meet the following criteria:
      </p>
      <ul>
        <li>You must be at least 18 years of age</li>
        <li>You must be a qualified teacher or professional tutor</li>
        <li>
          Your profile on the Isaac platform must be set up under your own full
          name, not the name of your department
        </li>
        <li>
          Your profile on the Isaac platform must include the name of your
          school, unless you are applying as a private tutor
        </li>
        <li>
          You must use the email address given to you by your school or
          institution, or used for your private tuition services.
        </li>
        <li>
          You must have verified your email address by clicking on the link that
          we sent to you by email
        </li>
      </ul>
      <h3>Verification of teacher accounts</h3>
      <p>
        Isaac Computer Science accounts are upgraded to teacher accounts
        following a manual verification process:
      </p>
      <ul>
        <li>
          If your school&apos;s website features a staff list, we will check
          that your verified email domain matches the URL of your school&apos;s
          website, and that you are listed as a member of staff.
        </li>
        <li>
          If your school&apos;s website does not feature a staff list, we will
          contact your school&apos;s reception by telephone to verify that you
          are a member of staff.
        </li>
        <li>
          If you are a private tutor we ask that you provide a reference from a
          former colleague at a school, evidence of your tutoring services and a
          DBS certificate.
        </li>
      </ul>
      <p>
        We process all requests as quickly as possible, however, please note
        that the initial stage can take up to 5 working days. To help us process
        your request quickly, please provide a link to a page on your
        school&apos;s website on which you are listed as a member of staff, or
        if you know that you are not listed on the school website, please inform
        your school reception team that they may receive a call from us.
      </p>
      <h3>What does a teacher account give you?</h3>
      <p>
        A teacher account gives you access to features that help you to set
        questions and view student progress from the platform. The features are
        designed for use in the classroom or for setting homework. Teacher
        accounts can:
      </p>
      <ul>
        <li>create groups for your students to join</li>
        <li>assign pre-made gameboards to your class groups</li>
        <li>
          create your own gameboards from the pre-made questions available
        </li>
        <li>view progress of the students in a group you have created</li>
      </ul>
      <p>Teacher accounts do not give you access to:</p>
      <ul>
        <li>any additional resources</li>
        <li>the answers to any of the questions</li>
        <li>the ability to communicate directly with students</li>
      </ul>
      <p>
        If you have any further questions, please check our{" "}
        <a href="https://isaaccomputerscience.org/support/teacher/general">
          FAQ section
        </a>
        .
      </p>
      <p className="text-center mb-1 mt-4">
        <Button
          onClick={() => acceptConditions(true)}
          className="btn btn-secondary border-0"
        >
          Continue to a teacher account
        </Button>
      </p>
    </Container>
  );
};

// TODO: useLocation hook to retrieve email/password when upgrading react router to v6+
export const TeacherRegistrationBody = () => {
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

  // states & functions for teacher verification
  const [otherInformation, setOtherInformation] = useState("");
  const [verificationDetails, setVerificationDetails] = useState<string>();
  const [school, setSchool] = useState<string | undefined>();

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
    teacherPending: true,
  });

  loadZxcvbnIfNotPresent();

  const [unverifiedPassword, setUnverifiedPassword] = useState<
    string | undefined
  >();
  const [dobOver13CheckboxChecked, setDobOver13CheckboxChecked] =
    useState(true);
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

  useEffect(() => {
    function fetchSchool(urn: string) {
      if (urn !== "") {
        api.schools.getByUrn(urn).then(({ data }) => {
          setSchool(schoolNameWithPostcode(data[0]));
        });
      } else if (registrationUser.schoolOther) {
        setSchool(registrationUser.schoolOther);
      } else {
        setSchool(undefined);
      }
    }

    fetchSchool(registrationUser.schoolId || "");
  }, [registrationUser.schoolOther, registrationUser.schoolId]);

  // Form's submission method
  const register = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttemptedSignUp(true);

    if (
      validateForm &&
      allowedDomain(registrationUser.email) &&
      verificationDetails
    ) {
      const userPreferencesToUpdate = {
        BOOLEAN_NOTATION: booleanNotation,
        DISPLAY_SETTING: displaySettings,
        EMAIL_PREFERENCE: emailPreferences,
      };
      persistence.session.save(KEY.FIRST_LOGIN, FIRST_LOGIN_STATE.FIRST_LOGIN);

      const newUser = { ...registrationUser, loggedIn: false };
      const newUserLoggedIn = { ...registrationUser, loggedIn: true };

      const firstName = registrationUser.givenName || "";
      const lastName = registrationUser.familyName || "";
      const emailAddress = registrationUser.email || "";

      const subject = "Teacher Account Request";
      const message =
        "Hello,\n\n" +
        "Please could you convert my Isaac account into a teacher account.\n\n" +
        "My school is: " +
        school +
        "\n" +
        "A link to my school website with a staff list showing my name and email (or a phone number to contact the school) is: " +
        verificationDetails +
        "\n\n" +
        "Any other information: " +
        otherInformation +
        "\n\n" +
        "Thanks, \n\n" +
        firstName +
        " " +
        lastName;

      // create account
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

      // send email for account upgrade request
      dispatch(
        submitMessage({
          firstName,
          lastName,
          emailAddress,
          subject,
          message,
        })
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

  // Render
  return (
    <Container id="registration-page" className="mb-5">
      <TitleAndBreadcrumb
        currentPageTitle="Register as a teacher"
        breadcrumbTitleOverride="Teacher"
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
                  teacherRegistration={true}
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
            <Row className="pb-3">
              <Col md={6}>
                <RegistrationContext
                  userContexts={userContexts}
                  setUserContexts={setUserContexts}
                  displaySettings={displaySettings}
                  setDisplaySettings={setDisplaySettings}
                  setBooleanNotation={setBooleanNotation}
                  submissionAttempted={attemptedSignUp}
                  userRole="TEACHER"
                />
              </Col>
              <Col md={6}>
                <TeacherVerification
                  setVerificationDetails={setVerificationDetails}
                  setOtherInformation={setOtherInformation}
                />
              </Col>
            </Row>

            <hr className="text-center" />

            {/*Email Preferences */}

            <Row className="m-0">
              <RegistrationEmailPreference
                emailPreferences={emailPreferences}
                setEmailPreferences={setEmailPreferences}
                submissionAttempted={attemptedSignUp}
                userRole="TEACHER"
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

export const TeacherRegistration = () => {
  const [conditionsAccepted, setConditionsAccepted] = useState(false);

  return conditionsAccepted ? (
    <TeacherRegistrationBody />
  ) : (
    <TeacherRegistrationTerms acceptConditions={setConditionsAccepted} />
  );
};
