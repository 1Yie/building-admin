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

export interface GetOutlineInfoResponse {
  building_count: number;
  space_count: number;
  terminal_count: number;
  sensor_count: number;
  online_count: number;
  liveness_count: number;
}

export interface GetSensorListParams {
  page: number;
  page_size: number;
  end_time?: string;
  time_unit?: string;
  property_id?: string;
  sensor_kind?: string;
  sensor_type?: string;
  is_used?: boolean;
}

export interface GetSensorListResponse {
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

export interface GetSensorDetailResponse extends GetSensorListResponse {}

export interface PropertyListItem {
  property_id: string;
  property_name: string;
  property_type: string;
  is_used: boolean;
  is_liveness: boolean;
  building: string;
  space: string;
  terminal: string;
  sensor: string;
}

export interface PropertyListParams {
  page: number;
  page_size: number;
  is_excel?: boolean;
  status?: string;
  property_id?: string;
  property_type?: string;
  building_number?: string;
  building_name?: string;
  building_address?: string;
  space_number?: string;
  space_floor?: number;
  space_name?: string;
  space_type?: string;
  terminal_number?: string;
  terminal_type?: string;
  sensor_kind?: string;
  sensor_type?: string;
}

export interface PropertyListResponse {
  page: {
    pageNum: number;
    pageSize: number;
    totalSize: number;
  };
  property: PropertyListItem[];
}

export interface BindPropertyListParams {
  property_id?: string;
  property_type?: string;
}

export interface BindPropertyListItem {
  property_id: string;
  name: string;
  kind?: string;
  type?: string;
}

export interface SensorKindItem {
  name: string;
  kind: string;
}

export interface SensorTypeItem {
  name: string;
  type: string;
}

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

export interface SensorField {
  type: string;
  name: string;
}

export type { PaginationType, Property, ThresholdRule };
