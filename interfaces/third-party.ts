import { IExpense } from '@/interfaces/expense';
import { IFinancialDeadline } from './deadline';
import { IModality } from './modality';

interface IAddress {
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string | null;
  cityCode: string | null;
  country: string;
  countryGeoZone: string;
  postalCode: string | null;
}

export interface IThirdParty {
  id: string;
  thirdParty: string;
  fullname: string;
  thirdPartyFullname: string;
  shortname: string;
  thirdPartyRole: string;
  active: boolean;
  coordinator: boolean;
  signatory: boolean;
  siret?: string;
  duns?: string;
  financialDeadlines: IFinancialDeadline[];
  diffusable?: boolean;
  address?: IAddress;
  mainActivity: string;
  employeesRange: string;
  legalStatus: string;
  isHeadquarters: boolean;
  countryGeoZone: string;
  lockedFields: string[];
}

export interface IThirdPartyExpense extends IThirdParty {
  expenses: IExpense[];
  aidModalities: IModality[];
  aidTotalAmount: number;
  remainingTotalAmount: number;
  financingAidRequest: string;
}

export interface IThirdPartyDeadline extends IThirdParty {
  financialDeadlines: IFinancialDeadline[];
  aidTotalAmount?: number;
  totalPayed?: number;
  percentPayed?: number;
}

export interface IThirdPartyGouv extends Omit<IThirdParty, 'address' | 'isHeadquarters'> {
  address: string;
  isHeadquarters: string;
  mode: string;
  mainActivityLabel: string;
  employeesRangeLabel: string;
  legalStatusLabel: string;
  closingDate?: null | string;
}
