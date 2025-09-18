import { useEffect, useState, useRef } from "react";
import { Tree, Spin, Button } from "antd";
import ReactECharts from "echarts-for-react";
import { useQuery } from "@tanstack/react-query";
import { permissionList } from "@/request/account";
import type { TreeDataNode } from "antd";
import { buildingMaps, floorBackgrounds } from "@/config/building-map";
import { getSensorList, getSensorDetail } from "@/request/realtime";
import type {
  BuildingMap,
  RoomInfo,
} from "@/config/building-map";
import { useAuth } from "@/hooks/use-auth";

interface PermissionNode extends TreeDataNode {
  key: string;
  title: string;
  children?: PermissionNode[];
  item?: any;
}

// 树形数据转换函数
const transformTree = (arr: any[]): PermissionNode[] => {
  return arr.map((item) => ({
    key: item.key,
    title: item.title,
    item: item.item,
    children: Array.isArray(item.children) ? transformTree(item.children) : [],
  }));
};

export default function PropertyVis() {
  const { userInfo, isLoggedIn, permissions } = useAuth();
  const [permissionData, setPermissionData] = useState<PermissionNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<PermissionNode | null>(null);
  const [currentBuildingMap, setCurrentBuildingMap] = useState<BuildingMap | null>(null);
  const [currentFloor, setCurrentFloor] = useState<number | null>(null); // 添加当前楼层状态
  const chartRef = useRef(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0,
    naturalWidth: 0,
    naturalHeight: 0,
  });
  const [allSensorFields, setAllSensorFields] = useState<any[]>([]);
  const [sensorDataMap, setSensorDataMap] = useState<Map<string, any>>(new Map());

  // 添加请求取消控制器的引用
  const abortControllerRef = useRef<AbortController | null>(null);


  const {
    data: permissionDataResponse,
    isLoading: permissionLoading,
    error: permissionError,
  } = useQuery({
    queryKey: ["permissionTree", userInfo?.username],
    queryFn: () => {
      if (!isLoggedIn || !userInfo?.username) {
        throw new Error("用户未登录或用户名不存在");
      }
      return permissionList({
        department: "test",
        username: userInfo.username,
      });
    },
    enabled: isLoggedIn && !!userInfo?.username, // 只有登录状态下才启用查询
    staleTime: 5 * 60 * 1000, // 数据在5分钟内不会重新获取
    retry: 3, // 失败时重试3次
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避重试延迟
  });


  async function fetchAllSensorFields(transformed: any[]) {
    // 用于收集所有传感器 ID
    const sensorIds: string[] = [];

    function traverse(node: any) {
      if (!node) return;

      if (typeof node.key === "string" && node.key.includes("CGQ")) {
        const propertyId = node.key.replace("building-", "");
        sensorIds.push(propertyId);
      }

      if (Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    }

    // 遍历树
    transformed.forEach(traverse);

    console.log("收集到的传感器 ID:", sensorIds);

    try {
    } catch (err) {
      console.error("获取所有传感器字段失败:", err);
    }
  }




  useEffect(() => {
    if (!permissionDataResponse?.data) return;

    const rawData = permissionDataResponse.data;

    const transformedData = transformTree(rawData);
    setPermissionData(transformedData);

    setCheckedKeys(rawData.check || []);

    fetchAllSensorFields(rawData);
  }, [permissionDataResponse]);

  // 处理错误
  useEffect(() => {
    if (permissionError) {
      console.error("获取权限失败:", permissionError);

      if (permissionError.message?.includes('timeout')) {
        console.warn("网络请求超时，请检查网络连接或稍后重试");
      } else if (permissionError.message?.includes('Network Error')) {
        console.warn("网络连接失败，请检查网络设置");
      } else {
        console.warn("获取权限数据失败，请稍后重试");
      }
    }
  }, [permissionError]);

  // 处理勾选事件
  const onCheck = (checkedKeysValue: any) => {
    setCheckedKeys(checkedKeysValue as string[]);
  };

  // 检测节点类型
  const getNodeType = (nodeKey: string): 'building' | 'space' | 'terminal' | 'sensor' | 'unknown' => {
    if (nodeKey.includes("building-LY")) return 'building';
    if (nodeKey.includes("building-KJ")) return 'space';
    if (nodeKey.includes("building-ZD")) return 'terminal';
    if (nodeKey.includes("building-CGQ")) return 'sensor';
    return 'unknown';
  };

  // 查找节点的父空间
  const findParentSpace = (nodeKey: string, nodes: PermissionNode[]): PermissionNode | null => {
    const nodeType = getNodeType(nodeKey);

    // 如果本身就是空间节点，直接返回
    if (nodeType === 'space') {
      return findNodeByKey(nodeKey, nodes);
    }

    // 如果是终端或传感器，查找其父空间
    if (nodeType === 'terminal' || nodeType === 'sensor') {
      return findParentSpaceRecursive(nodeKey, nodes);
    }

    return null;
  };

  // 递归查找父空间
  const findParentSpaceRecursive = (nodeKey: string, nodes: PermissionNode[]): PermissionNode | null => {
    for (const node of nodes) {
      if (getNodeType(node.key) === 'space') {
        // 检查这个空间是否包含目标节点
        if (checkNodeContains(node, nodeKey)) {
          return node;
        }
      }

      // 递归搜索子节点
      if (node.children) {
        const found = findParentSpaceRecursive(nodeKey, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  // 根据key查找节点
  const findNodeByKey = (nodeKey: string, nodes: PermissionNode[]): PermissionNode | null => {
    for (const node of nodes) {
      if (node.key === nodeKey) return node;

      if (node.children) {
        const found = findNodeByKey(nodeKey, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  // 查找节点的父楼宇
  const findParentBuilding = (nodeKey: string, nodes: PermissionNode[]): PermissionNode | null => {
    // 如果本身就是楼宇节点
    if (nodeKey.includes("building-LY")) {
      return nodes.find(node => node.key === nodeKey) || null;
    }

    // 递归查找父楼宇
    const searchInNodes = (searchNodes: PermissionNode[]): PermissionNode | null => {
      for (const node of searchNodes) {
        // 如果是楼宇节点，检查其子节点
        if (node.key.includes("building-LY")) {
          const hasTarget = checkNodeContains(node, nodeKey);
          if (hasTarget) {
            return node;
          }
        }

        // 递归搜索子节点
        if (node.children) {
          const found = searchInNodes(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    return searchInNodes(nodes);
  };

  // 检查节点是否包含目标节点
  const checkNodeContains = (parentNode: PermissionNode, targetKey: string): boolean => {
    if (parentNode.key === targetKey) return true;

    if (parentNode.children) {
      for (const child of parentNode.children) {
        if (checkNodeContains(child, targetKey)) {
          return true;
        }
      }
    }

    return false;
  };

  // 处理选择树节点事件
  const onSelect = (_: React.Key[], info: { node: PermissionNode }) => {
    setSelectedNode(info.node);

    // 查找父楼宇
    const parentBuilding = findParentBuilding(info.node.key, permissionData);

    if (parentBuilding) {
      // 找到对应的楼宇地图配置
      const buildingMap = buildingMaps.find((map) => map.key === parentBuilding.key);

      if (buildingMap) {
        // 根据选中的节点确定楼层
        let targetFloor: number | null = null; // 初始化为null，表示未找到楼层
        let roomConfig: any = null;

        // 获取选择节点的类型
        const selectedNodeType = getNodeType(info.node.key);

        if (selectedNodeType === 'building') {
          // 如果选择的是楼宇（顶层），默认显示一楼
          targetFloor = 1;
        } else if (selectedNodeType === 'space') {
          // 如果选择的是空间，直接从房间配置中获取楼层
          roomConfig = buildingMap.rooms.find(room => room.key === info.node.key);
          if (roomConfig) {
            targetFloor = roomConfig.floor;
          }
        } else if (selectedNodeType === 'terminal' || selectedNodeType === 'sensor') {
          // 如果选择的是终端或传感器，找到其所在的空间，然后获取楼层
          const parentSpace = findParentSpace(info.node.key, permissionData);
          if (parentSpace) {
            roomConfig = buildingMap.rooms.find(room => room.key === parentSpace.key);
            if (roomConfig) {
              targetFloor = roomConfig.floor;
            }
          }
        }

        // 检查是否找到了有效的楼层和对应的背景图
        if (targetFloor !== null && floorBackgrounds[targetFloor]) {
          // 根据楼层选择背景图
          const backgroundImage = floorBackgrounds[targetFloor];

          // 创建新的建筑地图配置，使用对应楼层的背景
          const updatedBuildingMap = {
            ...buildingMap,
            background: backgroundImage
          };

          setCurrentBuildingMap(updatedBuildingMap);
          setCurrentFloor(targetFloor); // 设置当前楼层

          // 预加载背景图片并计算尺寸
          const img = new Image();
          img.onload = () => {
            calculateImageBounds(img.naturalWidth, img.naturalHeight);
          };
          img.onerror = () => {
            console.error('Failed to load building map background:', backgroundImage);
            setCurrentBuildingMap(null);
            setCurrentFloor(null);
          };
          img.src = backgroundImage;
        } else {
          // 如果没有找到对应的楼层配置或背景图，不显示背景
          console.warn('No floor configuration or background found for selected node:', info.node.key);
          setCurrentBuildingMap(null);
          setCurrentFloor(null);
        }
      } else {
        console.warn('Building map not found for key:', parentBuilding.key);
        setCurrentBuildingMap(null);
        setCurrentFloor(null);
      }
    } else {
      setCurrentBuildingMap(null);
      setCurrentFloor(null);
    }
  };

  // 计算背景图片的实际显示区域
  const calculateImageBounds = (
    naturalWidth: number,
    naturalHeight: number
  ) => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const imageAspectRatio = naturalWidth / naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageAspectRatio > containerAspectRatio) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    } else {
      displayWidth = containerHeight * imageAspectRatio;
      displayHeight = containerHeight;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    }

    setImageSize({
      width: displayWidth,
      height: displayHeight,
      offsetX,
      offsetY,
      naturalWidth,
      naturalHeight,
    });

    setChartSize({ width: containerWidth, height: containerHeight });
  };

  // 将图片坐标转换为容器坐标
  const convertToContainerCoords = (
    x: number,
    y: number,
    width: number = 0,
    height: number = 0
  ) => {
    if (!imageSize.naturalWidth || !imageSize.naturalHeight) {
      return { x, y, width, height };
    }

    const scaleX = imageSize.width / imageSize.naturalWidth;
    const scaleY = imageSize.height / imageSize.naturalHeight;

    return {
      x: imageSize.offsetX + x * scaleX,
      y: imageSize.offsetY + y * scaleY,
      width: width * scaleX,
      height: height * scaleY,
    };
  };

  // 获取字段单位
  // const getFieldUnit = (field: string): string => {
  //   const fieldLower = field.toLowerCase();
  //   const unitMap: { [key: string]: string } = {
  //     'temperature': '°C',
  //     'temp': '°C',
  //     'humidity': '%',
  //     'humi': '%',
  //     'pressure': 'kPa',
  //     'co2': 'ppm',
  //     'pm25': 'μg/m³',
  //     'pm10': 'μg/m³',
  //     'tvoc': 'ppb',
  //     'noise': 'dB'
  //   };
  //   return unitMap[fieldLower] || '';
  // };

  // 获取指定空间下的传感器数据
  const getSensorDataForSpace = async (spaceNode: PermissionNode, signal?: AbortSignal): Promise<any> => {
    if (!spaceNode.children) return null;

    // 查找该空间下的所有传感器
    const sensors: PermissionNode[] = [];

    function collectSensors(node: PermissionNode) {
      if (!node.children) return;

      node.children.forEach(child => {
        if (child.key.includes('CGQ')) {
          // 这是传感器节点
          sensors.push(child);
        } else {
          // 继续递归查找（可能是终端节点）
          collectSensors(child);
        }
      });
    }

    collectSensors(spaceNode);

    if (sensors.length === 0) return null;

    // 获取第一个传感器的数据作为代表（实际项目中可能需要聚合多个传感器数据）
    try {
      // 检查请求是否已被取消
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      const sensorId = sensors[0].key.replace('building-', '');
      const sensorData = await getSensorDetail(sensorId);
      console.log("sensorData", sensorData)

      // 再次检查请求是否已被取消
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      if (sensorData?.property && sensorData.property.length > 0) {
        const latestData: any = {};


        sensorData.property.forEach((prop: any) => {
          if (prop.values && prop.values.length > 0 && prop.times && prop.times.length > 0) {
            // 取最新的值（数组最后一个元素）
            const latestValue = prop.values[prop.values.length - 1];
            const latestTime = prop.times[prop.times.length - 1];

            latestData[prop.field] = {
              value: latestValue,
              time: latestTime,
              name: prop.name
            };
          } else {
            latestData[prop.field] = {
              value: '--',
              time: null,
              name: prop.name
            };
          }
        });



        return latestData;
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Request aborted') {
        console.log('传感器数据请求已取消');
        return null;
      }
      console.error('获取传感器数据失败:', error);
    }

    return null;
  };

  // 获取楼宇下的所有空间数据
  const getBuildingData = async (signal?: AbortSignal) => {
    if (!selectedNode || !currentBuildingMap) {
      return [];
    }

    const seriesData: any[] = [];


    // 找到父楼宇节点
    const parentBuilding = findParentBuilding(selectedNode.key, permissionData);
    if (!parentBuilding || !currentBuildingMap.rooms) {
      return [];
    }

    // 获取选择节点的类型
    const selectedNodeType = getNodeType(selectedNode.key);


    // 确定要高亮的空间
    let targetSpaceKey: string | null = null;

    if (selectedNodeType === 'space') {
      // 如果选择的是空间，高亮该空间
      targetSpaceKey = selectedNode.key;
    } else if (selectedNodeType === 'terminal' || selectedNodeType === 'sensor') {
      // 如果选择的是终端或传感器，高亮其所在的空间
      const parentSpace = findParentSpace(selectedNode.key, permissionData);
      console.log('parentSpace', parentSpace);
      targetSpaceKey = parentSpace?.key || null;
    }

    // 只收集空间数据
    const spaceDataList: any[] = [];

    // 根据building-map.ts配置收集空间数据
    for (const roomConfig of currentBuildingMap.rooms) {
      // 检查请求是否已被取消
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      // 查找对应的空间节点
      const spaceNode = findSpaceNodeByKey(roomConfig.key, parentBuilding);

      if (spaceNode) {
        // 收集空间数据，判断是否应该高亮
        const shouldHighlight = targetSpaceKey === spaceNode.key;

        console.log('shouldHighlight', shouldHighlight);
        await addSpaceData(roomConfig, spaceNode, spaceDataList, shouldHighlight, signal);
      }
    }

    // 只添加空间数据
    seriesData.push(...spaceDataList);

    return seriesData;
  };

  // 查找空间节点
  const findSpaceNodeByKey = (spaceKey: string, buildingNode: PermissionNode): PermissionNode | null => {
    if (!buildingNode.children) return null;
    return buildingNode.children.find(child => child.key === spaceKey) || null;
  };


  // 添加空间数据
  const addSpaceData = async (roomConfig: RoomInfo, spaceNode: PermissionNode, seriesData: any[], shouldHighlight: boolean, signal?: AbortSignal) => {
    const spaceCoords = convertToContainerCoords(
      roomConfig.x,
      roomConfig.y,
      roomConfig.width,
      roomConfig.height
    );

    // 获取该空间的传感器数据
    const sensorData = await getSensorDataForSpace(spaceNode, signal);



    console.log("selectedNode", selectedNode?.key)
    console.log("spaceNode", spaceNode?.key)

    // 判断在线状态：根据传感器数据的最新时间判断
    let onlineStatus = 'offline'; // 默认离线
    let onlineCount = 0;
    let totalSensors = 0;

    if (sensorData && Object.keys(sensorData).length > 0) {
      const currentTime = new Date().getTime();
      const fiveMinutesAgo = currentTime - 5 * 60 * 1000; // 5分钟前的时间戳

      // 检查所有传感器字段的最新时间
      for (const field in sensorData) {
        const sensorInfo = sensorData[field];
        totalSensors++;
        console.log("sensorInfo", sensorInfo.time)

        if (sensorInfo && sensorInfo.time) {
          const sensorTime = new Date(sensorInfo.time).getTime();
          if (sensorTime > fiveMinutesAgo) {
            onlineCount++;
          }
        }
        // time 为 null 或 undefined 的传感器视为离线，不增加 onlineCount
      }

      // 根据在线传感器数量确定状态
      if (onlineCount === totalSensors && totalSensors > 0) {
        onlineStatus = 'online'; // 全部在线
      } else if (onlineCount > 0) {
        onlineStatus = `partial-${totalSensors - onlineCount}`; // 部分在线（几个离线）
      } else {
        onlineStatus = 'offline'; // 全部离线
      }
    }

    seriesData.push({
      name: roomConfig.title,
      value: [spaceCoords.x + spaceCoords.width / 2, spaceCoords.y + spaceCoords.height / 2],
      type: 'space',
      spaceKey: spaceNode.key,
      coords: spaceCoords,
      roomConfig,
      isSelected: shouldHighlight,
      sensorData: sensorData || {}, // 添加传感器数据
      online: onlineStatus, // 详细的在线状态信息
      onlineCount, // 在线传感器数量
      totalSensors // 总传感器数量
    });
  };

  // ECharts 配置
  const [chartOption, setChartOption] = useState<any>({});
  const [isLoadingData, setIsLoadingData] = useState(false);

  const getOption = async (signal?: AbortSignal) => {
    if (!currentBuildingMap || !selectedNode) {
      return {
        title: { text: selectedNode?.title || "请选择楼宇", left: "center", top: 10 },
        xAxis: { type: "value", min: 0, max: 100, show: false },
        yAxis: { type: "value", min: 0, max: 100, show: false },
        series: [],
      };
    }

    const seriesData = await getBuildingData(signal);

    return {
      title: { text: selectedNode.title, left: "center", top: 10 },
      xAxis: { type: "value", min: 0, max: chartSize.width || 100, show: false },
      yAxis: { type: "value", min: 0, max: chartSize.height || 100, show: false },
      series: [
        {
          type: "custom",
          coordinateSystem: "cartesian2d",
          data: seriesData.map(item => ({ value: item.value, ...item })),
          renderItem: (params: any, api: any) => {
            const data = seriesData[params.dataIndex] || params.data;
            if (!data || data.type !== "space") return null;

            const startCoord = api.coord([data.coords.x, data.coords.y]);
            const endCoord = api.coord([data.coords.x + data.coords.width, data.coords.y + data.coords.height]);
            const width = endCoord[0] - startCoord[0];
            const height = endCoord[1] - startCoord[1];

            // 使用真实的传感器数据
            const sensorData = data.sensorData || {};
            const sensorFields = Object.keys(sensorData);

            const lines = [{ text: `${data.name}`, color: "#333", bold: true }];

            // 计算矩形可容纳的最大行数
            const paddingTop = 4;
            const paddingBottom = 4;
            const lineHeight = 16;
            const maxLines = Math.floor((Math.abs(height) - paddingTop - paddingBottom) / lineHeight);

            // 动态添加传感器数据行，但不超过矩形高度
            if (sensorFields.length > 0 && maxLines > 1) {
              // 除了标题行，剩余可显示的行数
              const availableLines = maxLines - 1;
              const displayFields = sensorFields.slice(0, Math.min(availableLines, 2));

              displayFields.forEach(field => {
                const sensorInfo = sensorData[field];

                if (sensorInfo && sensorInfo.value !== undefined) {
                  // 从field中提取显示名称，去掉括号内容
                  const displayName = field.replace(/\(.*?\)/g, '').trim();
                  const value = sensorInfo.value;

                  lines.push({ text: `${displayName}: ${value}`, color: "#333", bold: false });
                }
              });
            } else if (sensorFields.length === 0 && maxLines > 1) {
              lines.push({ text: '暂无传感器数据', color: "#999", bold: false });
            }

            const topY = Math.min(startCoord[1], endCoord[1]);
            const fontSize = Math.min(12, lineHeight - 2);

            const textElements: any[] = [];

            // 只渲染能够完全显示在矩形内的文字行
            const linesToRender = lines.slice(0, maxLines);

            linesToRender.forEach((item, idx) => {
              const textY = topY + paddingTop + idx * lineHeight;

              // 背景矩形
              textElements.push({
                type: "rect",
                shape: {
                  x: startCoord[0] + 2,
                  y: textY,
                  width: width - 4,
                  height: lineHeight,
                  r: 2,
                },
                style: { fill: "rgba(255, 255, 255, 0.8)" },
                silent: true,
              });

              // 文字
              textElements.push({
                type: "text",
                style: {
                  text: item.text,
                  x: startCoord[0] + width / 2,
                  y: textY + lineHeight / 2,
                  fill: item.color,
                  fontSize,
                  fontWeight: item.bold ? "bold" : "normal",
                  textAlign: "center",
                  textVerticalAlign: "middle",
                  width: width - 4,
                  overflow: "truncate",
                  ellipsis: "...",
                },
                silent: true,
              });
            });

            return {
              type: "group",
              children: [
                // 矩形背景
                {
                  type: "rect",
                  shape: { x: startCoord[0], y: startCoord[1], width, height, r: 4 },
                  style: {
                    fill: (() => {
                      // if (data.isSelected &&) {
                      //   return "rgba(24, 144, 255, 0.7)";
                      // }
                      // 根据在线状态设置颜色
                      if (data.online === 'online') {
                        return "rgba(82, 196, 26, 0.7)"; // 绿色 - 全部在线
                      } else if (data.online && data.online.startsWith('partial-')) {
                        return "rgba(250, 173, 20, 0.7)"; // 橙色 - 部分在线
                      } else {
                        return "rgba(245, 34, 45, 0.7)"; // 红色 - 离线
                      }
                    })(),
                    stroke: (() => {
                      // if (data.isSelected) {
                      //   return "#1890ff";
                      // }
                      // 根据在线状态设置边框颜色
                      if (data.online === 'online') {
                        return "#52c41a"; // 绿色边框
                      } else if (data.online && data.online.startsWith('partial-')) {
                        return "#faad14"; // 橙色边框
                      } else {
                        return "#f5222d"; // 红色边框
                      }
                    })(),
                    lineWidth: 1,
                  },
                  silent: false,
                },
                ...textElements,
              ],
            };
          },
        },
      ],
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (params: any) => {
          const data = params.data;

          if (!data) return "";
          if (data.type === "space") {
            const sensorData = data.sensorData || {};

            // 动态生成传感器数据显示
            const sensorFields = Object.keys(sensorData);
            let sensorDataHtml = '';

            if (sensorFields.length > 0) {
              // 显示所有字段，不限制数量
              sensorDataHtml = sensorFields.map(field => {
                const sensorInfo = sensorData[field];
                if (sensorInfo && sensorInfo.value !== undefined) {
                  // 从field中提取显示名称和单位
                  const fieldParts = field.match(/^([^（(]+)([（(][^）)]*[）)])?/);
                  const displayName = fieldParts ? fieldParts[1] : field;
                  const unit = fieldParts && fieldParts[2] ? fieldParts[2] : '';
                  const value = sensorInfo.value;

                  return `<div style="margin: 0px;"><span style="color: #fff; font-size: 12px; ">${displayName}</span><span style="color: #CCCCCC; font-size: 9px; margin-left: 4px;">${unit}</span>: <b style="color: #fff; font-size: 15px; font-weight: 700;">${value}</b></div>`;
                }
                return '';
              }).filter(item => item !== '').join('');
            } else {
              sensorDataHtml = '<span style="color: #999;">暂无传感器数据</span>';
            }

            // 生成状态显示文本和颜色
            let statusText = '';
            let statusColor = '';

            if (data.online === 'online') {
              statusText = '在线';
              statusColor = '#52c41a';
            } else if (data.online && data.online.startsWith('partial-')) {
              const offlineCount = data.online.split('-')[1];
              statusText = `部分在线 (${offlineCount}个离线)`;
              statusColor = '#faad14';
            } else {
              statusText = '离线';
              statusColor = '#ff4d4f';
            }

            return `
          <div style="font-size:14px;color:#fff;">
            <b>${data.name}</b><br/>

            <div style="margin-bottom: 0px;">状态: <b><span style="color:${statusColor}">${statusText}</span></b></div>
            <div style="margin-bottom: 8px;">传感器: <span style="color:#ccc">${data.onlineCount || 0}/${data.totalSensors || 0} 在线</span></div>
            <div style="padding-top:8px;border-top:1px solid rgba(255,255,255,0.2)">
              ${sensorDataHtml}
            </div>
            <div style="color:#999;font-size:12px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.2)">更新时间: <b style="color:#fff">${new Date().toLocaleString("zh-CN")}</b></div>
          </div>
        `;
          }
          return "";
        },
        backgroundColor: "rgba(0,0,0,0.8)",
        borderColor: "#ccc",
        borderWidth: 1,
        textStyle: { color: "#fff" },
      },
    };
  };


  // 处理图表点击事件
  const onChartClick = async (params: any) => {
    if (!params.data) return;

    const data = params.data;
    //  console.log('🔍 图表点击事件:', data);

    // 点击空间时，同步选择树节点
    if (data.spaceKey) {
      const nodeKey = data.spaceKey;

      //  console.log('🔍 选择节点:', nodeKey);

      // 查找并选择对应的树节点
      const findAndSelectNode = (nodes: PermissionNode[], targetKey: string): boolean => {
        for (const node of nodes) {
          if (node.key === targetKey) {
            setSelectedNode(node);
            //    console.log('🔍 找到并选择节点:', node.title);
            return true;
          }
          if (node.children && findAndSelectNode(node.children, targetKey)) {
            return true;
          }
        }
        return false;
      };

      findAndSelectNode(permissionData, nodeKey);
    }
  };



  // 监听容器大小变化
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout | null = null;

    const resizeChart = () => {
      // 清除之前的定时器，实现防抖
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }

      resizeTimer = setTimeout(() => {
        if (currentBuildingMap && currentFloor && floorBackgrounds[currentFloor]) {
          const img = new Image();
          img.onload = () => {
            calculateImageBounds(img.naturalWidth, img.naturalHeight);
          };
          img.src = floorBackgrounds[currentFloor];
        }

        if (chartRef.current) {
          setTimeout(() => {
            const echartsInstance = (
              chartRef.current as any
            ).getEchartsInstance();
            if (echartsInstance) {
              echartsInstance.resize();
            }
          }, 100);
        }
      }, 300); // 300ms防抖延迟
    };

    // 初始化时确保容器有正确的尺寸
    const initChart = () => {
      if (chartContainerRef.current) {
        const container = chartContainerRef.current;
        const rect = container.getBoundingClientRect();

        // 如果容器尺寸为0，等待一段时间后重试
        if (rect.width === 0 || rect.height === 0) {
          setTimeout(initChart, 100);
          return;
        }

        // 触发图表重新渲染
        if (chartRef.current) {
          const echartsInstance = (chartRef.current as any).getEchartsInstance();
          if (echartsInstance) {
            echartsInstance.resize();
          }
        }
      }
    };

    // 延迟初始化，确保DOM完全渲染
    setTimeout(initChart, 50);

    window.addEventListener("resize", resizeChart);

    let resizeObserver: ResizeObserver | null = null;
    if (chartContainerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(resizeChart);
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      // 清理定时器
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      // 取消正在进行的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      window.removeEventListener("resize", resizeChart);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [currentBuildingMap]);

  useEffect(() => {
    const updateChart = async () => {
      if (chartRef.current && imageSize.width > 0) {
        // 如果正在加载数据，跳过这次更新
        if (isLoadingData) {
          return;
        }

        // 取消之前的请求
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // 创建新的取消控制器
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsLoadingData(true);
        try {
          const echartsInstance = (chartRef.current as any).getEchartsInstance();
          if (echartsInstance) {
            const option = await getOption(signal);

            // 检查请求是否已被取消
            if (!signal.aborted) {
              setChartOption(option);
              echartsInstance.setOption(option);
            }
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'Request aborted') {
            console.log('图表更新请求已取消');
          } else {
            console.error('更新图表失败:', error);
          }
        } finally {
          // 只有在请求没有被取消的情况下才设置加载状态为false
          if (!signal.aborted) {
            setIsLoadingData(false);
          }
        }
      }
    };

    updateChart();
  }, [selectedNode, imageSize, currentBuildingMap]);

  return (
    <div className="flex min-h-screen">
      {/* 左侧权限树 */}
      <div className="w-[30%] pr-4  border-gray-300 overflow-y-auto">
        <Spin spinning={permissionLoading}>
          {permissionError ? (
            <div className="p-4 text-center bg-white rounded-md">
              <div className="text-red-500 mb-2">权限数据加载失败</div>
              <div className="text-gray-500 text-sm mb-3">
                {permissionError.message?.includes('timeout')
                  ? '网络请求超时，请检查网络连接'
                  : permissionError.message?.includes('Network Error')
                    ? '网络连接失败，请检查网络设置'
                    : '获取权限数据失败，请稍后重试'
                }
              </div>
              <Button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                重新加载
              </Button>
            </div>
          ) : (
            <Tree
              className="p-2! m-2!"
              treeData={permissionData}
              checkedKeys={checkedKeys}
              onCheck={onCheck}
              onSelect={onSelect}
            />
          )}
        </Spin>
      </div>

      {/* 右侧显示 ECharts */}
      <div className="w-[70%] pl-4">
        <div
          ref={chartContainerRef}
          className="sticky top-4 rounded-md"
          style={{
            height: "calc(100vh - 2rem)",
            border: "1px solid #ddd",
            backgroundImage: currentBuildingMap && currentFloor && floorBackgrounds[currentFloor]
              ? `url(${floorBackgrounds[currentFloor]})`
              : "none",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          {isLoadingData && (
            <div className="absolute inset-0 flex items-center justify-center  bg-opacity-50 z-10">
              <Spin size="large" tip="正在加载传感器数据..." />
            </div>
          )}
          <ReactECharts
            className="rounded-md"
            ref={chartRef}
            option={chartOption || {}}
            onEvents={{
              click: onChartClick,
            }}
            style={{
              height: "100%",
              width: "100%",
              minHeight: "400px",
              minWidth: "400px",
              position: "absolute",
              top: 0,
              left: 0,
              background: "transparent",
            }}
            opts={{
              renderer: 'canvas',
              width: 'auto',
              height: 'auto'
            }}
          />
        </div>
      </div>
    </div>
  );
}
