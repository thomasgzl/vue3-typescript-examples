import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { IBudget } from '@/interfaces/budget';
import { ICluster } from '@/interfaces/cluster';

export function parseFormatBudgetToArrayOfYears(data: IBudget[], cluster: ICluster) {
  const sheets: IBudget[] = [];
  // reformat all data to array of years containing array of budget
  data.forEach((budget) => {
    budget.uuid = uuid();
    const alreadySheetYearCreated = sheets.find((item) => {
      return item.year === budget.year;
    });
    let sheet;
    if (alreadySheetYearCreated) {
      sheet = alreadySheetYearCreated;
      sheet.budgetaryAllocations.push(budget);
    } else {
      sheet = {
        uuid: uuid(),
        year: budget.year,
        hasComboNotUnique: false,
        budgetaryAllocations: [budget]
      };
      sheets.push(sheet);
    }
  });

  // sort all sheets by year
  sheets.sort((a, b) => {
    if (a.year < b.year) return -1;
    /* c8 ignore else */
    if (a.year > b.year) return 1;
    /* c8 ignore next */
    return 0;
  });

  /* c8 ignore else */
  if (cluster.startDate) {
    // init with the startDate year if empty data or bad start data
    const startYear = dayjs(cluster.startDate).year();
    /* c8 ignore else */
    if (sheets.length === 0 || sheets[0].year > startYear) {
      sheets.splice(0, 0, {
        uuid: uuid(),
        year: startYear,
        hasComboNotUnique: false,
        budgetaryAllocations: []
      });
    }
  }

  // check if there is no missing step years + store them
  let missingSheetNextYear: IBudget[] = [];
  const scanMissingYears = () => {
    missingSheetNextYear = [];
    sheets.forEach((sheet, index) => {
      if (index < sheets.length - 1 && sheet.year + 1 < sheets[index + 1].year) {
        missingSheetNextYear.push(sheet);
      }
    });
  };
  scanMissingYears();

  // add missing years
  while (missingSheetNextYear.length) {
    missingSheetNextYear.forEach((sheet) => {
      const index = sheets.findIndex((she) => {
        return she.year === sheet.year;
      });
      /* c8 ignore else */
      if (index > -1) {
        sheets.splice(index + 1, 0, {
          uuid: uuid(),
          year: sheet.year + 1,
          hasComboNotUnique: false,
          budgetaryAllocations: []
        });
      }
    });
    scanMissingYears();
  }

  return sheets;
}

export function parseReferentials(data: any, itemUsed: (item: any, prop: string) => boolean) {
  const response: any = {};

  // si full load
  if (data.get_budgetary_subprogram_list && data.get_budgetary_program_list && data.get_budgetary_funds_origin_list && data.get_budgetary_nature_list) {
    // remove inactives
    data.get_budgetary_subprogram_list = data.get_budgetary_subprogram_list.filter((item: any) => {
      return itemUsed(item, 'budgetarySubprogram') || item.active !== false;
    });
    data.get_budgetary_funds_origin_list = data.get_budgetary_funds_origin_list.filter((item: any) => {
      return itemUsed(item, 'budgetaryFundsOrigin') || item.active !== false;
    });
    data.get_budgetary_nature_list = data.get_budgetary_nature_list.filter((item: any) => {
      return itemUsed(item, 'budgetaryNature') || item.active !== false;
    });

    // insere les enfants dans une prop[] du parent
    data.get_budgetary_subprogram_list.forEach((item: any) => {
      const programParent = data.get_budgetary_program_list.find((p: any) => {
        return item.idBudgetaryProgram === p.id;
      });
      if (programParent) {
        if (programParent.subProgram === undefined) {
          programParent.subProgram = [];
        }
        programParent.subProgram.push(item);
      }
    });

    // enleve les parents sans enfant
    data.get_budgetary_program_list = data.get_budgetary_program_list.filter((item: any) => {
      return !!item.subProgram;
    });

    // applatit au meme niveau les parents avec les enfants dans l'ordre
    data.get_budgetary_subprogram_list = data.get_budgetary_program_list.flatMap((item: any) => {
      item.subProgram.unshift(item);
      return item.subProgram;
    });
    // remove circular loop + add searchable
    data.get_budgetary_subprogram_list.forEach((item: any) => {
      if (item.subProgram) {
        item.subProgram = true;
      }
      item.searchable = `${item.code} ${item.value}`;
    });
    data.get_budgetary_nature_list.forEach((item: any) => {
      item.searchable = `${item.code} ${item.value}`;
    });
    data.get_budgetary_funds_origin_list.forEach((item: any) => {
      item.searchable = `${item.code} ${item.value}`;
    });
    response.subProgram = data.get_budgetary_subprogram_list;
    response.fundsOrigin = data.get_budgetary_funds_origin_list;
    response.nature = data.get_budgetary_nature_list;
  }

  if (data.get_management_unit_list) {
    // remove inactives
    data.get_management_unit_list = data.get_management_unit_list.filter((item: any) => {
      return itemUsed(item, 'managementUnit') || item.active !== false;
    });
    response.managementUnit = data.get_management_unit_list;
  }

  return response;
}
