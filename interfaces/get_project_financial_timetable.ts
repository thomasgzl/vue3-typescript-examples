// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GetProjectFinancialTimetable {
  export interface Response {
    project: string;
    beneficiaries: Beneficiary[];
  }

  export interface Beneficiary {
    id: string;
    shortname: string;
    fullname: string;
    active: boolean;
    siret: string;
    duns: null;
    financialDeadlines: FinancialDeadline[];
    aidTotalAmount: number;
    totalPayed: number;
    percentPayed: number;
    remainingTotalAmount: number;
    contractualDurationEndDate: Date;
    nextDeadlineDate: Date;
    nextBalanceDeadlineDate: Date | null;
  }

  export interface FinancialDeadline {
    id: string;
    type: string;
    description: null;
    previsionalAidPercent: number;
    maxAmount: number;
    previsionalDate: Date;
    eligibleExpensesPercent: number;
    comment: null;
    toPayAmount: number;
    declaredAmount: null;
    keptAmount: null;
    bankDomiciliation: string;
    expenseAccount: null;
    authorisingComment: null;
    accountingComment: null;
    refusalComment: null;
    refusalAuthor: null;
    supportingFinancialDocumentList: SupportingFinancialDocumentList[];
    technicalDeadlineList: any[];
    otherSupportingDocumentList: any[];
    budgetaryNature: BudgetaryNature;
    financialDeadlineStatus: FinancialDeadlineStatus;
    certificationWorkflowStatus: null;
    admiliaDpNumber: null;
    admiliaDvNumber: null;
    authorizingOfficer: null;
    certificationDate: null;
    transacDate: null;
    transacAuthor: null;
    ascertainmentDate: null;
    globalPaymentPeriod: null;
    paidDate: null;
    refusalDate: null;
    technicalStatus: string;
  }

  export interface BudgetaryNature {
    id: string;
    value: string;
  }

  export interface FinancialDeadlineStatus {
    code: string;
    id: string;
    value: string;
  }

  export interface SupportingFinancialDocumentList {
    id: string;
    supportingFinancialDocumentType: FinancialDeadlineStatus;
    supportingDocumentStatus: FinancialDeadlineStatus;
    statementDate: null;
    validationDate: null;
    validator: null;
    nonCompliantComment: null;
    isConform: null;
  }
}
