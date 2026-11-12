import { Repository, Runtime } from '../domain/ports';
import { isOverdue } from '../domain/rules/records';

export class GetDashboard {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}
  async execute() {
    const [records, alerts, tasks, readings] = await Promise.all([
      this.repo.find('records', { archived: false }),
      this.repo.find('alerts', { status: 'OPEN' }),
      this.repo.find('tasks', {}),
      this.repo.list('readings', { page: 1, limit: 8, sort: 'measuredAt', order: 'DESC' }),
    ]);
    return {
      records: records.length,
      critical: records.filter((r) => r.condition === 'CRITICO').length,
      openAlerts: alerts.length,
      pendingTasks: tasks.filter((t) => t.status !== 'DONE').length,
      overdue: records.filter((r) => isOverdue(r, this.rt.now())).length,
      // Prioridad 1 primero; a igual prioridad, la más antigua primero.
      prioritizedAlerts: alerts
        .sort((a, b) => a.priority - b.priority || a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, 8),
      recentReadings: readings.items,
    };
  }
}
