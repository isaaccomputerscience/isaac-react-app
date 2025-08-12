import React, { useState } from "react";
import { Button, Badge } from "reactstrap";

interface CustomMultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  isRequired?: boolean;
  label?: string;
}

const CustomMultiSelect = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options...",
  isRequired = false,
  label = "Multi-select field",
}: CustomMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeValue = (value: string) => {
    onChange(selectedValues.filter((v) => v !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, value: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(value);
    }
  };

  return (
    <div className="position-relative">
      <label htmlFor="multi-select-control" className={isRequired ? "form-required" : ""}>
        {label}
      </label>
      <div
        id="multi-select-control"
        className="border rounded p-2"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="multi-select-listbox"
        tabIndex={0}
      >
        <div className="d-flex flex-wrap gap-1">
          {selectedValues.length === 0 ? (
            <span className="text-muted">{placeholder}</span>
          ) : (
            selectedValues.map((value) => {
              const option = options.find((opt) => opt.value === value);
              return (
                <Badge key={value} color="secondary" className="d-flex align-items-center">
                  {option?.label}
                  <Button
                    size="sm"
                    color="link"
                    className="p-0 ms-1 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeValue(value);
                    }}
                  >
                    ×
                  </Button>
                </Badge>
              );
            })
          )}
        </div>
        <div className="position-absolute end-0 top-50 translate-middle-y me-2">▼</div>
      </div>

      {isOpen && (
        <div
          id="multi-select-listbox"
          className="position-absolute w-100 border rounded bg-white mt-1"
          style={{ zIndex: 1000 }}
          role="listbox"
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`p-2 cursor-pointer ${selectedValues.includes(option.value) ? "bg-light" : ""}`}
              onClick={() => handleSelect(option.value)}
              onKeyDown={(e) => handleOptionKeyDown(e, option.value)}
              role="option"
              aria-selected={selectedValues.includes(option.value)}
              tabIndex={0}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomMultiSelect;
