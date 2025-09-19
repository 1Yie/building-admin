import request from "@/request/index";
import { urls } from "@/request/urls";

export interface AlarmItem {
	content: string;
	description: string;
}

export type OutLineInfoResponse = {
	device_unit: {
		count: number;
		trend: string;
		trend_count: number;
	};
	alarm_unit: {
		count: number;
		trend: string;
		trend_count: number;
	};
	property_unit: {
		terminals_count: number;
		buildings_count: number;
	};
	building_property_unit: {
		name: string;
		space_count: number;
		device_count: number;
		device_online_rate: number;
	}[];
	sensor_kind_unit: {
		kind: string;
		count: number;
	}[];
};

interface getLivenessCountListParams {
	end_time?: string;
	time_unit?: string;
}
interface getLivenessCountListResponse {
	values: string[];
	times: string[];
}

// 概览
export function getOutLineInfo(): Promise<OutLineInfoResponse> {
	return request.get(urls.home.getOutLineInfo);
}

// 预警信息
export function getAlarmInfo(): Promise<AlarmItem[]> {
	return request.get(urls.home.alarm);
}

// 活跃设备数量趋势折线图
export function getLivenessCountList(
	params: getLivenessCountListParams,
): Promise<getLivenessCountListResponse> {
	return request.get(urls.home.getLivenessCountList, { params });
}
