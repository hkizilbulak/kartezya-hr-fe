"use client";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/tr';
import dayjs from 'dayjs';

// Set default locale to Turkish
dayjs.locale('tr');

type Props = {
  children?: React.ReactNode;
};

export const NextAuthProvider = ({ children }: Props) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
      {children}
    </LocalizationProvider>
  );
};
