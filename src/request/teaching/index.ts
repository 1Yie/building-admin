import request from "@/request";
import { urls } from "@/request/urls";

// 创建虚拟教学空间
export function createTeachingSpace(data: {
  number?: string;
  name: string;
  count: string;
}) {
  return request.post(urls.virtual.teaching.addNew, data);
}

// 删除虚拟教学空间
export function deleteTeachingSpace(data: { number: string }) {
  return request.post(urls.virtual.teaching.deleteTs, data);
}

// 查询虚拟教学空间
export function searchTeachingSpace(params: {
  number?: string;
  time?: string;
  name?: string;
  count?: string;
  page?: number;
  page_size?: number;
}) {
  const cleanedParams: Record<string, any> = {};
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = (params as any)[key];
      if (value !== "" && value !== null && value !== undefined) {
        cleanedParams[key] = value;
      }
    }
  }
  return request.get(urls.virtual.teaching.searchInfo, {
    params: cleanedParams,
  });
}
