import React, { useEffect, useState } from "react";
import { Form, Row, Col, Container, FormGroup, Label, Input } from "reactstrap";
import { InputType } from "reactstrap/es/Input";
import { AppGroup } from "../../../../../IsaacAppTypes";
import { isaacApi, useAppSelector, useAppDispatch, AppDispatch } from "../../../../state";
import { selectors } from "../../../../state/selectors";
import { SchoolInput } from "../../../elements/inputs/SchoolInput";
import { api } from "../../../../services";
import { showErrorToast, showSuccessToast } from "../../../../state/actions/popups";

const COMPETITON_ID = "isaac_competition_25";
interface CompetitionEntryFormProps {
  handleTermsClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const CompetitionEntryForm = ({ handleTermsClick }: CompetitionEntryFormProps) => {
  const [activeGroups, setActiveGroups] = useState<AppGroup[]>([]);
  const { data: groups } = isaacApi.endpoints.getGroups.useQuery(false);
  const [getGroupMembers] = isaacApi.endpoints.getGroupMembers.useLazyQuery();
  const targetUser = useAppSelector(selectors.user.orNull);
  const [selectedGroup, setSelectedGroup] = useState<AppGroup | null>(null);
  const dispatch: AppDispatch = useAppDispatch();

  useEffect(() => {
    if (groups) {
      setActiveGroups(groups);
    }
  }, [groups]);

  useEffect(() => {
    if (selectedGroup?.id && !selectedGroup.members) {
      getGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  const renderFormGroup = (
    label: string,
    type: string,
    id: string,
    defaultValue: string = "",
    options: string[] = [],
    disabled: boolean = false,
  ) => (
    <FormGroup>
      <Label className="entry-form-sub-title">{label}</Label>
      {type === "select" ? (
        <Input
          type="select"
          id={id}
          disabled={disabled}
          onChange={(e) => setSelectedGroup(activeGroups.find((group) => group.groupName === e.target.value) || null)}
        >
          {options?.length > 0 &&
            options.map((option, index) => (
              <option key={index} value={option === "Please select from the list" ? "" : option}>
                {option}
              </option>
            ))}
        </Input>
      ) : (
        <Input type={type as InputType} id={id} defaultValue={defaultValue} disabled={disabled} />
      )}
    </FormGroup>
  );

  const reserveUsersOnCompetition = async (
    eventId: string,
    userIds: number[],
    submissionLink: string,
    groupName?: string,
  ) => {
    try {
      await api.eventBookings.reserveUsersOnCompetition(eventId, userIds, submissionLink, groupName || "");
      setSelectedGroup(null);
      dispatch(showSuccessToast("Competition Entry Success", "Competition entry was successful."));
    } catch (error) {
      console.error("Error reserving users on competition:", error);
      dispatch(showErrorToast("Competition Entry Failed", "Failed to make the competiton entry."));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      const elements = form.elements as any;
      const groupId = elements.formGroup.value;
      const selectedGroup = activeGroups.find((group) => group.groupName === groupId);
      const submissionLink = elements.submissionLink.value;
      const groupName = selectedGroup?.groupName;

      if (selectedGroup && selectedGroup.id) {
        const reservableIds = (selectedGroup.members?.map((member) => member.id) || []).filter(
          (id): id is number => id !== undefined,
        );
        reserveUsersOnCompetition(COMPETITON_ID, reservableIds, submissionLink, groupName);
      }
    }
  };

  return (
    <div className="py-5">
      <div className="entry-form-background-img entry-form-section">
        <Container className="pb-2">
          <Form onSubmit={handleSubmit}>
            <h1 className="py-4 entry-form-title">Enter the competition</h1>
            <Row className="d-flex flex-column flex-md-row">
              <Col lg={6}>
                {renderFormGroup(
                  "First Name",
                  "text",
                  "formSubtitle1",
                  targetUser?.loggedIn ? targetUser.givenName || "" : "",
                  [],
                  true,
                )}
                {renderFormGroup(
                  "Last Name",
                  "text",
                  "formSubtitle2",
                  targetUser?.loggedIn ? targetUser?.familyName || "" : "",
                  [],
                  true,
                )}
                {targetUser && (
                  <FormGroup>
                    <Label className="entry-form-sub-title">School</Label>
                    <SchoolInput
                      disableInput={true}
                      userToUpdate={{ ...targetUser, password: null }}
                      submissionAttempted={false}
                      required={true}
                      showLabel={false}
                    />
                  </FormGroup>
                )}
              </Col>
              <Col lg={6}>
                {renderFormGroup("Link to submission", "text", "submissionLink")}
                {renderFormGroup("Group", "select", "formGroup", "", [
                  "Please select from the list",
                  ...activeGroups.map((group) => group.groupName || ""),
                ])}
                <Row className="entry-form-button-label d-flex flex-column flex-md-row">
                  <Col xs="auto">
                    <Input className="btn-sm entry-form-button" type="submit" value="Submit" />
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
