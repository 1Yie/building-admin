import { useEffect, useState, useRef } from "react";
import { Tree, Spin, Button, Card, Input } from "antd";
import {
  SearchOutlined,
  FunnelPlotFilled,
  PushpinFilled,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import { useQuery } from "@tanstack/react-query";
import { permissionList } from "@/request/account";
import type { TreeDataNode } from "antd";
import { buildingMaps, floorBackgrounds } from "@/config/building-map";
import { getSensorDetail } from "@/request/realtime";
import type { BuildingMap, RoomInfo } from "@/config/building-map";
import { useAuth } from "@/hooks/use-auth";
import { CountdownTimer } from "./countdown-timer";

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
  const { userInfo, isLoggedIn } = useAuth();
  const [permissionData, setPermissionData] = useState<PermissionNode[]>([]);
  const [filteredPermissionData, setFilteredPermissionData] = useState<
    PermissionNode[]
  >([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<PermissionNode | null>(null);
  const [currentBuildingMap, setCurrentBuildingMap] =
    useState<BuildingMap | null>(null);
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

  // 刷新间隔
  const REFRESH_INTERVAL = 60;
  const [refreshTicker, setRefreshTicker] = useState(0);

  // 添加请求取消控制器的引用
  const abortControllerRef = useRef<AbortController | null>(null);

  // 添加传感器请求开关状态
  const [enableSensorRequest, setEnableSensorRequest] =
    useState<boolean>(false);

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

  // 初始化当前楼宇地图
  useEffect(() => {
    // 调试: 改变空间坐标时可以关闭发送传感器请求
    setEnableSensorRequest(true);

    if (!permissionDataResponse?.data) return;

    const rawData = permissionDataResponse.data;

    const transformedData = transformTree(rawData);
    setPermissionData(transformedData);
    setFilteredPermissionData(transformedData); // 初始化过滤数据

    setCheckedKeys(rawData.check || []);

    fetchAllSensorFields(rawData);
  }, [permissionDataResponse]);

  // 搜索过滤函数
  const filterTreeData = (
    data: PermissionNode[],
    searchValue: string
  ): PermissionNode[] => {
    if (!searchValue) return data;

    const filterNode = (node: PermissionNode): PermissionNode | null => {
      const title = node.title?.toString().toLowerCase() || "";
      const key = node.key?.toString().toLowerCase() || "";
      const isMatch =
        title.includes(searchValue.toLowerCase()) ||
        key.includes(searchValue.toLowerCase());

      // 递归过滤子节点
      const filteredChildren =
        (node.children
          ?.map((child) => filterNode(child))
          .filter(Boolean) as PermissionNode[]) || [];

      // 如果当前节点匹配或有匹配的子节点，则保留该节点
      if (isMatch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    };

    return data
      .map((node) => filterNode(node))
      .filter(Boolean) as PermissionNode[];
  };

  // 收集需要展开的节点keys - 优化版本，确保完整展开匹配项的路径
  const getExpandedKeys = (
    data: PermissionNode[],
    searchValue: string
  ): string[] => {
    if (!searchValue) return [];

    const expandedKeys: string[] = [];
    const matchedPaths: string[][] = [];

    // 递归查找所有匹配的节点路径
    const findMatchedPaths = (
      nodes: PermissionNode[],
      currentPath: string[] = []
    ) => {
      nodes.forEach((node) => {
        const newPath = [...currentPath, node.key];
        const title = node.title?.toString().toLowerCase() || "";
        const key = node.key?.toString().toLowerCase() || "";
        const isMatch =
          title.includes(searchValue.toLowerCase()) ||
          key.includes(searchValue.toLowerCase());

        if (isMatch) {
          // 如果当前节点匹配，保存完整路径
          matchedPaths.push(newPath);
        }

        // 继续递归搜索子节点
        if (node.children && node.children.length > 0) {
          findMatchedPaths(node.children, newPath);
        }
      });
    };

    // 查找所有匹配的路径
    findMatchedPaths(data);

    // 从所有匹配路径中提取需要展开的节点keys
    matchedPaths.forEach((path) => {
      // 展开路径中除了最后一个节点（叶子节点）之外的所有节点
      for (let i = 0; i < path.length - 1; i++) {
        if (!expandedKeys.includes(path[i])) {
          expandedKeys.push(path[i]);
        }
      }
    });

    return expandedKeys;
  };

  // 处理搜索
  useEffect(() => {
    const filtered = filterTreeData(permissionData, searchValue);
    setFilteredPermissionData(filtered);

    // 自动展开匹配的节点
    const keysToExpand = getExpandedKeys(permissionData, searchValue);
    setExpandedKeys(keysToExpand);
  }, [permissionData, searchValue]);

  // 搜索输入处理
  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  // 处理错误
  useEffect(() => {
    if (permissionError) {
      console.error("获取权限失败:", permissionError);

      if (permissionError.message?.includes("timeout")) {
        console.warn("网络请求超时，请检查网络连接或稍后重试");
      } else if (permissionError.message?.includes("Network Error")) {
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
  const getNodeType = (
    nodeKey: string
  ): "building" | "space" | "terminal" | "sensor" | "unknown" => {
    if (nodeKey.includes("building-LY")) return "building";
    if (nodeKey.includes("building-KJ")) return "space";
    if (nodeKey.includes("building-ZD")) return "terminal";
    if (nodeKey.includes("building-CGQ")) return "sensor";
    return "unknown";
  };

  // 查找节点的父空间
  const findParentSpace = (
    nodeKey: string,
    nodes: PermissionNode[]
  ): PermissionNode | null => {
    // 辅助函数: 查找到节点的完整路径
    const findPathToNode = (
      key: string,
      currentNodes: PermissionNode[],
      path: PermissionNode[]
    ): PermissionNode[] | null => {
      for (const node of currentNodes) {
        const newPath = [...path, node];
        if (node.key === key) {
          return newPath;
        }
        if (node.children) {
          const result = findPathToNode(key, node.children, newPath);
          if (result) return result;
        }
      }
      return null;
    };

    const path = findPathToNode(nodeKey, nodes, []);
    if (!path) return null;

    // 查找最近的空间类型祖先节点
    // 从倒数第二个元素(直接父节点)开始向前遍历
    for (let i = path.length - 2; i >= 0; i--) {
      const ancestor = path[i];
      if (getNodeType(ancestor.key) === "space") {
        return ancestor;
      }
    }

    // 如果节点本身是空间类型,则直接返回该节点
    const targetNode = path[path.length - 1];
    if (getNodeType(targetNode.key) === "space") {
      return targetNode;
    }

    return null;
  };

  // 递归查找父空间
  const findParentSpaceRecursive = (
    nodeKey: string,
    nodes: PermissionNode[]
  ): PermissionNode | null => {
    for (const node of nodes) {
      if (getNodeType(node.key) === "space") {
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
  const findNodeByKey = (
    nodeKey: string,
    nodes: PermissionNode[]
  ): PermissionNode | null => {
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
  const findParentBuilding = (
    nodeKey: string,
    nodes: PermissionNode[]
  ): PermissionNode | null => {
    // 如果本身就是楼宇节点
    if (nodeKey.includes("building-LY")) {
      return nodes.find((node) => node.key === nodeKey) || null;
    }

    // 递归查找父楼宇
    const searchInNodes = (
      searchNodes: PermissionNode[]
    ): PermissionNode | null => {
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
  const checkNodeContains = (
    parentNode: PermissionNode,
    targetKey: string
  ): boolean => {
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
    // 立即取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 立即重置加载状态
    setIsLoadingData(false);

    setSelectedNode(info.node);

    // 查找父楼宇
    const parentBuilding = findParentBuilding(info.node.key, permissionData);

    if (parentBuilding) {
      // 找到对应的楼宇地图配置
      const buildingMap = buildingMaps.find(
        (map) => map.key === parentBuilding.key
      );

      if (buildingMap) {
        // 根据选中的节点确定楼层
        let targetFloor: number | null = null; // 初始化为null，表示未找到楼层
        let roomConfig: any = null;

        // 获取选择节点的类型
        const selectedNodeType = getNodeType(info.node.key);

        if (selectedNodeType === "building") {
          // 如果选择的是楼宇（顶层），默认显示一楼
          targetFloor = 1;
        } else if (selectedNodeType === "space") {
          // 如果选择的是空间，直接从房间配置中获取楼层
          roomConfig = buildingMap.rooms.find(
            (room) => room.key === info.node.key
          );
          if (roomConfig) {
            targetFloor = roomConfig.floor;
          }
        } else if (
          selectedNodeType === "terminal" ||
          selectedNodeType === "sensor"
        ) {
          // 如果选择的是终端或传感器，找到其所在的空间，然后获取楼层
          const parentSpace = findParentSpace(info.node.key, permissionData);
          if (parentSpace) {
            roomConfig = buildingMap.rooms.find(
              (room) => room.key === parentSpace.key
            );
            if (roomConfig) {
              targetFloor = roomConfig.floor;
            }
          }
        }

        // 检查是否找到了有效的楼层和对应的背景图
        if (targetFloor !== null && floorBackgrounds[targetFloor]) {
          // 根据楼层选择背景图
          const backgroundImage = floorBackgrounds[targetFloor];

          // 先重置图片尺寸状态，避免使用旧的尺寸信息
          setImageSize({
            width: 0,
            height: 0,
            offsetX: 0,
            offsetY: 0,
            naturalWidth: 0,
            naturalHeight: 0,
          });

          // 预加载背景图片并计算尺寸
          const img = new Image();
          img.onload = () => {
            // 确保在图片加载完成后再更新状态和计算尺寸
            const updatedBuildingMap = {
              ...buildingMap,
              background: backgroundImage,
            };

            setCurrentBuildingMap(updatedBuildingMap);
            setCurrentFloor(targetFloor);

            // 使用 setTimeout 确保状态更新完成后再计算尺寸
            setTimeout(() => {
              calculateImageBounds(img.naturalWidth, img.naturalHeight);
            }, 50);
          };
          img.onerror = () => {
            console.error("加载楼宇地图背景图片失败:", backgroundImage);
            setCurrentBuildingMap(null);
            setCurrentFloor(null);
            setImageSize({
              width: 0,
              height: 0,
              offsetX: 0,
              offsetY: 0,
              naturalWidth: 0,
              naturalHeight: 0,
            });
          };
          img.src = backgroundImage;
        } else {
          // 如果没有找到对应的楼层配置或背景图，不显示背景
          console.warn("未找到所选节点的楼层配置或背景图:", info.node.key);
          setCurrentBuildingMap(null);
          setCurrentFloor(null);
        }
      } else {
        console.warn("未找到对应的楼宇地图配置:", parentBuilding.key);
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

    // 确保容器尺寸有效
    if (containerWidth <= 0 || containerHeight <= 0) {
      console.warn("容器尺寸无效，跳过图片尺寸计算");
      return;
    }

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

    // 使用 requestAnimationFrame 确保在下一帧更新状态
    requestAnimationFrame(() => {
      setImageSize({
        width: displayWidth,
        height: displayHeight,
        offsetX,
        offsetY,
        naturalWidth,
        naturalHeight,
      });

      setChartSize({ width: containerWidth, height: containerHeight });
    });
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

  // 获取指定空间下的传感器数据
  const getSensorDataForSpace = async (
    spaceNode: PermissionNode
  ): Promise<any> => {
    // 如果传感器请求开关关闭，直接返回 null
    if (!enableSensorRequest) {
      return null;
    }

    if (!spaceNode.children) return null;

    // 查找该空间下的所有终端节点（ZD 节点）
    const terminals: PermissionNode[] = [];

    function collectTerminals(node: PermissionNode) {
      if (!node.children) return;

      node.children.forEach((child) => {
        if (child.key.includes("ZD")) {
          // 这是终端节点，直接添加
          terminals.push(child);
        } else {
          // 继续递归查找
          collectTerminals(child);
        }
      });
    }

    collectTerminals(spaceNode);

    if (terminals.length === 0) return null;

    // 聚合所有终端的传感器数据
    const allSensorData: Record<string, any> = {};

    try {
      // 并行获取所有终端的传感器数据
      const terminalPromises = terminals.map(async (terminal) => {
        const terminalId = terminal.key.replace("building-", "");
        console.log("通过终端获取传感器数据", terminalId, terminal.title);

        try {
          const terminalSensorData = await getSensorDetail(terminalId);

          if (
            terminalSensorData?.property &&
            terminalSensorData.property.length > 0
          ) {
            return terminalSensorData.property.map((prop: any) => ({
              sensorKey: `building-${prop.property_id}`,
              sensorTitle: prop.field || `传感器-${prop.property_id}`,
              terminalTitle: terminal.title,
              terminalKey: terminal.key,
              data: {
                property: [prop],
              },
            }));
          } else {
            console.log(
              `终端 ${terminal.title} (${terminalId}) 下没有传感器数据`
            );
            return [];
          }
        } catch (error) {
          console.error(
            `获取终端 ${terminal.title} (${terminalId}) 下的传感器数据失败`,
            error
          );
          return [];
        }
      });

      const terminalResults = await Promise.all(terminalPromises);

      // 聚合所有终端的传感器数据
      terminalResults.flat().forEach((result) => {
        if (result.data?.property && result.data.property.length > 0) {
          result.data.property.forEach((prop: any) => {
            const fieldKey = `${result.sensorTitle}`;

            if (prop.values?.length > 0 && prop.times?.length > 0) {
              const latestValue = prop.values[prop.values.length - 1];
              const latestTime = prop.times[prop.times.length - 1];

              allSensorData[fieldKey] = {
                value: latestValue,
                time: latestTime,
                name: prop.name,
                sensorTitle: result.sensorTitle,
                sensorKey: result.sensorKey,
                terminalTitle: result.terminalTitle,
                terminalKey: result.terminalKey,
                field: prop.field,
              };
            } else {
              allSensorData[fieldKey] = {
                value: "--",
                time: null,
                name: prop.name,
                sensorTitle: result.sensorTitle,
                sensorKey: result.sensorKey,
                terminalTitle: result.terminalTitle,
                terminalKey: result.terminalKey,
                field: prop.field,
              };
            }
          });
        }
      });

      console.log("allSensorData", allSensorData);

      return Object.keys(allSensorData).length > 0 ? allSensorData : null;
    } catch (error) {
      console.error("获取传感器数据失败:", error);
      return null;
    }
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

    if (selectedNodeType === "space") {
      // 如果选择的是空间，高亮该空间
      targetSpaceKey = selectedNode.key;
    } else if (
      selectedNodeType === "terminal" ||
      selectedNodeType === "sensor"
    ) {
      // 如果选择的是终端或传感器，高亮其所在的空间
      const parentSpace = findParentSpace(selectedNode.key, permissionData);
      console.log("parentSpace", parentSpace);
      targetSpaceKey = parentSpace?.key || null;
    }

    // 只收集空间数据
    const spaceDataList: any[] = [];

    // 根据building-map.ts配置收集空间数据
    for (const roomConfig of currentBuildingMap.rooms) {
      // 检查请求是否已被取消
      if (signal?.aborted) {
        throw new Error("Request aborted");
      }

      // 只渲染当前楼层的房间
      if (roomConfig.floor !== currentFloor) {
        continue;
      }

      // 查找对应的空间节点
      const spaceNode = findSpaceNodeByKey(roomConfig.key, parentBuilding);

      if (spaceNode) {
        // 收集空间数据，判断是否应该高亮
        const shouldHighlight = targetSpaceKey === spaceNode.key;

        console.log("shouldHighlight", shouldHighlight);
        await addSpaceData(
          roomConfig,
          spaceNode,
          spaceDataList,
          shouldHighlight
        );
      }
    }

    // 只添加空间数据
    seriesData.push(...spaceDataList);

    return seriesData;
  };

  // 查找空间节点
  const findSpaceNodeByKey = (
    spaceKey: string,
    buildingNode: PermissionNode
  ): PermissionNode | null => {
    if (!buildingNode.children) return null;
    return (
      buildingNode.children.find((child) => child.key === spaceKey) || null
    );
  };

  // 添加空间数据
  const addSpaceData = async (
    roomConfig: RoomInfo,
    spaceNode: PermissionNode,
    seriesData: any[],
    shouldHighlight: boolean
  ) => {
    const spaceCoords = convertToContainerCoords(
      roomConfig.x,
      roomConfig.y,
      roomConfig.width,
      roomConfig.height
    );

    // 获取该空间的传感器数据
    const sensorData = await getSensorDataForSpace(spaceNode);

    console.log("selectedNode", selectedNode?.key);
    console.log("spaceNode", spaceNode?.key);

    // 判断在线状态：根据传感器数据的最新时间判断
    let onlineStatus = "offline"; // 默认离线
    let onlineCount = 0;
    let totalSensors = 0;

    if (sensorData && Object.keys(sensorData).length > 0) {
      const currentTime = new Date().getTime();
      const fiveMinutesAgo = currentTime - 10 * 60 * 1000;
      console.log("currentTime", currentTime);
      console.log("fiveMinutesAgo", fiveMinutesAgo);

      for (const field in sensorData) {
        const sensorInfo = sensorData[field];
        totalSensors++;

        console.log(
          "raw sensorInfo.time:",
          sensorInfo.time,
          typeof sensorInfo.time
        );

        if (sensorInfo && sensorInfo.time) {
          // 解析为今天的时间
          const [hours, minutes] = sensorInfo.time.split(":").map(Number);
          const sensorTime = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate(),
            hours,
            minutes
          ).getTime();

          console.log("sensorTime", sensorTime);
          console.log("fiveMinutesAgo", fiveMinutesAgo);

          if (sensorTime > fiveMinutesAgo) {
            console.log(
              "sensorTime > fiveMinutesAgo",
              sensorTime,
              fiveMinutesAgo
            );
            onlineCount++;
          }
        }
      }

      console.log("onlineCount", onlineCount);
      console.log("totalSensors", totalSensors);

      if (onlineCount === totalSensors && totalSensors > 0) {
        onlineStatus = "online";
      } else if (onlineCount > 0) {
        onlineStatus = `partial-${totalSensors - onlineCount}`;
      } else {
        onlineStatus = "offline";
      }
    }

    seriesData.push({
      name: roomConfig.title,
      value: [
        spaceCoords.x + spaceCoords.width / 2,
        spaceCoords.y + spaceCoords.height / 2,
      ],
      type: "space",
      spaceKey: spaceNode.key,
      coords: spaceCoords,
      roomConfig,
      isSelected: shouldHighlight,
      sensorData: sensorData || {}, // 添加传感器数据
      online: onlineStatus, // 详细的在线状态信息
      onlineCount, // 在线传感器数量
      totalSensors, // 总传感器数量
    });
  };

  // ECharts 配置
  const [chartOption, setChartOption] = useState<any>({});
  const [isLoadingData, setIsLoadingData] = useState(false);

  const getOption = async (signal?: AbortSignal) => {
    if (!currentBuildingMap || !selectedNode) {
      return {
        title: {
          text: selectedNode?.title || "请选择楼宇",
          left: "center",
          top: 10,
        },
        xAxis: { type: "value", min: 0, max: 100, show: false },
        yAxis: { type: "value", min: 0, max: 100, show: false },
        series: [],
      };
    }

    const seriesData = await getBuildingData(signal);

    return {
      title: { text: selectedNode.title, left: "center", top: 10 },
      xAxis: {
        type: "value",
        min: 0,
        max: chartSize.width || 100,
        show: false,
      },
      yAxis: {
        type: "value",
        min: 0,
        max: chartSize.height || 100,
        show: false,
      },
      series: [
        {
          type: "custom",
          coordinateSystem: "cartesian2d",
          data: seriesData.map((item) => ({ value: item.value, ...item })),
          renderItem: (params: any, api: any) => {
            const data = seriesData[params.dataIndex] || params.data;
            if (!data || data.type !== "space") return null;

            const startCoord = api.coord([data.coords.x, data.coords.y]);
            const endCoord = api.coord([
              data.coords.x + data.coords.width,
              data.coords.y + data.coords.height,
            ]);
            const width = endCoord[0] - startCoord[0];
            const height = endCoord[1] - startCoord[1];

            // 使用传感器数据
            const sensorData = data.sensorData || {};

            const sensorFields = Object.keys(sensorData);

            const lines = [{ text: `${data.name}`, color: "#333", bold: true }];

            // 计算矩形可容纳的最大行数
            const paddingTop = 4;
            const paddingBottom = 4;
            const lineHeight = 16;
            const maxLines = Math.floor(
              (Math.abs(height) - paddingTop - paddingBottom) / lineHeight
            );

            // 动态添加传感器数据行，但不超过矩形高度
            if (sensorFields.length > 0 && maxLines > 1) {
              // 除了标题行，剩余可显示的行数
              const availableLines = maxLines - 1;
              const displayFields = sensorFields.slice(0, availableLines);

              displayFields.forEach((field) => {
                const sensorInfo = sensorData[field];
                if (sensorInfo && sensorInfo.value !== undefined) {
                  // 从field中提取显示名称
                  const displayName = field
                    .replace(/\(.*?\)/g, "") // 去掉括号内容
                    .replace(/_.*/, "") // 去掉下划线和后面的内容
                    .replace(/传感器|sensor/gi, "") // 去掉“传感器”或“sensor”
                    .trim();

                  const value = sensorInfo.value;

                  lines.push({
                    text: `{name|${displayName}: }{value|${value}}`,
                    color: "#333",
                    bold: false,
                  });
                }
              });
            } else if (sensorFields.length === 0 && maxLines > 1) {
              lines.push({
                text: "暂无传感器数据",
                color: "#999",
                bold: false,
              });
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

              // 构建 text 的基础 style
              const baseStyle: any = {
                text: item.text,
                x: startCoord[0] + width / 2,
                y: textY + lineHeight / 2,
                fontSize,
                textAlign: "center",
                textVerticalAlign: "middle",
                width: width - 4,
                overflow: "truncate",
                ellipsis: "...",
              };

              // 简单判断是否包含 rich 模板语法 {tag|...}
              const hasRich = /\{[^|}]+\|[^}]+\}/.test(item.text);

              if (hasRich) {
                baseStyle.rich = {
                  name: {
                    fill: item.color || "#333",
                    fontWeight: item.bold ? "bold" : "normal",
                    fontSize,
                  },
                  value: { fill: "#000", fontWeight: "bold", fontSize },
                  empty: {
                    fill: item.color || "#999",
                    fontWeight: item.bold ? "bold" : "normal",
                    fontSize,
                  },
                };
                // 注意：当使用 rich 时，不要同时设置 fill
              } else {
                // 普通文本，直接用 fill 生效
                baseStyle.fill = item.color || "#333";
                baseStyle.fontWeight = item.bold ? "bold" : "normal";
              }

              textElements.push({
                type: "text",
                style: baseStyle,
                silent: true,
              });
            });

            return {
              type: "group",
              children: [
                // 矩形背景
                {
                  type: "rect",
                  shape: {
                    x: startCoord[0],
                    y: startCoord[1],
                    width,
                    height,
                    r: 4,
                  },
                  style: {
                    fill: (() => {
                      if (data.isSelected) {
                        return "rgba(24, 144, 255, 0.7)";
                      }
                      // 根据在线状态设置颜色
                      if (data.online === "online") {
                        return "rgba(82, 196, 26, 0.7)"; // 绿色 - 全部在线
                      } else if (
                        data.online &&
                        data.online.startsWith("partial-")
                      ) {
                        return "rgba(250, 173, 20, 0.7)"; // 橙色 - 部分在线
                      } else {
                        return "rgba(245, 34, 45, 0.7)"; // 红色 - 离线
                      }
                    })(),
                    stroke: (() => {
                      if (data.isSelected) {
                        return "#1890ff";
                      }
                      // 根据在线状态设置边框颜色
                      if (data.online === "online") {
                        return "#52c41a"; // 绿色边框
                      } else if (
                        data.online &&
                        data.online.startsWith("partial-")
                      ) {
                        return "#faad14"; // 橙色边框
                      } else {
                        return "#f5222d"; // 红色边框
                      }
                    })(),
                    lineWidth: data.isSelected ? 3 : 1,
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
            let sensorDataHtml = "";

            if (sensorFields.length > 0) {
              // 按传感器分组显示数据
              const sensorGroups: { [sensorTitle: string]: any[] } = {};

              // 将数据按传感器分组
              sensorFields.forEach((field) => {
                const sensorInfo = sensorData[field];
                if (sensorInfo && sensorInfo.sensorTitle) {
                  if (!sensorGroups[sensorInfo.sensorTitle]) {
                    sensorGroups[sensorInfo.sensorTitle] = [];
                  }
                  sensorGroups[sensorInfo.sensorTitle].push({
                    field: sensorInfo.field,
                    name: sensorInfo.name,
                    value: sensorInfo.value,
                    time: sensorInfo.time,
                  });
                }
              });

              // 传入所有 fieldInfo 的数组，聚合成 {设备名: fieldInfo[]}
              function groupByDevice(allSensorFields: any[]) {
                const groups: Record<string, any[]> = {};

                allSensorFields.forEach((fieldInfo) => {
                  const name = fieldInfo.name || "";
                  // 假设 name 格式：能源-断路器-字段(楼宇-房间-编号)
                  const parts = name.split("-");
                  const deviceTitle = parts[1] || "未知设备";

                  if (!groups[deviceTitle]) {
                    groups[deviceTitle] = [];
                  }
                  groups[deviceTitle].push(fieldInfo);
                });

                return groups;
              }

              // 假设 sensorGroups 是一个对象，里面有很多 field 数组
              const allSensorFields = Object.values(sensorGroups).flat();

              // 关键：先合并成以设备名为 key 的对象
              const groupedByDevice = groupByDevice(allSensorFields);

              const sensorGroupsHtml = Object.entries(groupedByDevice)
                .map(([deviceTitle, fields]) => {
                  const fieldsHtml = fields
                    .map((fieldInfo) => {
                      const value =
                        fieldInfo.value !== "--" ? fieldInfo.value : "--";
                      const valueColor =
                        fieldInfo.value !== "--" ? "#fff" : "#fff";

                      // 缩小括号里的单位
                      const fieldWithStyledUnit = fieldInfo.field.replace(
                        /([（(][^）)]*[）)])/g,
                        '<span style="font-size: 8px; color: #999;">$1</span>'
                      );

                      return `
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 1px 0; padding: 1px 4px; background: rgba(255,255,255,0.05); border-radius: 2px; box-sizing: border-box;">
                  <span style="color: #ccc; font-size: 10px; flex: 1;">
                  ${fieldWithStyledUnit}
                  </span>
                  <span style="color: ${valueColor}; font-size: 10px; font-weight: bold; text-align: right;">
                  ${value}
                  </span>
                  </div>
                  `;
                    })
                    .join("");

                  return `
                <div style="margin-bottom: 6px;">
                <div style="color: #1890ff; font-size: 11px; font-weight: 600; margin-bottom: 3px; padding-bottom: 1px; border-bottom: 1px solid rgba(24,144,255,0.3);">
                ${deviceTitle}
                </div>
                <div style="margin-left: 2px;">
                ${fieldsHtml}
                </div>
                </div>
                `;
                })
                .join("");

              // 根据传感器数量和容器宽度动态计算列数
              const sensorCount = Object.keys(sensorGroups).length;
              let columns = 2; // 默认两列

              if (sensorCount <= 2) {
                columns = 1; // 传感器少时单列显示
              } else if (sensorCount >= 6) {
                columns = 3; // 传感器多时三列显示
              }

              sensorDataHtml = `
                <div style="margin-top: 8px; line-height: 1.4; display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 6px;">
                  ${sensorGroupsHtml}
                </div>
              `;
            } else {
              sensorDataHtml =
                '<div style="color: #999; text-align: center; padding: 8px;">暂无传感器数据</div>';
            }

            // 生成状态显示文本和颜色
            let statusText = "";
            let statusColor = "";

            if (data.online === "online") {
              statusText = "在线";
              statusColor = "#52c41a";
            } else if (data.online && data.online.startsWith("partial-")) {
              const offlineCount = data.online.split("-")[1];
              statusText = `部分在线 (${offlineCount}个离线)`;
              statusColor = "#faad14";
            } else {
              statusText = "离线";
              statusColor = "#ff4d4f";
            }

            return `
          <div style="font-size:12px;color:#fff; min-width: 240px; max-width: 400px;">
            <div style="font-size: 14px; font-weight: 700; margin-bottom: 6px; color: #fff;">
              ${data.name}
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">
              <div style="font-size: 11px;">状态: <span style="color:${statusColor}; font-weight: 600;">${statusText}</span></div>
              <div style="font-size: 11px;">传感器: <span style="color:#ccc">${
                data.onlineCount || 0
              }/${data.totalSensors || 0} 在线</span></div>
            </div>
            
            ${sensorDataHtml}
            
            <div style="color:#999;font-size:10px;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.2);text-align:center;">
              更新时间: ${new Date().toLocaleString("zh-CN")}
            </div>
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
      const findAndSelectNode = (
        nodes: PermissionNode[],
        targetKey: string
      ): boolean => {
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
        if (
          currentBuildingMap &&
          currentFloor &&
          floorBackgrounds[currentFloor]
        ) {
          // 重新计算图片尺寸，确保坐标计算的准确性
          const img = new Image();
          img.onload = () => {
            // 使用 setTimeout 确保状态更新完成后再计算尺寸
            setTimeout(() => {
              calculateImageBounds(img.naturalWidth, img.naturalHeight);
            }, 50);
          };
          img.onerror = () => {
            console.error(
              "重新加载楼宇地图背景图片失败:",
              floorBackgrounds[currentFloor]
            );
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
          }, 150);
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
          const echartsInstance = (
            chartRef.current as any
          ).getEchartsInstance();
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
      if (
        chartRef.current &&
        imageSize.width > 0 &&
        imageSize.naturalWidth > 0
      ) {
        // 取消之前的请求
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // 创建新的取消控制器
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsLoadingData(true);
        try {
          const echartsInstance = (
            chartRef.current as any
          ).getEchartsInstance();
          if (echartsInstance) {
            const option = await getOption(signal);

            // 检查请求是否已被取消
            if (!signal.aborted) {
              setChartOption(option);
              echartsInstance.setOption(option);
            }
          }
        } catch (error) {
          if (error instanceof Error && error.message === "Request aborted") {
            // 请求被取消，静默处理，不显示任何提示
          } else {
            console.error("更新图表失败:", error);
          }
        } finally {
          // 只有在请求没有被取消的情况下才设置加载状态为false
          if (!signal.aborted) {
            setIsLoadingData(false);
          }
        }
      }
    };

    // 添加延迟确保图片尺寸计算完成后再更新图表
    const timer = setTimeout(() => {
      updateChart();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [
    selectedNode,
    currentBuildingMap,
    imageSize.width,
    imageSize.height,
    imageSize.naturalWidth,
    imageSize.naturalHeight,
    chartSize.width,
    chartSize.height,
    refreshTicker,
  ]);

  return (
    <div className="space-y-5">
      <div className="flex gap-5">
        {/* 左侧权限树 */}
        <div className="w-[30%] min-h-screen">
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>
                  <FunnelPlotFilled className="mr-1" />
                  选择资产
                </span>
              </div>
            }
            style={{ borderColor: "#f0f0f0", marginBottom: "20px" }}
          >
            {/* 搜索框 */}
            <div className="mb-4">
              <Input
                placeholder="搜索楼层/房间/终端/传感器..."
                prefix={<SearchOutlined />}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
                style={{ width: "100%" }}
              />
            </div>

            <Spin spinning={permissionLoading}>
              {permissionError ? (
                <div className="p-4 text-center">
                  <div className="text-red-500 mb-2">权限数据加载失败</div>
                  <div className="text-gray-500 text-sm mb-3">
                    {permissionError.message?.includes("timeout")
                      ? "网络请求超时，请检查网络连接"
                      : permissionError.message?.includes("Network Error")
                      ? "网络连接失败，请检查网络设置"
                      : "获取权限数据失败，请稍后重试"}
                  </div>
                  <Button
                    onClick={() => window.location.reload()}
                    type="primary"
                  >
                    重新加载
                  </Button>
                </div>
              ) : (
                <Tree
                  treeData={filteredPermissionData}
                  checkedKeys={checkedKeys}
                  expandedKeys={expandedKeys}
                  onCheck={onCheck}
                  onSelect={onSelect}
                  onExpand={(keys) => setExpandedKeys(keys as string[])}
                />
              )}
            </Spin>
          </Card>
        </div>

        {/* 右侧显示 ECharts */}
        <div className="w-[70%]">
          <div className="sticky top-0" style={{ alignSelf: "flex-start" }}>
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span>
                    <PushpinFilled className="mr-1" />
                    资产可视化
                  </span>
                </div>
              }
              style={{
                borderColor: "#f0f0f0",
                marginBottom: "20px",
                maxHeight: "calc(100vh - 40px)",
              }}
              bodyStyle={{
                padding: 0,
                height: "calc(100vh - 120px)",
                overflow: "hidden",
              }}
              extra={
                <CountdownTimer
                  initialCountdown={REFRESH_INTERVAL}
                  onTick={() => setRefreshTicker((r) => r + 1)}
                />
              }
            >
              <div
                ref={chartContainerRef}
                className="relative w-full h-full rounded-md"
                style={{
                  backgroundImage:
                    currentBuildingMap &&
                    currentFloor &&
                    floorBackgrounds[currentFloor]
                      ? `url(${floorBackgrounds[currentFloor]})`
                      : "none",
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              >
                {isLoadingData && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
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
                    renderer: "canvas",
                    width: "auto",
                    height: "auto",
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
