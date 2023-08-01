import { CardBody, FormGroup, Row, Table } from "reactstrap";
import React from "react";
import { UserEmailPreferences } from "../../../../IsaacAppTypes";
import { TrueFalseRadioInput } from "./TrueFalseRadioInput";
import { SITE_SUBJECT_TITLE } from "../../../services";
import { UserRole } from "../../../../IsaacApiTypes";

interface RegistrationEmailPreferenceProps {
  emailPreferences: UserEmailPreferences | null | undefined;
  setEmailPreferences: (e: UserEmailPreferences) => void;
  submissionAttempted: boolean;
  userRole: UserRole;
}
export const RegistrationEmailPreference = ({
  emailPreferences,
  setEmailPreferences,
  userRole,
  submissionAttempted,
}: RegistrationEmailPreferenceProps) => {
  const isaacEmailPreferenceDescriptions = {
    assignments: "Receive assignment notifications from your teacher.",
    news: "Be the first to know about new topics, new platform features, and our fantastic competition giveaways.",
    events:
      "Get valuable updates on our free student workshops/teacher CPD events happening near you.",
  };

  return (
    <Row className="m-0">
    <CardBody className="p-0">
      <h3 className="pb-4">Your communication preferences</h3>
      <p>
        Get important information about the Isaac {SITE_SUBJECT_TITLE} programme
        delivered to your inbox. These settings can be changed at any time.
        Expect one email per term for News and a monthly bulletin for Events.{" "}
        {userRole === "STUDENT" &&
          "Assignment notifications will be sent as needed by your teacher."}
      </p>
      <FormGroup className="overflow-auto">
        <Table className="mb-0">
          <thead>
            <tr>
              <th>Email</th>
              <th className="d-none d-sm-table-cell">Description</th>
              <th className="text-center">Preference</th>
            </tr>
          </thead>
          <tbody>
            {userRole === "STUDENT" && (
              <tr>
                <td>Assignments</td>
                <td className="d-none d-sm-table-cell">
                  {isaacEmailPreferenceDescriptions.assignments}
                </td>
                <td className="text-center">
                  <TrueFalseRadioInput
                    id="assignments"
                    stateObject={emailPreferences}
                    propertyName="ASSIGNMENTS"
                    setStateFunction={setEmailPreferences}
                    submissionAttempted={submissionAttempted}
                  />
                </td>
              </tr>
            )}
            <tr>
              <td>News</td>
              <td className="d-none d-sm-table-cell">
                {isaacEmailPreferenceDescriptions.news}
              </td>
              <td className="text-center">
                <TrueFalseRadioInput
                  id="news"
                  stateObject={emailPreferences}
                  propertyName="NEWS_AND_UPDATES"
                  setStateFunction={setEmailPreferences}
                  submissionAttempted={submissionAttempted}
                />
              </td>
            </tr>
            <tr>
              <td>Events</td>
              <td className="d-none d-sm-table-cell">
                {isaacEmailPreferenceDescriptions.events}
              </td>
              <td className="text-center">
                <TrueFalseRadioInput
                  id="events"
                  stateObject={emailPreferences}
                  propertyName="EVENTS"
                  setStateFunction={setEmailPreferences}
                  submissionAttempted={submissionAttempted}
                />
              </td>
            </tr>
          </tbody>
        </Table>
        <hr className="text-center"/>
      </FormGroup>
    </CardBody>
    </Row>
  );
};
