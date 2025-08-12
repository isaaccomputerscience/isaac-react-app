import React, { useEffect, useState } from "react";
import { Form, Row, Col, Container, FormGroup, Label, Input } from "reactstrap";
import { isaacApi, useAppSelector } from "../../../../state";
import { selectors } from "../../../../state/selectors";
import { SchoolInput } from "../../../elements/inputs/SchoolInput";
import FormInput from "./FormInput";
import { useReserveUsersOnCompetition } from "./useReserveUsersOnCompetition";
import { useActiveGroups } from "./useActiveGroups";
import MultiSelect from "../MultiSelect/MultiSelect";

const COMPETITON_ID = "20250131_isaac_competition";
interface CompetitionEntryFormProps {
  handleTermsClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const CompetitionEntryForm = ({ handleTermsClick }: CompetitionEntryFormProps) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const activeGroups = useActiveGroups();
  const [getGroupMembers] = isaacApi.endpoints.getGroupMembers.useLazyQuery();
  const targetUser = useAppSelector(selectors.user.orNull);
  const reserveUsersOnCompetition = useReserveUsersOnCompetition();
  const [submissionLink, setSubmissionLink] = useState("");

  // Get the selected group from activeGroups (which gets updated with members from Redux)
  const selectedGroup = selectedGroupId ? activeGroups.find((group) => group.id === selectedGroupId) || null : null;

  useEffect(() => {
    if (selectedGroup?.id && !selectedGroup.members) {
      getGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup, getGroupMembers]);

  useEffect(() => {
    // Clear selected members when group changes
    setSelectedMembers([]);
  }, [selectedGroupId]);

  const isSubmitDisabled = !submissionLink || !selectedGroup || selectedMembers.length === 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const elements = form.elements as HTMLFormControlsCollection;
    const groupId = (elements.namedItem("formGroup") as HTMLSelectElement).value;
    const selectedGroup = activeGroups.find((group) => group.groupName === groupId);
    const submissionLink = (elements.namedItem("submissionLink") as HTMLInputElement).value;
    const groupName = selectedGroup?.groupName;

    if (selectedGroup?.id && selectedMembers.length > 0) {
      // Convert selected member IDs from strings to numbers
      const reservableIds = selectedMembers.map((memberId) => parseInt(memberId, 10)).filter((id) => !isNaN(id));
      reserveUsersOnCompetition(COMPETITON_ID, reservableIds, submissionLink, groupName);
    }

    setSubmissionLink("");
    setSelectedMembers([]);
    setSelectedGroupId(null);
    (elements.namedItem("formGroup") as HTMLSelectElement).selectedIndex = 0;
  };

  return (
    <div className="py-5">
      <div className="entry-form-background-img entry-form-section">
        <Container className="pb-2">
          <Form onSubmit={handleSubmit}>
            <h1 className="py-4 entry-form-title">Enter the competition</h1>
            <Row className="d-flex flex-column flex-md-row">
              <Col lg={6}>
                <FormInput
                  label="First Name"
                  type="text"
                  id="firstName"
                  required
                  disabled={true}
                  defaultValue={targetUser?.loggedIn ? targetUser.givenName || "" : ""}
                />
                <FormInput
                  label="Last Name"
                  type="text"
                  id="lastName"
                  required
                  disabled={true}
                  defaultValue={targetUser?.loggedIn ? targetUser?.familyName || "" : ""}
                />
                {targetUser && (
                  <FormGroup>
                    <Label className="entry-form-sub-title">
                      School <span className="entry-form-asterisk">*</span>
                    </Label>
                    <SchoolInput
                      disableInput={true}
                      userToUpdate={{ ...targetUser, password: null }}
                      submissionAttempted={false}
                      required
                      showLabel={false}
                    />
                  </FormGroup>
                )}
              </Col>
              <Col lg={6}>
                <FormInput
                  label="Link to a students' project"
                  type="text"
                  id="submissionLink"
                  required
                  disabled={false}
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                />
                <FormInput
                  label="Group"
                  subLabel="Please ensure each group has no more than 4 students."
                  type="select"
                  id="formGroup"
                  required
                  disabled={false}
                  options={["Please select from the list", ...activeGroups.map((group) => group.groupName || "")]}
                  activeGroups={activeGroups}
                  setSelectedGroup={(group) => setSelectedGroupId(group?.id || null)}
                />
                <MultiSelect
                  label="Select Group Members"
                  options={
                    selectedGroup?.members
                      ? selectedGroup.members.map((member) => ({
                          value: member.id?.toString() || "",
                          label:
                            `${member.givenName || ""} ${member.familyName || ""}`.trim() ||
                            `User ${member.id}` ||
                            "Unknown",
                        }))
                      : []
                  }
                  selectedValues={selectedMembers}
                  onChange={setSelectedMembers}
                  placeholder={
                    selectedGroup
                      ? selectedGroup.members && selectedGroup.members.length > 0
                        ? "Select group members to include in the competition..."
                        : "No members found in this group"
                      : "Please select a group first"
                  }
                  isRequired={true}
                />
                <Row className="entry-form-button-label d-flex flex-column flex-md-row">
                  <Col xs="auto">
                    <Input
                      className="btn-sm entry-form-button"
                      type="submit"
                      value="Submit"
                      disabled={isSubmitDisabled}
                    />
                  </Col>
                  <Col className="pl-0 mt-2 ml-3 mt-md-0">
                    <Label>
                      By entering the National Computer Science Competition you agree to the{" "}
                      <a href="#terms-and-conditions" onClick={handleTermsClick}>
                        Terms and Conditions
                      </a>
                      .
                    </Label>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>
    </div>
  );
};

export default CompetitionEntryForm;
