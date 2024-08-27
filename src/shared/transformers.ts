import { TransformFnParams } from 'class-transformer';

export const transformValueToNumber = ({ value }: TransformFnParams) =>
  Number(value);
