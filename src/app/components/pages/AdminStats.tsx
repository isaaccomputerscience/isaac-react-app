import React, { useEffect } from "react";
import { AppState, getAdminSiteStats, useAppDispatch, useAppSelector } from "../../state";
import { TitleAndBreadcrumb } from "../elements/TitleAndBreadcrumb";
import { ShowLoading } from "../handlers/ShowLoading";
import { asPercentage } from "../../services";
import { Container, Card, CardBody, Row, Col } from "reactstrap";

function addTotalToMapOfCounts(counts: { [key: string]: number }) {
  counts["TOTAL"] = 0;
  counts["TOTAL"] = Object.values(counts).reduce((a, b) => a + b, 0);
}

export const AdminStats = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(getAdminSiteStats());
  }, []);
  const adminStats = useAppSelector((state: AppState) => state?.adminStats || null);

  if (adminStats != null) {
    // Add total value to each of the active user ranges
    for (const timeRange in adminStats.activeUsersOverPrevious) {
      if (adminStats.activeUsersOverPrevious.hasOwnProperty(timeRange)) {
        addTotalToMapOfCounts(adminStats.activeUsersOverPrevious[timeRange]);
      }
    }
    // Add total value to each of the answered user ranges
    for (const timeRange in adminStats.answeringUsersOverPrevious) {
      if (adminStats.answeringUsersOverPrevious.hasOwnProperty(timeRange)) {
        addTotalToMapOfCounts(adminStats.answeringUsersOverPrevious[timeRange]);
      }
    }
    addTotalToMapOfCounts(adminStats.userGenders);
    addTotalToMapOfCounts(adminStats.userSchoolInfo);
  }

  return (
    <Container id="admin-stats-page">
      <TitleAndBreadcrumb currentPageTitle="Isaac statistics" breadcrumbTitleOverride="Admin statistics" />

      <ShowLoading until={adminStats}>
        {adminStats && (
          <React.Fragment>
            <div className="py-3">A high-level overview of the users and activity on the platform:</div>
            <Card className="mb-5 px-3 pt-1">
              <CardBody>
                <Row>
                  <Col>
                    <strong>Users:</strong>
                    <ul className="list-unstyled mb-5">
                      <li>
                        Last 6 months:&nbsp;
                        <strong>{(adminStats.activeUsersOverPrevious.SIX_MONTHS.TOTAL || 0).toLocaleString()}</strong>
                      </li>
                      <li>
                        Last 2 years:&nbsp;
                        <strong>{(adminStats.activeUsersOverPrevious.TWO_YEARS.TOTAL || 0).toLocaleString()}</strong>
                      </li>
                      <li>
                        Total accounts: <strong>{(adminStats.userGenders.TOTAL || 0).toLocaleString()}</strong>
                      </li>
                      <li className="mt-3">
                        <strong>Gender</strong>
                        <ul className="list-unstyled">
                          <li>
                            Male: {adminStats.userGenders.MALE || 0} (
                            {asPercentage(adminStats.userGenders.MALE, adminStats.userGenders.TOTAL)}%)
                          </li>
                          <li>
                            Female: {adminStats.userGenders.FEMALE || 0} (
                            {asPercentage(adminStats.userGenders.FEMALE, adminStats.userGenders.TOTAL)}%)
                          </li>
                          <li>
                            Other: {adminStats.userGenders.OTHER || 0} (
                            {asPercentage(adminStats.userGenders.OTHER, adminStats.userGenders.TOTAL)}%)
                          </li>
                          <li>
                            Prefer not to say: {adminStats.userGenders.PREFER_NOT_TO_SAY || 0} (
                            {asPercentage(adminStats.userGenders.PREFER_NOT_TO_SAY, adminStats.userGenders.TOTAL)}%)
                          </li>
                          <li>
                            Missing data: {adminStats.userGenders.UNKNOWN || 0} (
                            {asPercentage(adminStats.userGenders.UNKNOWN, adminStats.userGenders.TOTAL)}%)
                          </li>
                        </ul>
                      </li>
                      <li className="mt-3">
                        <strong>Role</strong>
                        <ul className="list-unstyled">
                          <li>Student: {adminStats.userRoles.STUDENT || 0}</li>
                          <li>Tutor: {adminStats.userRoles.TUTOR || 0}</li>
                          <li>Teacher: {adminStats.userRoles.TEACHER || 0}</li>
                          <li>Event Leader: {adminStats.userRoles.EVENT_LEADER || 0}</li>
                          <li>Content Editor: {adminStats.userRoles.CONTENT_EDITOR || 0}</li>
                          <li>Event Manager: {adminStats.userRoles.EVENT_MANAGER || 0}</li>
                          <li>Admin: {adminStats.userRoles.ADMIN || 0}</li>
                        </ul>
                      </li>
                      <li className="mt-3">
                        <strong>Profile Completion</strong>
                        <ul className="list-unstyled">
                          <li>
                            UK/IE school provided:{" "}
                            {(adminStats.userSchoolInfo.PROVIDED || 0) + (adminStats.userSchoolInfo.BOTH_PROVIDED || 0)}
                          </li>
                          <li>Other school provided: {adminStats.userSchoolInfo.OTHER_PROVIDED || 0}</li>
                          <li>No school provided: {adminStats.userSchoolInfo.NOT_PROVIDED || 0}</li>
                        </ul>
                      </li>
                    </ul>

                    <strong>Content Statistics</strong>
                    <ul className="list-unstyled">
                      <li>Question Page Views: {(adminStats.viewQuestionEvents || 0).toLocaleString()}</li>
                      <li>Total Question Attempts: {(adminStats.answeredQuestionEvents || 0).toLocaleString()}</li>
                      <li>Concept Page Views: {(adminStats.viewConceptEvents || 0).toLocaleString()}</li>
                    </ul>
                  </Col>
                  <Col>
                    <strong>Last Seen</strong>
                    <ul className="list-unstyled">
                      <li>
                        Previous 7 days:
                        <ul>
                          <li>All: {adminStats.activeUsersOverPrevious.SEVEN_DAYS.TOTAL || 0}</li>
                          <li>Teachers: {adminStats.activeUsersOverPrevious.SEVEN_DAYS.TEACHER || 0}</li>
                          <li>Students: {adminStats.activeUsersOverPrevious.SEVEN_DAYS.STUDENT || 0}</li>
                        </ul>
                      </li>
                      <li>
                        Previous 30 days:
                        <ul>
                          <li>All: {adminStats.activeUsersOverPrevious.THIRTY_DAYS.TOTAL || 0}</li>
                          <li>Teachers: {adminStats.activeUsersOverPrevious.THIRTY_DAYS.TEACHER || 0}</li>
                          <li>Students: {adminStats.activeUsersOverPrevious.THIRTY_DAYS.STUDENT || 0}</li>
                        </ul>
                      </li>
                      <li>
                        Previous 90 days:
                        <ul>
                          <li>All: {adminStats.activeUsersOverPrevious.NINETY_DAYS.TOTAL || 0}</li>
                          <li>Teachers: {adminStats.activeUsersOverPrevious.NINETY_DAYS.TEACHER || 0}</li>
                          <li>Students: {adminStats.activeUsersOverPrevious.NINETY_DAYS.STUDENT || 0}</li>
                        </ul>
                      </li>
                    </ul>

                    <strong>Answering Questions</strong>
                    <ul className="list-unstyled">
                      <li>
                        Previous 7 days:
                        <ul>
                          <li>All: {adminStats.answeringUsersOverPrevious.SEVEN_DAYS.TOTAL || 0}</li>
                          <li>Teachers: {adminStats.answeringUsersOverPrevious.SEVEN_DAYS.TEACHER || 0}</li>
                          <li>Students: {adminStats.answeringUsersOverPrevious.SEVEN_DAYS.STUDENT || 0}</li>
                        </ul>
                      </li>
                      <li>
                        Previous 30 days:
                        <ul>
                          <li>All: {adminStats.answeringUsersOverPrevious.THIRTY_DAYS.TOTAL || 0}</li>
                          <li>Teachers: {adminStats.answeringUsersOverPrevious.THIRTY_DAYS.TEACHER || 0}</li>
                          <li>Students: {adminStats.answeringUsersOverPrevious.THIRTY_DAYS.STUDENT || 0}</li>
                        </ul>
                      </li>
                      <li>
                        Previous 90 days:
                        <ul>
                          <li>All: {adminStats.answeringUsersOverPrevious.NINETY_DAYS.TOTAL || 0}</li>
                          <li>Teachers: {adminStats.answeringUsersOverPrevious.NINETY_DAYS.TEACHER || 0}</li>
                          <li>Students: {adminStats.answeringUsersOverPrevious.NINETY_DAYS.STUDENT || 0}</li>
                        </ul>
                      </li>
                    </ul>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </React.Fragment>
        )}
      </ShowLoading>
    </Container>
  );
};
