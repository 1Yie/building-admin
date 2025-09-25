import request from "@/request";
import { urls } from "@/request/urls";

// 进入/退出虚拟空间
export function enterVirtual(): Promise<void> {
  return request.get(urls.virtual.enterVirtual);
}

export function quitVirtual(): Promise<void> {
  return request.get(urls.virtual.quitVirtual);
}

// 教学空间
export interface SensorCount {
  breaker: number;
  temphumi: number;
  nosie: number;
  humanbody: number;
  tvoc: number;
  coo: number;
}

export interface SensorDataItem {
  type: string;
  name: string;
  value: number;
}

export interface SensorData {
  sensor_type: string;
  sensor_name: string;
  sensor_data: SensorDataItem[];
}

export interface TerminalSensorData {
  terminal_number: string;
  sensor_data_list: SensorData[];
}

interface GetOutlineInfoResponse {
  building_count: number;
  space_count: number;
  terminal_count: number;
  sensor_count: number;
  online_count: number;
  liveness_count: number;
}

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

interface BindPropertyListParams {
  property_id?: string;
  property_type?: string;
}

export interface BindPropertyListItem {
  property_id: string;
  name: string;
  // 传感器参数
  kind?: string;
  type?: string;
}

export interface SensorTypeItem {
	name: string;
	type: string;
}

export interface SensorKindItem {
	name: string;
	kind: string;
}

// 开启/暂停定时任务
export function startTimedTask(): Promise<void> {
  return request.get(urls.virtual.teaching.startTimedTask);
}

// 查询虚拟传感器列表
export function getSensorList(
  params?: GetSensorListParams
): Promise<GetSensorListResponse> {
  return request.get(urls.virtual.getSensorList, { params });
}

// 查询虚拟实时数据界面
export function getOutlineInfo(): Promise<GetOutlineInfoResponse> {
  return request.get(urls.virtual.getOutlineInfo);
}

// 查询虚拟绑定资产列表
export function getBindPropertyList(
  params: BindPropertyListParams
): Promise<BindPropertyListItem[]> {
  return request.get(urls.virtual.getBindPropertyList, {
    params,
  });
}

export function getSensorKindList(): Promise<SensorKindItem[]> {
  return request.get(urls.virtual.getSensorKindList);
}

// 获取传感器类型
export function getSensorTypeList(): Promise<SensorTypeItem[]> {
  return request.get(urls.virtual.getSensorTypeList);
}

export function getPropertyDetails(property_id: string) {
  return request.get(urls.virtual.getPropertyDetails, {
    params: {
      property_id,
    },
  });
}

export function updateProperty(data: any) {
  return request.post(urls.virtual.updateProperty, data);
}

export function stopTimedTask(): Promise<void> {
  return request.get(urls.virtual.teaching.stopTimedTask);
}

// 删除缓存
export function clearCache(): Promise<void> {
  return request.get(urls.virtual.teaching.clearCache);
}

// 终端在线情况
export function getTerminalOnlineList(): Promise<boolean> {
  return request.get(urls.virtual.teaching.getTerminalOnlineList);
}

export function setTerminalOnline(data: { is_online: boolean }): Promise<void> {
  return request.post(urls.virtual.teaching.setTerminalOnline, data);
}

// 传感器数量
export function getSensorCount(): Promise<SensorCount> {
  return request.get(urls.virtual.teaching.getSensorCount);
}

export function setSensorCount(data: SensorCount): Promise<SensorCount> {
  return request.post(urls.virtual.teaching.setSensorCount, data);
}

// 传感器状态
export function getSensorStatus(): Promise<SensorCount> {
  return request.get(urls.virtual.teaching.getSensorStatus);
}

export function setSensorStatus(data: SensorCount): Promise<void> {
  return request.post(urls.virtual.teaching.setSensorStatus, data);
}

// 获取最新传感器数据
export function getSensorData(): Promise<TerminalSensorData> {
  return request.get(urls.virtual.teaching.getSensorData);
}

// 参数字段
export interface SensorField {
  type: string;
  name: string;
}

export function getParamList(params?: {
  sensor_type?: string;
}): Promise<SensorField[]> {
  return request.get(urls.virtual.teaching.getParamList, { params });
}

export function setParamNextValue(data: {
  sensor_type: string;
  field: string;
  value: number;
}): Promise<void> {
  return request.post(urls.virtual.teaching.setParamNextValue, data);
}

// 下载源码
export function downloadCode(): Promise<Blob> {
  return request.get(urls.virtual.download.code, { responseType: "blob" });
}
