import React, { useEffect, useState } from "react";
import { Form, Row, Col, Container, FormGroup, Label, Input, Alert } from "reactstrap";
import { isaacApi, useAppSelector } from "../../../../state";
import { selectors } from "../../../../state/selectors";
import { SchoolInput } from "../../../elements/inputs/SchoolInput";
import FormInput from "./FormInput";
import { useReserveUsersOnCompetition } from "./useReserveUsersOnCompetition";
import { useActiveGroups } from "./useActiveGroups";
import Select from "react-select";

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
  const [memberSelectionError, setMemberSelectionError] = useState<string>("");

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

  const handleMemberSelection = (selectedOptions: any) => {
    const selectedValues = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];

    if (selectedValues.length > 4) {
      setMemberSelectionError("You can only select up to 4 students");
      return;
    }

    setMemberSelectionError("");
    setSelectedMembers(selectedValues);
  };

  const isSubmitDisabled = !submissionLink || !selectedGroup || selectedMembers.length === 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const elements = form.elements;
    const groupId = (elements.namedItem("formGroup") as HTMLSelectElement).value;
    const selectedGroup = activeGroups.find((group) => group.groupName === groupId);
    const submissionLink = (elements.namedItem("submissionLink") as HTMLInputElement).value;
    const groupName = selectedGroup?.groupName;

    if (selectedGroup?.id && selectedMembers.length > 0) {
      // Convert selected member IDs from strings to numbers
      const reservableIds = selectedMembers
        .map((memberId) => Number.parseInt(memberId, 10))
        .filter((id) => !Number.isNaN(id));
      reserveUsersOnCompetition(COMPETITON_ID, reservableIds, submissionLink, groupName);
    }

    setSubmissionLink("");
    setSelectedMembers([]);
    setSelectedGroupId(null);
    (elements.namedItem("formGroup") as HTMLSelectElement).selectedIndex = 0;
  };

  // Extract the nested ternary into a function
  const getPlaceholderText = () => {
    if (memberSelectionError) {
      return memberSelectionError;
    }

    if (selectedGroup) {
      if (selectedGroup.members && selectedGroup.members.length > 0) {
        return "Choose students from your selected group";
      }
      return "No members found in this group";
    }

    return "Please select a group first";
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
                      My current school or college <span className="entry-form-asterisk">*</span>
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
                  label="URL link to a students project"
                  type="text"
                  id="submissionLink"
                  required
                  disabled={false}
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                />
                <FormInput
                  label="Select a group"
                  subLabel="Please ensure each group has no more than 4 students."
                  type="select"
                  id="formGroup"
                  required
                  disabled={false}
                  options={[
                    "Choose from the groups you've created or create one first",
                    ...activeGroups.map((group) => group.groupName || ""),
                  ]}
                  activeGroups={activeGroups}
                  setSelectedGroup={(group) => setSelectedGroupId(group?.id || null)}
                />
                <Label className="entry-form-sub-title">
                  Select student(s) <span className="entry-form-asterisk">*</span>
                  {memberSelectionError && (
                    <Alert color="danger" className="mb-2" style={{ zIndex: 9999, position: "relative" }}>
                      {memberSelectionError}
                    </Alert>
                  )}
                  <Select
                    inputId="group-members-select"
                    isMulti
                    required
                    isClearable
                    placeholder={getPlaceholderText()}
                    value={
                      selectedGroup?.members
                        ? selectedGroup.members
                            .filter((member) => selectedMembers.includes(member.id?.toString() || ""))
                            .map((member) => ({
                              value: member.id?.toString() || "",
                              label:
                                `${member.givenName || ""} ${member.familyName || ""}`.trim() ||
                                `User ${member.id}` ||
                                "Unknown",
                            }))
                        : []
                    }
                    onChange={handleMemberSelection}
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
                    // isDisabled={!selectedGroup || !selectedGroup.members || selectedGroup.members.length === 0}
                    //below code is consise version of the above code. Please revert to the above code if its confusing to read and understand. SonarQube complained about the above code.
                    isDisabled={!selectedGroup?.members?.length}
                    closeMenuOnSelect={false}
                    maxMenuHeight={200}
                    styles={{
                      menu: (provided) => ({
                        ...provided,
                        zIndex: 9998,
                      }),
                    }}
                  />
                </Label>
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
