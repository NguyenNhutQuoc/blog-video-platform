import React from 'react';
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
} from '@mui/material';

export type InputProps = MuiTextFieldProps;

export const Input: React.FC<InputProps> = (props) => {
  return <MuiTextField variant="outlined" fullWidth {...props} />;
};

export default Input;
