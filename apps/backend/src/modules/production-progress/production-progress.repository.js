import { query } from '../../config/database.js';

const toDateString = (val) => (val ? new Date(val).toISOString().slice(0, 10) : null);

export const productionProgressRepository = {
  async getDashboardSummary() {
    // 1. Active production orders
    const activeOrdersRows = await query(
      `SELECT COUNT(*) AS total FROM production_orders WHERE status IN ('RELEASED', 'IN_PROGRESS', 'PAUSED')`
    );
    const activeOrders = Number(activeOrdersRows[0]?.total ?? 0);

    // 2. Completed orders this month
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

    // 3. Today's outputs
    const todayOutputRows = await query(
      `
        SELECT COALESCE(SUM(good_quantity), 0) AS total_good, COALESCE(SUM(defect_quantity), 0) AS total_defect
        FROM production_outputs
        WHERE output_date = CURDATE()
      `
    );
    const todayGood = Number(todayOutputRows[0]?.total_good ?? 0);
    const todayDefect = Number(todayOutputRows[0]?.total_defect ?? 0);

    // 4. Overdue orders count (planned_end_date < today and status not COMPLETED/CANCELLED)
    const overdueOrdersRows = await query(
      `
        SELECT COUNT(*) AS total
        FROM production_orders
        WHERE planned_end_date < CURDATE() AND status NOT IN ('COMPLETED', 'CANCELLED')
      `
    );
    const overdueOrders = Number(overdueOrdersRows[0]?.total ?? 0);

    // 5. Overall Defect rate
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
        SELECT e.id, e.employee_code, e.full_name, e.position,
               COALESCE(SUM(eo.good_quantity * o.standard_time_seconds), 0) AS standard_seconds_produced,
               COALESCE(SUM(eo.working_minutes * 60), 0) AS total_working_seconds,
               CASE 
                 WHEN SUM(eo.working_minutes * 60) > 0 THEN 
                   ROUND((SUM(eo.good_quantity * o.standard_time_seconds) / SUM(eo.working_minutes * 60)) * 100, 2)
                 ELSE 0 
               END AS productivity_percent
        FROM employees e
        LEFT JOIN employee_outputs eo ON eo.employee_id = e.id
        LEFT JOIN operations o ON o.id = eo.operation_id
        GROUP BY e.id, e.employee_code, e.full_name, e.position
        ORDER BY productivity_percent DESC
        LIMIT 20
      `
    );
    return rows.map((r) => ({
      id: r.id,
      employeeCode: r.employee_code,
      fullName: r.full_name,
      position: r.position,
      productivityPercent: Number(r.productivity_percent),
    }));
  },

  async getLatestProgressSnapshots() {
    const rows = await query(
      `
        SELECT pps.*, po.production_order_code, p.product_name
        FROM production_progress_snapshots pps
        INNER JOIN production_orders po ON po.id = pps.production_order_id
        INNER JOIN products p ON p.id = po.product_id
        INNER JOIN (
          SELECT production_order_id, MAX(id) as max_id
          FROM production_progress_snapshots
          GROUP BY production_order_id
        ) latest ON latest.max_id = pps.id
        ORDER BY pps.snapshot_date DESC
      `
    );
    return rows.map((r) => ({
      id: r.id,
      productionOrderId: r.production_order_id,
      productionOrderCode: r.production_order_code,
      productName: r.product_name,
      snapshotDate: toDateString(r.snapshot_date),
      plannedQuantity: Number(r.planned_quantity),
      completedQuantity: Number(r.completed_quantity),
      remainingQuantity: Number(r.remaining_quantity),
      progressPercent: Number(r.progress_percent),
      expectedProgressPercent: Number(r.expected_progress_percent),
      delayQuantity: Number(r.delay_quantity),
      status: r.status,
    }));
  },

  async getProgressHistoryByOrder(orderId) {
    const rows = await query(
      `
        SELECT pps.*, po.production_order_code
        FROM production_progress_snapshots pps
        INNER JOIN production_orders po ON po.id = pps.production_order_id
        WHERE pps.production_order_id = ?
        ORDER BY pps.snapshot_date ASC
      `,
      [orderId]
    );
    return rows.map((r) => ({
      id: r.id,
      productionOrderId: r.production_order_id,
      productionOrderCode: r.production_order_code,
      snapshotDate: toDateString(r.snapshot_date),
      plannedQuantity: Number(r.planned_quantity),
      completedQuantity: Number(r.completed_quantity),
      remainingQuantity: Number(r.remaining_quantity),
      progressPercent: Number(r.progress_percent),
      expectedProgressPercent: Number(r.expected_progress_percent),
      delayQuantity: Number(r.delay_quantity),
      status: r.status,
    }));
  },
};
