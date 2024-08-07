import {BoxProps, Card} from "@0xsequence/design-system";

import React, {ReactNode} from "react";

import {SelectedIndicator} from "./SelectedIndicator";

export interface SelectButtonProps extends BoxProps {
  children?: ReactNode;
  className?: string;
  onClick: (value: any) => void;
  value: any;
  selected: boolean;
  disabled?: boolean;
  hideIndicator?: boolean;
}

export const SelectButton = (props: SelectButtonProps) => {
  const {
    value,
    selected,
    children,
    disabled,
    onClick,
    className,
    hideIndicator,
    ...rest
  } = props;

  return (
    <Card
      as="button"
      clickable
      className={className}
      disabled={disabled}
      onClick={() => onClick(value)}
      userSelect="none"
      alignItems="center"
      justifyContent="space-between"
      textAlign="left"
      width="full"
      style={{
        appearance: "none"
      }}
      {...rest}>
      {children}

      {!hideIndicator && <SelectedIndicator selected={selected} />}
    </Card>
  );
};
