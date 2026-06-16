import { query } from '../../config/database.js';

const toDateString = (val) => (val ? new Date(val).toISOString().slice(0, 10) : null);

const mapProgressRow = (r) => {
  const plannedQuantity = Number(r.planned_quantity ?? 0);
  const completedQuantity = Number(r.completed_quantity ?? 0);
  const remainingQuantity = Math.max(plannedQuantity - completedQuantity, 0);
  const progressPercent = plannedQuantity > 0 ? Number(((completedQuantity / plannedQuantity) * 100).toFixed(2)) : 0;
  const today = new Date();
  const start = r.planned_start_date ? new Date(r.planned_start_date) : today;
  const end = r.planned_end_date ? new Date(r.planned_end_date) : today;
  const totalMs = Math.max(end - start, 1);
  const elapsedMs = Math.min(Math.max(today - start, 0), totalMs);
  const expectedProgressPercent = Number(((elapsedMs / totalMs) * 100).toFixed(2));
  const expectedCompleted = Math.round((expectedProgressPercent / 100) * plannedQuantity);
  const delayQuantity = Math.max(expectedCompleted - completedQuantity, 0);
  let status = 'ON_TRACK';

  if (r.status === 'COMPLETED') {
    status = 'COMPLETED';
  } else if (delayQuantity > 0 && progressPercent < expectedProgressPercent - 10) {
    status = 'DELAYED';
  } else if (delayQuantity > 0) {
    status = 'AT_RISK';
  }

  return {
    id: r.id,
    productionOrderId: r.id,
    productionOrderCode: r.production_order_code,
    productName: r.product_name,
    snapshotDate: toDateString(new Date()),
    plannedQuantity,
    completedQuantity,
    remainingQuantity,
    progressPercent,
    expectedProgressPercent,
    delayQuantity,
    status,
  };
};

export const productionProgressRepository = {
  async getDashboardSummary() {
    const activeOrdersRows = await query(
      `SELECT COUNT(*) AS total FROM production_orders WHERE status IN ('RELEASED', 'IN_PROGRESS', 'PAUSED')`
    );
    const activeOrders = Number(activeOrdersRows[0]?.total ?? 0);

    const completedOrdersRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM production_orders
        WHERE status = 'COMPLETED'
          AND MONTH(actual_end_date) = MONTH(CURDATE())
          AND YEAR(actual_end_date) = YEAR(CURDATE())
      `
    );
    const completedOrdersThisMonth = Number(completedOrdersRows[0]?.total ?? 0);

    const todayOutputRows = await query(
      `
        SELECT COALESCE(SUM(good_quantity), 0) AS total_good, COALESCE(SUM(defect_quantity), 0) AS total_defect
        FROM production_outputs
        WHERE output_date = CURDATE()
      `
    );
    const todayGood = Number(todayOutputRows[0]?.total_good ?? 0);
    const todayDefect = Number(todayOutputRows[0]?.total_defect ?? 0);

    const overdueOrdersRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM production_orders
        WHERE planned_end_date < CURDATE() AND status NOT IN ('COMPLETED', 'CANCELLED')
      `
    );
    const overdueOrders = Number(overdueOrdersRows[0]?.total ?? 0);

    const defectRateRows = await query(
      `
        SELECT COALESCE(SUM(good_quantity), 0) AS total_good, COALESCE(SUM(defect_quantity), 0) AS total_defect
        FROM production_outputs
      `
    );
    const totalGood = Number(defectRateRows[0]?.total_good ?? 0);
    const totalDefect = Number(defectRateRows[0]?.total_defect ?? 0);
    const totalProduced = totalGood + totalDefect;
    const defectRatePercent = totalProduced > 0 ? Number(((totalDefect / totalProduced) * 100).toFixed(2)) : 0;

    return {
      activeOrders,
      completedOrdersThisMonth,
      todayGood,
      todayDefect,
      overdueOrders,
      defectRatePercent,
    };
  },

  async getLineEfficiency() {
    const rows = await query(
      `
        SELECT pl.id, pl.line_code, pl.line_name,
               COALESCE(SUM(po.good_quantity * p.standard_time_minutes), 0) AS standard_minutes_produced,
               COALESCE(SUM(po.working_minutes), 0) AS total_working_minutes,
               CASE
                 WHEN SUM(po.working_minutes) > 0 THEN
                   ROUND((SUM(po.good_quantity * p.standard_time_minutes) / SUM(po.working_minutes)) * 100, 2)
                 ELSE 0
               END AS efficiency_percent
        FROM production_lines pl
        LEFT JOIN production_outputs po ON po.production_line_id = pl.id
        LEFT JOIN production_orders pord ON pord.id = po.production_order_id
        LEFT JOIN products p ON p.id = pord.product_id
        GROUP BY pl.id, pl.line_code, pl.line_name
        ORDER BY efficiency_percent DESC
      `
    );
    return rows.map((r) => ({
      id: r.id,
      lineCode: r.line_code,
      lineName: r.line_name,
      standardMinutesProduced: Number(r.standard_minutes_produced),
      totalWorkingMinutes: Number(r.total_working_minutes),
      efficiencyPercent: Number(r.efficiency_percent),
    }));
  },

  async getWorkerProductivity() {
    const rows = await query(
      `
        SELECT id, employee_code, full_name, position
        FROM users
        WHERE employee_code IS NOT NULL AND employee_status = 'ACTIVE'
        ORDER BY employee_code ASC
        LIMIT 20
      `
    );
    return rows.map((r) => ({
      id: r.id,
      employeeCode: r.employee_code,
      fullName: r.full_name,
      position: r.position,
      productivityPercent: 0,
    }));
  },

  async getLatestProgressSnapshots() {
    const rows = await query(
      `
        SELECT po.*, p.product_name
        FROM production_orders po
        INNER JOIN products p ON p.id = po.product_id
        WHERE po.status != 'CANCELLED'
        ORDER BY po.updated_at DESC
      `
    );
    return rows.map(mapProgressRow);
  },

  async getProgressHistoryByOrder(orderId) {
    const rows = await query(
      `
        SELECT po.*, p.product_name
        FROM production_orders po
        INNER JOIN products p ON p.id = po.product_id
        WHERE po.id = ?
        LIMIT 1
      `,
      [orderId]
    );
    return rows[0] ? [mapProgressRow(rows[0])] : [];
  },
};
