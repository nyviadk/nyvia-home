import { todayISODate } from '@/lib/datetime';
import type { CustomLoanInput } from '../data/loans.repository';

/** Et tomt custom flytte-lån med fornuftige standardværdier. */
export function emptyCustomLoan(): CustomLoanInput {
  return {
    type: 'custom',
    name: '',
    payee: { regNo: '', accountNo: '', bankName: '' },
    lineItems: [],
    newHome: { title: 'Ny bolig', rows: [] },
    oldHome: { title: 'Nuværende bolig', rows: [] },
    buffer: { amount: 0, enabled: false },
    horizon: 'asap',
    startMonth: todayISODate().slice(0, 7),
    actuals: {},
  };
}
