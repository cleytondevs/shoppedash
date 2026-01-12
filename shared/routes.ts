import { z } from 'zod';
import { 
  insertShopeeVendaSchema, 
  insertRelatorioSchema, 
  insertGastoSchema,
  shopee_vendas,
  relatorios,
  gastos,
  vendas_redes_sociais,
  vendas_shopee_video
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      responses: {
        200: z.object({
          ganhosRedesSociais: z.string(),
          ganhosShopeeVideo: z.string(),
        }),
      },
    },
    products: {
      method: 'GET' as const,
      path: '/api/dashboard/products',
      input: z.object({
        filter: z.enum(['all', 'social', 'video']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.object({
          id: z.number(),
          nome_produto: z.string().nullable(),
          receita: z.string(),
          data: z.string(),
          sub_id: z.string().nullable(),
          quantidade: z.number().optional(),
          origem: z.enum(['Redes Sociais', 'Shopee Vídeo']),
        })),
      },
    },
  },
  upload: {
    csv: {
      method: 'POST' as const,
      path: '/api/upload/csv',
      input: z.object({
        data_planilha: z.string(), // Data dos registros
        registros: z.array(z.any()), // Raw CSV data mapped to schema later
      }),
      responses: {
        200: z.object({
          message: z.string(),
          count: z.number(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  reports: {
    list: {
      method: 'GET' as const,
      path: '/api/reports',
      input: z.object({
        date: z.string().optional(),
        range: z.enum(['today', 'yesterday', 'week', 'month']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof relatorios.$inferSelect>()),
      },
    },
    manual: {
      method: 'POST' as const,
      path: '/api/reports/manual',
      input: insertRelatorioSchema,
      responses: {
        201: z.custom<typeof relatorios.$inferSelect>(),
        200: z.custom<typeof relatorios.$inferSelect>(), // Update
      },
    },
    weekly: {
      method: 'GET' as const,
      path: '/api/reports/weekly',
      responses: {
        200: z.array(z.any()), // Mapped from table
      },
    },
    monthly: {
      method: 'GET' as const,
      path: '/api/reports/monthly',
      responses: {
        200: z.array(z.any()), // Mapped from table
      },
    },
  },
  expenses: {
    create: {
      method: 'POST' as const,
      path: '/api/expenses',
      input: insertGastoSchema,
      responses: {
        201: z.custom<typeof gastos.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
