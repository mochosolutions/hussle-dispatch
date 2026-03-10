import * as yup from 'yup';
import { LOAD_SOURCES } from '../../shared/constants/loadSources';
import { EQUIPMENT_TYPES } from '../../shared/constants/equipmentTypes';

export const feedQueryValidator = yup.object({
  query: yup.object({
    page: yup.number().optional().positive().integer().default(1),
    limit: yup.number().optional().positive().integer().max(100).default(25),
    score: yup.string().optional().oneOf(['high', 'medium', 'low']),
    hasRate: yup
      .string()
      .optional()
      .oneOf(['true', 'false'])
      .transform((val: string | undefined) => val),
    equipmentType: yup.string().optional().oneOf([...EQUIPMENT_TYPES]),
    source: yup.string().optional().oneOf([...LOAD_SOURCES]),
    includeChains: yup
      .string()
      .optional()
      .oneOf(['true', 'false'])
      .transform((val: string | undefined) => val),
  }),
});
