import { z } from 'zod';
import { ORDER_PRIORITIES, ORDER_STATUSES } from './order.constants.js';

const sortFields = ['order_code', 'order_date', 'expected_delivery_date', 'priority', 'status', 'created_at'];

const orderItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative().optional().default(0),
  color: z.string().trim().max(80).optional().nullable(),
  size: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const dateOrderRefinement = (body) => {
  const orderDate = new Date(body.orderDate);
  const deliveryDate = new Date(body.expectedDeliveryDate);
  return Number.isNaN(orderDate.getTime()) || Number.isNaN(deliveryDate.getTime())
    ? true
    : deliveryDate >= orderDate;
};

export const listOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().optional(),
    status: z.enum(ORDER_STATUSES).optional(),
    priority: z.enum(ORDER_PRIORITIES).optional(),
    customerId: z.coerce.number().int().positive().optional(),
    deliveryFrom: z.coerce.date().optional(),
    deliveryTo: z.coerce.date().optional(),
    sortBy: z.enum(sortFields).optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const createOrderSchema = z.object({
  body: z
    .object({
      orderCode: z.string().trim().min(1).max(50),
      customerId: z.coerce.number().int().positive(),
      orderDate: z.coerce.date(),
      expectedDeliveryDate: z.coerce.date(),
      priority: z.enum(ORDER_PRIORITIES).default('NORMAL'),
      notes: z.string().trim().optional().nullable(),
      items: z.array(orderItemSchema).min(1),
    })
    .refine(dateOrderRefinement, {
      message: 'Ngay giao du kien khong duoc truoc ngay dat',
      path: ['expectedDeliveryDate'],
    }),
});

export const updateOrderSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z
    .object({
      customerId: z.coerce.number().int().positive().optional(),
      orderDate: z.coerce.date().optional(),
      expectedDeliveryDate: z.coerce.date().optional(),
      priority: z.enum(ORDER_PRIORITIES).optional(),
      notes: z.string().trim().optional().nullable(),
      items: z.array(orderItemSchema).min(1).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Can co it nhat mot truong de cap nhat',
    })
    .refine(
      (value) => {
        if (!value.orderDate || !value.expectedDeliveryDate) {
          return true;
        }
        return new Date(value.expectedDeliveryDate) >= new Date(value.orderDate);
      },
      {
        message: 'Ngay giao du kien khong duoc truoc ngay dat',
        path: ['expectedDeliveryDate'],
      },
    ),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    status: z.enum(ORDER_STATUSES),
    changeNote: z.string().trim().optional().nullable(),
  }),
});
