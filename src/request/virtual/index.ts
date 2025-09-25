import request from "@/request";
import { urls } from "@/request/urls";
import type { OutLineInfoResponse } from "@/request/home";

// 进入/退出虚拟空间
export function enterVirtual(): Promise<{ enter_flag: string }> {
  return request.get(urls.virtual.enter);
}

export function quitVirtual(): Promise<void> {
  return request.get(urls.virtual.quit);
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

interface LogListParams {
  page: number;
  page_size: number;
  time?: string;
  operator?: string;
  log_type?: string;
}
interface LogListResponse {
  page: {
    pageNum: number;
    pageSize: number;
    totalSize: number;
  };
  log: {
    time: string;
    operator: string;
    type: string;
    content: string;
  }[];
}

interface LogTypeItem {
  name: string;
  type: string;
}

// 开启/暂停定时任务
export function startTimedTask(): Promise<void> {
  return request.get(urls.virtual.teaching.task.start);
}

// 查询虚拟传感器列表
export function getSensorList(
  params?: GetSensorListParams
): Promise<GetSensorListResponse> {
  return request.get(urls.virtual.rtd.getSensorList, { params });
}

// 查询虚拟实时数据界面
export function getOutlineInfo(): Promise<OutLineInfoResponse> {
  return request.get(urls.virtual.rtd.getOutlineInfo);
}

// 查询虚拟绑定资产列表
export function getBindPropertyList(
  params: BindPropertyListParams
): Promise<BindPropertyListItem[]> {
  return request.get(urls.virtual.property.getBindList, {
    params,
  });
}

export function getSensorKindList(): Promise<SensorKindItem[]> {
  return request.get(urls.virtual.property.getKindList);
}

// 获取传感器类型
export function getSensorTypeList(): Promise<SensorTypeItem[]> {
  return request.get(urls.virtual.property.getTypeList);
}

export function getPropertyDetails(property_id: string) {
  return request.get(urls.virtual.property.getDetails, {
    params: {
      property_id,
    },
  });
}

export function updateProperty(data: any) {
  return request.post(urls.virtual.property.update, data);
}

export function stopTimedTask(): Promise<void> {
  return request.get(urls.virtual.teaching.task.stop);
}

// 删除缓存
export function clearCache(): Promise<void> {
  return request.get(urls.virtual.teaching.clearCache);
}

// 终端在线情况
export function getTerminalOnlineList(): Promise<boolean> {
  return request.get(urls.virtual.teaching.terminal.getOnlineList);
}

export function setTerminalOnline(data: { is_online: boolean }): Promise<void> {
  return request.post(urls.virtual.teaching.terminal.setOnline, data);
}

// 传感器数量
export function getSensorCount(): Promise<SensorCount> {
  return request.get(urls.virtual.teaching.sensor.getCount);
}

export function setSensorCount(data: SensorCount): Promise<SensorCount> {
  return request.post(urls.virtual.teaching.sensor.setCount, data);
}

export function getFieldSelectList(
  property_id: string
): Promise<{ type: string; name: string }[]> {
  return request.get(urls.virtual.property.getFieldList, {
    params: { property_id },
  });
}

// 传感器状态
export function getSensorStatus(): Promise<SensorCount> {
  return request.get(urls.virtual.teaching.sensor.getStatus);
}

export function setSensorStatus(data: SensorCount): Promise<void> {
  return request.post(urls.virtual.teaching.sensor.setStatus, data);
}

// 日志管理
export function getLogList(params: LogListParams): Promise<LogListResponse> {
  return request.get(urls.virtual.log.getList, { params });
}

export function getLogTypeList(): Promise<LogTypeItem[]> {
  return request.get(urls.virtual.log.getTypeList);
}

interface addThresholdRuleParams {
  sensor_property_id: string;
  field: string;
  max: number;
  min: number;
  is_used: string;
}

export function addThresholdRule(params: addThresholdRuleParams) {
  return request.post(urls.virtual.threshold.add, params);
}

export function getThresholdRuleDetails(rule_id: string) {
  return request.get(urls.virtual.threshold.getDetails, {
    params: {
      rule_id,
    },
  });
}

interface thresholdRoleListParams {
  page: number;
  page_size: number;
}
interface thresholdRoleListResponse {
  page: {
    pageNum: number;
    pageSize: number;
    totalSize: number;
  };
  thresholed: {
    rule_id: string;
    property_id: string;
    sensor_kind: string;
    sensor_type: string;
    max: number;
    min: number;
    is_used: string;
  }[];
}
// 预警规则
export function getThresholdRuleList(
  params: thresholdRoleListParams
): Promise<thresholdRoleListResponse> {
  return request.get(urls.virtual.threshold.getList, { params });
}

export function updateThresholdRule(
  params: addThresholdRuleParams & { rule_id: string }
) {
  return request.post(urls.virtual.threshold.update, params);
}

// 获取最新传感器数据
export function getSensorData(): Promise<TerminalSensorData> {
  return request.get(urls.virtual.teaching.sensor.getData);
}
// 参数字段
export interface SensorField {
  type: string;
  name: string;
}

export function getParamList(params?: {
  sensor_type?: string;
}): Promise<SensorField[]> {
  return request.get(urls.virtual.teaching.sensor.getParamList, { params });
}

export function setParamNextValue(data: {
  sensor_type: string;
  field: string;
  value: number;
}): Promise<void> {
  return request.post(urls.virtual.teaching.sensor.setParamNextValue, data);
}
// 楼宇管控

// 下载源码
export function downloadCode(): Promise<Blob> {
  return request.get(urls.virtual.download.code, { responseType: "blob" });
}

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
  params: RegulationListParams
): Promise<RegulationListResponse> {
  return request.get(urls.virtual.control.getRegulationList, {
    params,
  });
}

// 手动控制
export function getManualList(
  params: ManualListParams
): Promise<ManualListResponse> {
  return request.get(urls.virtual.control.getManualList, {
    params,
  });
}

export function getManualOperateList(
  property_id: string
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
  return request.post(urls.virtual.control.addRegulation, data);
}

export function getRegulationDetails(
  rule_id: string
): Promise<AddRegulationParams> {
  return request.get(urls.virtual.control.getRegulationDetails, {
    params: {
      rule_id,
    },
  });
}

export function updateRegulation(data: UpdateRegulationParams) {
  return request.post(urls.virtual.control.updateRegulation, data);
}

// types
export interface ApplicationItem {
  caid: string;
  number: string;
  content: string;
  status: 0 | 1 | 2;
  audit_username: string;
  remarks: string;
  time: string;
}

export interface ApplicationListResponse {
  page: {
    pageNum: number;
    pageSize: number;
    totalSize: number;
  };
  applications: ApplicationItem[];
}

// 请求参数类型
export interface AddApplicationParams {
  content: string;
  username: string;
}

export interface GetApplicationListParams {
  time?: string;
  status?: number;
  page?: number;
  page_size?: number;
}

// ===================== 源码申请 =====================
export const application = {
  addNew: (data: AddApplicationParams) =>
    request.post(urls.virtual.application.addNew, data),

  getList: (
    params?: GetApplicationListParams
  ): Promise<ApplicationListResponse> =>
    request.get(urls.virtual.application.getSensorParamList, { params }),
};
