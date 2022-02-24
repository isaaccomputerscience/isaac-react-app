import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {AppState} from "../../state/reducers";
import {
    Badge,
    Collapse,
    DropdownItem,
    DropdownItemProps,
    DropdownMenu,
    DropdownToggle,
    Nav,
    Navbar,
    NavbarToggler,
    NavLink,
    UncontrolledDropdown
} from "reactstrap";
import {loadMyAssignments} from "../../state/actions";
import {filterAssignmentsByStatus} from "../../services/assignments";
import {selectors} from "../../state/selectors";
import {SITE, SITE_SUBJECT} from "../../services/siteConstants";
import {loadQuizAssignedToMe} from "../../state/actions/quizzes";
import {partitionCompleteAndIncompleteQuizzes} from "../../services/quiz";
import {isFound} from "../../services/miscUtils";
import {RenderNothing} from "../elements/RenderNothing";


const MenuOpenContext = React.createContext<{menuOpen: boolean; setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>}>({
    menuOpen: false, setMenuOpen: () => {}
});

export const LinkItem = ({children, muted, badgeTitle, ...props}: React.PropsWithChildren<DropdownItemProps & {muted?: boolean, badgeTitle?: string}>) => (
    <DropdownItem tag={Link} className={`pl-4 py-3 p-md-3 ${muted ? "text-muted" : ""}`} {...props}>
        {children}
        {badgeTitle && <Badge color="light" className="border-secondary border bg-white ml-2 mr-1">{badgeTitle}</Badge>}
    </DropdownItem>
);

export const LinkItemComingSoon = ({children}: {children: React.ReactNode}) => (
    <LinkItem to="/coming_soon" aria-disabled="true">
        <span className="mr-2 text-muted">{children}</span>
        <Badge  color="light" className="border-secondary border bg-white ml-auto mr-1">Coming soon</Badge>
    </LinkItem>
);

interface NavigationSectionProps {children: React.ReactNode; title: React.ReactNode; topLevelLink?: boolean; to?: string}
export const NavigationSection = ({children, title, topLevelLink, to}: NavigationSectionProps) => (
    <MenuOpenContext.Consumer>
        {({setMenuOpen}) => <UncontrolledDropdown nav inNavbar>
            {topLevelLink ?
                <NavLink className="p-3 ml-3 mr-3" tag={Link} to={to} onClick={() => setMenuOpen(false)}>{title}</NavLink> :
                <DropdownToggle nav caret className="p-3 ml-3 mr-3">{title}</DropdownToggle>}
            <DropdownMenu className="p-3 pt-0 m-0 mx-lg-4" onClick={() => setMenuOpen(false)}>
                {children}
            </DropdownMenu>
        </UncontrolledDropdown>}
    </MenuOpenContext.Consumer>
);

export function MenuBadge({count, message}: {count: number, message: string}) {
    if (count == 0) {
        return RenderNothing;
    }
    return <React.Fragment>
        <span className="badge badge-pill bg-grey ml-2">{count}</span>
        <span className="sr-only">{message}</span>
    </React.Fragment>;
}

export function useAssignmentsCount() {
    const dispatch = useDispatch();
    const user = useSelector(selectors.user.orNull);

    useEffect(() => {
        if (user?.loggedIn) {
            dispatch(loadMyAssignments());
            dispatch(loadQuizAssignedToMe());
        }
    }, [dispatch, user]);

    return useSelector((state: AppState) => {
        const response = {assignmentsCount: 0, quizzesCount: 0};
        if (state?.assignments) {
            const {inProgressRecent} = filterAssignmentsByStatus(state.assignments);
            response.assignmentsCount = inProgressRecent.length;
        }
        if (state && isFound(state.quizAssignedToMe)) {
            const [_completedQuizzes, incompleteQuizzes] = partitionCompleteAndIncompleteQuizzes(state.quizAssignedToMe);
            response.quizzesCount = incompleteQuizzes.length;
        }
        return response;
    });
}

export const NavigationBar = ({children}: {children: React.ReactNode}) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return <MenuOpenContext.Provider value={{menuOpen, setMenuOpen}}>
        <Navbar className="main-nav p-0" color="light" light expand="md">
            <NavbarToggler onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
                Menu
            </NavbarToggler>

            <Collapse isOpen={menuOpen} navbar className={`px-0 mx-0 mx-xl-5 ${SITE_SUBJECT === SITE.CS ? "px-xl-5" : ""}`}>
                <Nav navbar className="justify-content-between" id="main-menu">
                    {children}
                </Nav>
            </Collapse>
        </Navbar>
    </MenuOpenContext.Provider>
};
