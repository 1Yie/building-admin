interface PaginationType {
  current: number;
  pageSize: number;
  showSizeChanger?: boolean;
  total?: number;
}

type Property = {
  property_id: string;
  name: string;
  is_used: string;
  number?: string;
  address?: string;
  description?: string;
};

interface ThresholdRule {
  rule_id: string;
  property_id: string;
  sensor_kind: string;
  sensor_id: string;
  threshold_type: string;
  threshold_value: number;
  alarm_type: string;
  alarm_level: string;
  alarm_content: string;
  create_time: string;
  update_time: string;
}

export type { PaginationType, Property, ThresholdRule };
