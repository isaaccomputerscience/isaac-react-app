import React, { useState } from "react";
import { AdditionalInformation, AugmentedEvent } from "../../../IsaacAppTypes";
import { SchoolInput } from "./inputs/SchoolInput";
import { requestEmailVerification, selectors, useAppDispatch, useAppSelector } from "../../state";
import { UserSummaryWithEmailAddressAndGenderDTO } from "../../../IsaacApiTypes";
import { examBoardLabelMap, isTutor, stageLabelMap, studentOnlyEventMessage } from "../../services";
import { Immutable } from "immer";
import {
  Button,
  Card,
  CardBody,
  Col,
  FormFeedback,
  Input,
  Label,
  PopoverBody,
  Row,
  UncontrolledPopover,
} from "reactstrap";

interface EventBookingFormProps {
  event: AugmentedEvent;
  targetUser: Immutable<UserSummaryWithEmailAddressAndGenderDTO>;
  additionalInformation: AdditionalInformation;
  updateAdditionalInformation: (update: AdditionalInformation) => void;
}

const SchoolYearGroup = ({
  event,
  additionalInformation,
  updateAdditionalInformation,
  required,
}: {
  event: AugmentedEvent;
  additionalInformation: AdditionalInformation;
  updateAdditionalInformation: (update: AdditionalInformation) => void;
  required?: boolean;
}) => {
  return (
    <>
      <Label htmlFor="year-group" className="form-required">
        School year group
      </Label>
      <Input
        type="select"
        id="year-group"
        name="year-group"
        value={additionalInformation.yearGroup || ""}
        onChange={(event) => updateAdditionalInformation({ yearGroup: event.target.value })}
        required={required}
      >
        <option value="" />
        {event.isAStudentEvent && (
          <>
            <option value="9">Year 9</option>
            <option value="10">Year 10</option>
            <option value="11">Year 11</option>
            <option value="12">Year 12</option>
            <option value="13">Year 13</option>
          </>
        )}
        {!event.isStudentOnly && (
          <>
            <option value="TEACHER">N/A - Teacher</option>
            <option value="OTHER">N/A - Other</option>
          </>
        )}
      </Input>
      {event.isStudentOnly && (
        <div className="text-muted" data-testid="student-only">
          {studentOnlyEventMessage(event.id)}
        </div>
      )}
      {(event.isATeacherEvent || additionalInformation.yearGroup == "TEACHER") && (
        <div className="mt-2 text-right">
          <a href="/pages/teacher_accounts" target="_blank">
            Click to upgrade to a teacher account
          </a>{" "}
          for free!
        </div>
      )}
    </>
  );
};

export const AccessibilityAndDietaryRequirements = ({
  additionalInformation,
  updateAdditionalInformation,
  required,
}: {
  additionalInformation: AdditionalInformation;
  updateAdditionalInformation: (update: AdditionalInformation) => void;
  required?: boolean;
}) => {
  const requirementsList = [
    {
      label: "Accessibility requirements",
      id: "access",
      popover:
        "For example, please let us know if you need wheelchair access, hearing loop or if we can help with any special adjustments.",
      type: "accessibilityRequirements" as keyof AdditionalInformation,
    },
    {
      label: "Dietary requirements",
      id: "dietary",
      popover: "For example, it is important for us to know if you have a severe allergy and/or carry an EpiPen",
      type: "dietaryRequirements" as keyof AdditionalInformation,
    },
  ];

  return (
    <div>
      {requirementsList.map((requirement) => {
        const { label, id, popover, type } = requirement;
        return (
          <div key={id}>
            <Label htmlFor={`${id}-reqs`}>
              {label}
              <span id={`${id}-reqs-help`} aria-haspopup="true" className="icon-help has-tip" />
              <UncontrolledPopover trigger="click" placement="bottom" target={`${id}-reqs-help`}>
                <PopoverBody>{popover}</PopoverBody>
              </UncontrolledPopover>
            </Label>
            <Input
              id={`${id}-reqs`}
              name={`${id}-reqs`}
              type="text"
              value={String(additionalInformation[type] || "")}
              onChange={(event) => updateAdditionalInformation({ [`${type}`]: event.target.value })}
              required={required}
            />
          </div>
        );
      })}
    </div>
  );
};

const InputWithLabel = ({
  type,
  additionalInformation,
  updateAdditionalInformation,
  required,
}: {
  type: "emergencyNumber" | "emergencyName" | "jobTitle";
  additionalInformation: AdditionalInformation;
  updateAdditionalInformation: (update: AdditionalInformation) => void;
  required?: boolean;
}) => {
  const fields = {
    emergencyNumber: { label: "Contact telephone number", id: "emergency-number" },
    emergencyName: { label: "Contact name", id: "emergency-name" },
    jobTitle: { label: "Job title", id: "job-title" },
  };

  const { label, id } = fields[type];

  return (
    <>
      <Label htmlFor={id} className="form-required">
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        type="text"
        value={additionalInformation[type] || ""}
        onChange={(event) => updateAdditionalInformation({ [`${type}`]: event.target.value })}
        required={required}
      />
    </>
  );
};

export const EventBookingForm = ({
  event,
  targetUser,
  additionalInformation,
  updateAdditionalInformation,
}: EventBookingFormProps) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectors.user.orNull);
  const editingSelf = user && user.loggedIn && targetUser.id === user.id;

  const [verifyEmailRequestSent, setVerifyEmailRequestSent] = useState(false);
  const notVerifiedEmail = targetUser.emailVerificationStatus !== "VERIFIED";

  const DisabledInputWithLabel = ({
    type,
    invalid,
  }: {
    type: "firstname" | "lastname" | "email" | "stage" | "examBoard";
    invalid?: boolean;
  }) => {
    const fields = {
      firstname: { label: "First name", id: "account-firstname", value: targetUser.givenName || "" },
      lastname: { label: "Last name", id: "account-lastname", value: targetUser.familyName || "" },
      email: {
        label: "Email address",
        id: "account-email",
        value: targetUser.email || "",
      },
      stage: {
        label: "Stage",
        id: "account-stages",
        value:
          Array.from(new Set(targetUser.registeredContexts?.map((rc) => stageLabelMap[rc.stage!]))).join(", ") || "",
      },
      examBoard: {
        label: "Exam board",
        id: "account-examboard",
        value:
          Array.from(new Set(targetUser.registeredContexts?.map((rc) => examBoardLabelMap[rc.examBoard!]))).join(
            ", ",
          ) || "",
      },
    };

    const { label, id, value } = fields[type];

    return (
      <>
        <Label htmlFor={id} className="form-required">
          {label}
        </Label>
        <Input id={id} name={type} type="text" disabled value={value} invalid={invalid} />
        {type === "email" && (
          <FormFeedback data-testid="email-feedback">
            {editingSelf
              ? "You must verify your email address to book on events. This is so we can send you details about the event."
              : "WARNING: This email is not verified. The details about the event might not reach the user."}
          </FormFeedback>
        )}
      </>
    );
  };

  const EmailVerification = () => {
    return (
      <Row className="mt-2">
        <Col>
          {editingSelf && !verifyEmailRequestSent && (
            <Button
              color="link"
              className="btn-underline"
              onClick={() => {
                dispatch(requestEmailVerification());
                setVerifyEmailRequestSent(true);
              }}
            >
              Verify your email before booking
            </Button>
          )}
          {verifyEmailRequestSent && (
            <span>
              We have sent an email to {targetUser.email}. Please follow the instructions in the email prior to booking.
            </span>
          )}
        </Col>
      </Row>
    );
  };

  return (
    <>
      {/* Account Information */}
      <Card className="mb-3 bg-light" data-testid="booking-account-info">
        <CardBody>
          <legend>
            Your account information (
            <a href="/account" target="_blank" className="text-secondary">
              update
            </a>
            )
          </legend>
          <Row>
            <Col md={6}>
              <DisabledInputWithLabel type="firstname" invalid={!targetUser.givenName} />
              <FormFeedback>First name is required</FormFeedback>
            </Col>
            <Col md={6}>
              <DisabledInputWithLabel type="lastname" invalid={!targetUser.familyName} />
              <FormFeedback>Last name is required</FormFeedback>
            </Col>
          </Row>

          <div>
            <Row>
              <Col md={12}>
                <DisabledInputWithLabel type="email" invalid={notVerifiedEmail} />
                {notVerifiedEmail && <EmailVerification />}
              </Col>
              <Col md={6}>
                <DisabledInputWithLabel
                  type="stage"
                  invalid={!targetUser.registeredContexts || targetUser.registeredContexts.length === 0}
                />
                <FormFeedback>Stage is required</FormFeedback>
              </Col>
              <Col md={6}>
                <DisabledInputWithLabel
                  type="examBoard"
                  invalid={!targetUser.registeredContexts || targetUser.registeredContexts.length === 0}
                />
                <FormFeedback>Exam Board is required</FormFeedback>
              </Col>
            </Row>
          </div>
          {editingSelf && (
            <>
              <SchoolInput
                userToUpdate={Object.assign({ password: null }, targetUser)}
                disableInput
                submissionAttempted
                required={!isTutor(targetUser)}
              />
              <div className="text-center alert-warning p-1">
                {"If this information is incorrect, please update it from your "}
                <a href="/account" target="_blank">
                  account page
                </a>
                {"."}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Event Booking Details */}
      <Card className="mb-3" data-testid="event-booking-details">
        <CardBody>
          <legend>Event booking details</legend>

          <div>
            {targetUser.role != "STUDENT" && (
              <InputWithLabel
                type="jobTitle"
                additionalInformation={additionalInformation}
                updateAdditionalInformation={updateAdditionalInformation}
                required
              />
            )}
            {targetUser.role == "STUDENT" && (
              <SchoolYearGroup
                event={event}
                additionalInformation={additionalInformation}
                updateAdditionalInformation={updateAdditionalInformation}
                required
              />
            )}
          </div>

          {!event.isVirtual && (
            <div>
              <AccessibilityAndDietaryRequirements
                additionalInformation={additionalInformation}
                updateAdditionalInformation={updateAdditionalInformation}
                required
              />

              {additionalInformation.yearGroup != "TEACHER" && additionalInformation.yearGroup != "OTHER" && (
                <Row className="mt-2">
                  <Col xs={12}>
                    <h3>Emergency contact details</h3>
                  </Col>
                  <Col md={6}>
                    <InputWithLabel
                      type="emergencyName"
                      additionalInformation={additionalInformation}
                      updateAdditionalInformation={updateAdditionalInformation}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <InputWithLabel
                      type="emergencyNumber"
                      additionalInformation={additionalInformation}
                      updateAdditionalInformation={updateAdditionalInformation}
                      required
                    />
                  </Col>
                </Row>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
};
