import request from "@/request/index";
import { urls } from "@/request/urls";

// 获取概览数据
interface GetOutlineInfoResponse {
	building_count: number;
	space_count: number;
	terminal_count: number;
	sensor_count: number;
	online_count: number;
	liveness_count: number;
}
export function getOutlineInfo(): Promise<GetOutlineInfoResponse> {
	return request.get(urls.realtime.getOutlineInfo);
}

// 总表数据
interface GetSensorListParams {
	page: number;
	page_size: number;
	end_time?: string; // 数据统计结束日期
	time_unit?: string; // 统计范围（daily天 / week周 / month月）
	property_id?: string; // 资产编号
	sensor_kind?: string; // 传感器种类
	sensor_type?: string; // 传感器类型
	is_used?: boolean; // 启用状态（0 / 1）
}

interface GetSensorListResponse {
	page: {
		pageNum: number;
		pageSize: number;
		totalSize: number;
	};
	property: {
		property_id: string;
		field: string;
		name: string;
		values: number[];
		times: string[];
	}[];
}

export function getSensorList(
	data: GetSensorListParams,
): Promise<GetSensorListResponse> {
	return request.get(urls.realtime.getSensorList, { params: data });
}

// 获取单个传感器详情数据
interface GetSensorDetailParams {
	property_id: string;
}

interface GetSensorDetailResponse {
	page: {
		pageNum: number;
		pageSize: number;
		totalSize: number;
	};
	property: {
		property_id: string;
		field: string;
		name: string;
		values: number[];
		times: string[];
	}[];
}

export function getSensorDetail(
	property_id: string,
	signal?: AbortSignal,
): Promise<GetSensorDetailResponse> {
	return request.get(`${urls.realtime.getSensorList}?property_id=${property_id}`, {
		signal,
	});
}
