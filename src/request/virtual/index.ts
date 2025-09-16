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

// 开启/暂停定时任务
export function startTimedTask(): Promise<void> {
  return request.get(urls.virtual.teaching.startTimedTask);
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

export function getParamList(params?: { sensor_type?: string }): Promise<SensorField[]> {
  return request.get(urls.virtual.teaching.getParamList, { params });
}

export function setParamNextValue(data: { sensor_type: string; field: string; value: number }): Promise<void> {
  return request.post(urls.virtual.teaching.setParamNextValue, data);
}

// 下载源码
export function downloadCode(): Promise<Blob> {
  return request.get(urls.virtual.download.code, { responseType: "blob" });
}
