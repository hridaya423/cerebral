import { ExtractorHealth } from './base-extractor';
import { extractorManager } from './extractor-manager';

interface HealthMetrics {
  timestamp: Date;
  extractorName: string;
  successRate: number;
  totalAttempts: number;
  successCount: number;
  lastSuccess: Date | null;
  lastFailure: Date | null;
}

interface HealthAlert {
  type: 'degraded' | 'critical' | 'recovered';
  extractorName: string;
  message: string;
  timestamp: Date;
  successRate: number;
}

export class HealthMonitor {
  private metrics: HealthMetrics[] = [];
  private alerts: HealthAlert[] = [];
  private maxMetricsHistory = 1000;
  private maxAlertsHistory = 100;
  
  private degradedThreshold = 0.7; 
  private criticalThreshold = 0.3; 
  
  recordMetrics(): void {
    const healthData = extractorManager.getExtractorHealth();
    const timestamp = new Date();
    
    for (const health of healthData) {
      const metric: HealthMetrics = {
        timestamp,
        extractorName: health.name,
        successRate: health.successRate,
        totalAttempts: health.totalAttempts,
        successCount: health.successCount,
        lastSuccess: health.lastSuccess,
        lastFailure: health.lastFailure,
      };
      
      this.metrics.push(metric);
      this.checkForAlerts(health);
    }
    
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }
  
  private checkForAlerts(health: ExtractorHealth): void {
    const previousMetric = this.getLatestMetricForExtractor(health.name);
    const timestamp = new Date();
    
    if (health.successRate < this.degradedThreshold && health.successRate >= this.criticalThreshold) {
      if (!previousMetric || previousMetric.successRate >= this.degradedThreshold) {
        this.addAlert({
          type: 'degraded',
          extractorName: health.name,
          message: `Performance degraded: ${Math.round(health.successRate * 100)}% success rate`,
          timestamp,
          successRate: health.successRate,
        });
      }
    }
    
    else if (health.successRate < this.criticalThreshold) {
      if (!previousMetric || previousMetric.successRate >= this.criticalThreshold) {
        this.addAlert({
          type: 'critical',
          extractorName: health.name,
          message: `Critical failure: ${Math.round(health.successRate * 100)}% success rate`,
          timestamp,
          successRate: health.successRate,
        });
      }
    }
    
    else if (health.successRate >= this.degradedThreshold) {
      if (previousMetric && previousMetric.successRate < this.degradedThreshold) {
        this.addAlert({
          type: 'recovered',
          extractorName: health.name,
          message: `Performance recovered: ${Math.round(health.successRate * 100)}% success rate`,
          timestamp,
          successRate: health.successRate,
        });
      }
    }
  }
  
  private addAlert(alert: HealthAlert): void {
    this.alerts.push(alert);
    console.log(`[HealthMonitor] ${alert.type.toUpperCase()}: ${alert.extractorName} - ${alert.message}`);
    
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertsHistory);
    }
  }
  
  private getLatestMetricForExtractor(extractorName: string): HealthMetrics | undefined {
    return this.metrics
      .filter(metric => metric.extractorName === extractorName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  getHealthSummary() {
    const extractorManager_summary = extractorManager.getHealthSummary();
    const recentAlerts = this.getRecentAlerts(24);
    
    return {
      ...extractorManager_summary,
      recentAlerts,
      alertCounts: {
        critical: recentAlerts.filter(a => a.type === 'critical').length,
        degraded: recentAlerts.filter(a => a.type === 'degraded').length,
        recovered: recentAlerts.filter(a => a.type === 'recovered').length,
      },
      trends: this.getPerformanceTrends(),
    };
  }
  
  getRecentAlerts(hours: number = 24): HealthAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }
  
  getPerformanceTrends() {
    const trends: Record<string, { current: number; trend: 'improving' | 'declining' | 'stable' }> = {};
    
    const extractorNames = [...new Set(this.metrics.map(m => m.extractorName))];
    
    for (const name of extractorNames) {
      const extractorMetrics = this.metrics
        .filter(m => m.extractorName === name)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      if (extractorMetrics.length < 2) {
        trends[name] = { current: extractorMetrics[0]?.successRate || 0, trend: 'stable' };
        continue;
      }
      
      const recent = extractorMetrics.slice(-5);
      const older = extractorMetrics.slice(-10, -5);
      
      const recentAvg = recent.reduce((sum, m) => sum + m.successRate, 0) / recent.length;
      const olderAvg = older.length > 0 ? older.reduce((sum, m) => sum + m.successRate, 0) / older.length : recentAvg;
      
      const difference = recentAvg - olderAvg;
      const threshold = 0.05;
      
      let trend: 'improving' | 'declining' | 'stable';
      if (difference > threshold) {
        trend = 'improving';
      } else if (difference < -threshold) {
        trend = 'declining';
      } else {
        trend = 'stable';
      }
      
      trends[name] = { current: recentAvg, trend };
    }
    
    return trends;
  }
  
  getExtractorMetrics(extractorName: string, hours: number = 24): HealthMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics
      .filter(metric => metric.extractorName === extractorName && metric.timestamp > cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async performHealthCheck(testUrl?: string): Promise<void> {
    try {
      await extractorManager.performHealthCheck(testUrl);
      this.recordMetrics();
    } catch (error) {
      console.error('[HealthMonitor] Health check failed:', error);
    }
  }
  
  startMonitoring(intervalMinutes: number = 5): void {
    console.log(`[HealthMonitor] Starting health monitoring every ${intervalMinutes} minutes`);
    
    this.performHealthCheck();
    
    setInterval(() => {
      this.performHealthCheck();
    }, intervalMinutes * 60 * 1000);
  }
  
  exportHealthData() {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      summary: this.getHealthSummary(),
      exportedAt: new Date(),
    };
  }
}
      
export const healthMonitor = new HealthMonitor();