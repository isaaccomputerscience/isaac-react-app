import { fireEvent, screen, waitFor } from "@testing-library/react";
import { TestUserRole, checkPageTitle, renderTestEnvironment } from "../utils";
import { WorkbookDownload } from "../../app/components/pages/WorkbookDownload";
import { API_PATH } from "../../app/services";
import { rest } from "msw";
import * as actions from "../../app/state/actions";
import * as download from "../../app/components/handlers/downloadWorkbook";

const errorMessageSpy = jest.spyOn(actions, "showAxiosErrorToastIfNeeded");
const downloadSpy = jest.spyOn(download, "downloadWorkbook");

const getButtons = () => {
  const gcseButton = () =>
    screen.getByRole("button", {
      name: /download gcse workbook/i,
    });
  const aqaButton = () =>
    screen.getByRole("button", {
      name: /download aqa workbook/i,
    });
  const ocrButton = () =>
    screen.getByRole("button", {
      name: /download ocr workbook/i,
    });
  return { gcseButton, aqaButton, ocrButton };
};

const renderWorkbookDownload = (role: TestUserRole) => {
  renderTestEnvironment({
    role: role,
    PageComponent: WorkbookDownload,
    initialRouteEntries: ["/workbook-download"],
    extraEndpoints: [
      rest.get(
        API_PATH +
          `/documents/content/books/gcse_book_23/isaac_cs_gcse_book_2023.pdf`,
        (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ data: "this is a book" }));
        }
      ),
      rest.get(
        API_PATH +
          `/documents/content/books/workbook_20_aqa/isaac_cs_aqa_book_2022.pdf`,
        (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ data: "this is a book" }));
        }
      ),
      rest.get(
        API_PATH +
          `/documents/content/books/workbook_20_ocr/isaac_cs_ocr_book_2022.pdf`,
        (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ data: "this is a book" }));
        }
      ),
    ],
  });
};

const buttons = ["GCSE", "OCR", "AQA"];

describe("WorkbookDownload Component", () => {
  it("renders the buttons", () => {
    renderWorkbookDownload("TEACHER");
    checkPageTitle("Isaac CS Workbook PDF Downloader");
    const { gcseButton, aqaButton, ocrButton } = getButtons();
    [gcseButton(), aqaButton(), ocrButton()].forEach((button) => {
      expect(button).toBeInTheDocument();
    });
  });

  it.each(buttons)(
    "clicking on the button requests a download for the %s workbook",
    async (button) => {
      renderWorkbookDownload("TEACHER");
      const { gcseButton, aqaButton, ocrButton } = getButtons();
      const buttonElement = {
        GCSE: gcseButton(),
        AQA: aqaButton(),
        OCR: ocrButton(),
      }[button];
      buttonElement && fireEvent.click(buttonElement);
      await waitFor(() => {
        expect(downloadSpy).toHaveBeenCalledWith(expect.any(Function), button);
      });
    }
  );

  it("displays an error popup if handleDownload encounters an error", async () => {
    renderTestEnvironment({
      role: "TEACHER",
      PageComponent: WorkbookDownload,
      initialRouteEntries: ["/workbook-download"],
      extraEndpoints: [
        rest.get(
          API_PATH +
            `/documents/content/books/gcse_book_23/isaac_cs_gcse_book_2023.pdf`,
          (req, res, ctx) => {
            return res(
              ctx.status(404),
              ctx.json({
                responseCode: 404,
                responseCodeType: "Not Found",
                errorMessage:
                  "Unable to locate the file: content/books/gcse_book_23/isaac_cs_gcse_book_2023.pdf.",
                bypassGenericSiteErrorPage: false,
              })
            );
          }
        ),
      ],
    });
    const { gcseButton } = getButtons();
    fireEvent.click(gcseButton());
    await waitFor(() => {
      expect(errorMessageSpy).toHaveBeenCalled();
    });
  });
});
