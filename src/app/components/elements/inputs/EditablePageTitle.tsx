import React, { useEffect, useState } from "react";
import { Button, Input, Row } from "reactstrap";

export const EditablePageTitle = ({
  currentPageTitle,
  onEdit,
}: {
  currentPageTitle: string;
  onEdit: (arg0: string) => void;
}) => {
  const [newTitle, setNewTitle] = useState<string>(currentPageTitle);
  const [toggleEdit, setToggleEdit] = useState<boolean>(false);

  useEffect(() => {
    setNewTitle(currentPageTitle ?? "");
  }, [currentPageTitle]);

  const handleEdit = () => {
    if (newTitle !== "" && newTitle !== currentPageTitle) {
      onEdit(newTitle);
    }
    setToggleEdit(false);
  };

  return (
    <Row noGutters className="flex-sm-nowrap align-items-center title-edit">
      {toggleEdit ? (
        <Input
          type="text"
          placeholder={newTitle}
          onBlur={(e) => {
            setNewTitle(e.target.value);
          }}
        />
      ) : (
        currentPageTitle
      )}
      <Button
        size="sm"
        className="ml-1 ml-sm-2 my-2 p-0"
        onClick={(e) => {
          e.currentTarget.blur();
          toggleEdit ? handleEdit() : setToggleEdit(true);
        }}
        color="primary"
        block
        outline
      >
        {toggleEdit ? "Save" : "Edit"}
      </Button>
    </Row>
  );
};
