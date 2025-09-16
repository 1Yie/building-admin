import { getPropertyList } from "@/request/property";

export interface SensorItem {
  property_id: string;
  property_name: string;
  building: string;
  space: string;
  terminal: string;
  is_used: boolean;
  is_liveness: boolean;
  property_type: string;
  x?: number;
  y?: number;

  // 房间内资产统计
  counts?: {
    device: number;
    sensor: number;
  };
}

/**
 * 获取指定楼宇下所有非楼宇资产
 * @param buildingName 楼宇名称，例如 "交通楼电子电气学院"
 */
export async function getAssetsByBuilding(
  buildingName: string
): Promise<SensorItem[]> {
  let page = 1;
  const pageSize = 50;
  let allAssets: SensorItem[] = [];
  let hasMore = true;

  while (hasMore) {
    const res = await getPropertyList({ page, page_size: pageSize });
    if (!res.property || res.property.length === 0) break;

    const filtered = res.property.filter(
      (item: any) =>
        item.property_type !== "楼宇" && item.building === buildingName
    );

    allAssets = allAssets.concat(
      filtered.map((item: any) => ({
        property_id: item.property_id,
        property_name: item.property_name,
        building: item.building,
        space: item.space,
        terminal: item.terminal,
        is_used: item.is_used,
        is_liveness: item.is_liveness,
        property_type: item.property_type,
        x: item.x,
        y: item.y,
      }))
    );

    const total = res.page?.totalSize || 0;
    page++;
    if ((page - 1) * pageSize >= total) hasMore = false;
  }

  // 统计每个房间下的资产数量
  const rooms = allAssets.filter(a => a.property_type === "房间");
  rooms.forEach(room => {
    const roomMatch = room.property_name.match(/(.+?)\((.+?)\)/);
    const roomBaseName = roomMatch ? roomMatch[1].trim() : room.property_name.trim();
    const roomNumber = roomMatch ? roomMatch[2].trim() : "";

    const children = allAssets.filter(a => {
      if (a.property_type === "房间") return false;
      if (a.building !== room.building) return false;
      if (!a.space) return false;

      const normalizedSpace = a.space.replace(/\s+/g, "");
      const normalizedName = roomBaseName.replace(/\s+/g, "");
      return normalizedSpace.includes(normalizedName) || normalizedSpace.includes(roomNumber);
    });

    room.counts = {
      device: children.filter(c => c.property_type === "设备").length,
      sensor: children.filter(c => c.property_type === "传感器").length,
    };
  });

  return allAssets;
}
