interface PaginationType {
	current: number;
	pageSize: number;
	showSizeChanger?: boolean;
	total?: number;
}

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

export type { PaginationType, ThresholdRule };
