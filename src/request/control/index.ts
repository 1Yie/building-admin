import request from "@/request";
import { urls } from "@/request/urls";

interface RegulationListParams {
	page: number;
	page_size: number;
}

interface RegulationItem {
	rule_id: string;
	t_sensor_property_id: string;
	t_kind: string;
	t_type: string;
	c_sensor_property_id: string;
	c_kind: string;
	c_type: string;
	trigger: string;
	control: string;
	is_used: string; // TODO
}
interface RegulationListResponse {
	page: {
		pageNum: number;
		pageSize: number;
		totalSize: number;
	};
	regulation: RegulationItem[];
}

interface ManualListParams {
	page: number;
	page_size: number;
}

interface ManualItem {
	property_id: string;
	property_name: string;
	is_used: string;
	is_liveness: string;
	building: string;
	space: string;
	terminal: string;
	operate: { name: string; type: string }[];
}
interface ManualListResponse {
	page: {
		pageNum: number;
		pageSize: number;
		totalSize: number;
	};
	manual: ManualItem[];
}

export interface ManualOperateParams {
	property_id: string;
	control: string;
}

// 控制规则列表
export function getRegulationList(
	params: RegulationListParams,
): Promise<RegulationListResponse> {
	return request.get(urls.control.getRegulationList, {
		params,
	});
}

// 手动控制
export function getManualList(
	params: ManualListParams,
): Promise<ManualListResponse> {
	return request.get(urls.control.getManualList, {
		params,
	});
}

export function getManualOperateList(
	property_id: string,
): Promise<{ type: string; name: string }[]> {
	return request.get(urls.control.getManualOperateList, {
		params: {
			property_id,
		},
	});
}

export function manualOperate({ property_id, control }: ManualOperateParams) {
	return request.get(urls.virtual.control.manualOperate, {
		params: {
			property_id,
			control,
		},
	});
}

export interface PropertyListItem {
	property_id: string;
	name: string;
}

export function getMonitorPropertyList(): Promise<PropertyListItem[]> {
	return request.get(urls.virtual.control.getMonitorPropertyList);
}

export function getControlPropertyList(): Promise<PropertyListItem[]> {
	return request.get(urls.virtual.control.getControlPropertyList);
}

export function getFieldSelectList(
	property_id: string,
): Promise<{ type: string; name: string }[]> {
	return request.get(urls.control.getFieldSelectList, {
		params: {
			property_id,
		},
	});
}

export interface TriggerSelectListItem {
	type: string;
	name: string;
}

export function getTriggerSelectList(): Promise<TriggerSelectListItem[]> {
	return request.get(urls.virtual.control.getTriggerList);
}

export interface AddRegulationParams {
	t_sensor_property_id: string;
	c_sensor_property_id: string;
	field: string;
	control: string;
	trigger: string;
	is_used: string;
	value: number;
}

export interface UpdateRegulationParams extends AddRegulationParams {
	rule_id: string;
}

export function addRegulation(data: AddRegulationParams) {
	return request.post(urls.control.addRegulation, data);
}

export function getRegulationDetails(
	rule_id: string,
): Promise<AddRegulationParams> {
	return request.get(urls.control.getRegulationDetails, {
		params: {
			rule_id,
		},
	});
}

export function updateRegulation(data: UpdateRegulationParams) {
	return request.post(urls.control.updateRegulation, data);
}
