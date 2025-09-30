import React, { useEffect, useState } from "react";
import { Form, Row, Col, Container, FormGroup, Label, Input, Alert } from "reactstrap";
import { isaacApi, useAppSelector } from "../../../../state";
import { selectors } from "../../../../state/selectors";
import { SchoolInput } from "../../../elements/inputs/SchoolInput";
import FormInput from "./FormInput";
import { useReserveUsersOnCompetition } from "./useReserveUsersOnCompetition";
import { useActiveGroups } from "./useActiveGroups";
import Select from "react-select";
import CustomTooltip from "../../../elements/CustomTooltip";

const COMPETITON_ID = "20250131_isaac_competition";
interface CompetitionEntryFormProps {
  handleTermsClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const CompetitionEntryForm = ({ handleTermsClick }: CompetitionEntryFormProps) => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const activeGroups = useActiveGroups();
  const [getGroupMembers] = isaacApi.endpoints.getGroupMembers.useLazyQuery();
  const targetUser = useAppSelector(selectors.user.orNull);
  const reserveUsersOnCompetition = useReserveUsersOnCompetition();
  // const [submissionLink, setSubmissionLink] = useState("");
  const [memberSelectionError, setMemberSelectionError] = useState<string>("");
  const [userToUpdate, setUserToUpdate] = useState(targetUser ? { ...targetUser, password: null } : { password: null });

  // Create a wrapper function for setUserToUpdate
  const handleUserUpdate = (user: any) => {
    setUserToUpdate(user);
  };

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

  const isSubmitDisabled = !projectTitle || !projectLink || !selectedGroup || selectedMembers.length === 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const elements = form.elements;
    const groupId = (elements.namedItem("formGroup") as HTMLSelectElement).value;
    const selectedGroup = activeGroups.find((group) => group.groupName === groupId);
    const groupName = selectedGroup?.groupName;

    if (selectedGroup?.id && selectedMembers.length > 0) {
      const reservableIds = selectedMembers
        .map((memberId) => Number.parseInt(memberId, 10))
        .filter((id) => !Number.isNaN(id));
      reserveUsersOnCompetition(COMPETITON_ID, reservableIds, projectLink, groupName);
    }

    setProjectTitle("");
    setProjectLink("");
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

            {/* Your account information section */}
            <h2 className="py-3 entry-form-section-title">Your account information</h2>
            <Row className="d-flex flex-column flex-md-row">
              <Col lg={6}>
                <FormInput
                  label="First name"
                  type="text"
                  id="firstName"
                  required
                  disabled={true}
                  defaultValue={targetUser?.loggedIn ? targetUser.givenName || "" : ""}
                />
                <FormInput
                  label="Last name"
                  type="text"
                  id="lastName"
                  required
                  disabled={true}
                  defaultValue={targetUser?.loggedIn ? targetUser?.familyName || "" : ""}
                />
              </Col>
              <Col lg={6}>
                <FormInput
                  label="Email address"
                  type="email"
                  id="email"
                  required
                  disabled={true}
                  defaultValue={targetUser?.loggedIn ? targetUser?.email || "" : ""}
                />
                {targetUser && (
                  <FormGroup>
                    <Label className="entry-form-sub-title">
                      My current school or college <span className="entry-form-asterisk">*</span>
                    </Label>
                    <SchoolInput
                      userToUpdate={userToUpdate}
                      setUserToUpdate={handleUserUpdate}
                      submissionAttempted={false}
                      disableInput={true}
                      required={true}
                      showLabel={false}
                    />
                  </FormGroup>
                )}
              </Col>
            </Row>

            {/* Project details section */}
            <h2 className="py-3 entry-form-section-title">Project details</h2>
            <Row>
              <Col lg={6}>
                <FormInput
                  label="Project title"
                  type="text"
                  id="projectTitle"
                  required
                  disabled={false}
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="E.g., SmartLab"
                />
              </Col>
              <Col lg={6}>
                <FormInput
                  label="Project link"
                  type="url"
                  id="projectLink"
                  required
                  disabled={false}
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                  placeholder="Add a link to a project saved in the cloud (e.g., Google Drive, Dropbox)"
                  tooltipMessage="Upload your project to cloud storage (e.g., Google Drive, OneDrive, Dropbox) and paste the share link here. The link must be set to 'Anyone with the link can view'."
                />
              </Col>
            </Row>

            {/* Your students section */}
            <h2 className="py-3 entry-form-section-title">Your students</h2>
            <Row>
              <Col lg={12}>
                <a href="/groups" className="mb-3" style={{ color: "#1D70B8", textDecoration: "underline" }}>
                  Manage students and groups here
                </a>
              </Col>
            </Row>
            <Row>
              <Col lg={6}>
                <FormInput
                  label="Select your student group"
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
                  tooltipMessage="Choose one of the groups you have created that includes the student(s) who worked on the project. If no groups are available, go to Teachers > Manage Groups to create one and invite students to join."
                />
              </Col>
              <Col lg={6}>
                <FormGroup>
                  <Label className="entry-form-sub-title">
                    Select student(s) <span className="entry-form-asterisk">*</span>
                    <CustomTooltip
                      id="student-selection-tooltip"
                      message="Choose 1-4 students from the selected group who worked on the submitted project."
                    />
                    {memberSelectionError && (
                      <Alert color="danger" className="mb-2" style={{ zIndex: 9999, position: "relative" }}>
                        {memberSelectionError}
                      </Alert>
                    )}
                  </Label>
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
                    isDisabled={!selectedGroup?.members?.length}
                    closeMenuOnSelect={false}
                    maxMenuHeight={200}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        border: "1px solid #ced4da",
                        borderRadius: "0.375rem",
                        minHeight: "38px",
                        backgroundColor: !selectedGroup?.members?.length ? "#f8f9fa" : "white",
                      }),
                      menu: (provided) => ({
                        ...provided,
                        zIndex: 9998,
                      }),
                    }}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row className="justify-content-center mt-4">
              <Col className="text-center">
                <Label>
                  By entering the National Computer Science Competition you agree to the{" "}
                  <a href="#terms-and-conditions" onClick={handleTermsClick} style={{ color: "#1D70B8" }}>
                    Terms and Conditions
                  </a>
                  .
                </Label>
              </Col>
            </Row>
            <Row className="entry-form-button-label justify-content-center inline-block mb-5">
              <Input
                className="btn btn-xl btn-secondary border-0 form-control"
                type="submit"
                disabled={isSubmitDisabled}
                value="Submit competition entry"
              />
            </Row>
          </Form>
        </Container>
      </div>
    </div>
  );
};

export default CompetitionEntryForm;
