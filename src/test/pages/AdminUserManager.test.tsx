import { UserRole } from "../../IsaacApiTypes";
import { AdminUserManager } from "../../app/components/pages/AdminUserManager";
import { checkPageTitle, renderTestEnvironment } from "../utils";

describe("Admin User Manager", () => {
  const renderUserManager = ({ role = "ADMIN" }: { role?: UserRole } = {}) => {
    renderTestEnvironment({
      role: role,
      PageComponent: AdminUserManager,
      initialRouteEntries: ["/admin/usermanager"],
    });
  };

  it("Admin User Manager renders", () => {
    renderUserManager();
    checkPageTitle("User manager");
  });
});
