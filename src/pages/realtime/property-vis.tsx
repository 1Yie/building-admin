import { useEffect, useState, useRef } from "react";
import { Tree, Spin, Button } from "antd";
import ReactECharts from "echarts-for-react";
import { useQuery } from "@tanstack/react-query";
import { permissionList } from "@/request/account";
import type { TreeDataNode } from "antd";
import { buildingMaps } from "@/config/building-map";
import type {
  BuildingMap,
  RoomInfo,
  TerminalInfo,
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
  const { userInfo, isLoggedIn } = useAuth();
  const [permissionData, setPermissionData] = useState<PermissionNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<PermissionNode | null>(null);
  const [currentBuildingMap, setCurrentBuildingMap] = useState<BuildingMap | null>(null);
  const [expandedTerminals, setExpandedTerminals] = useState<Set<string>>(new Set()); // 改为Set来管理多个展开的终端
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

  // 处理权限数据响应
  useEffect(() => {
    if (permissionDataResponse?.data) {
      const rawData = permissionDataResponse.data;

      // 设置权限数据
      const transformedData = transformTree(rawData);
      setPermissionData(transformedData);

      // 更新勾选的节点
      setCheckedKeys(rawData.check || []);
    }
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
    
    // 如果选择的是传感器，自动展开对应的终端
    if (info.node.key.includes("building-CGQ") || info.node.key.includes("sensor")) {
      // 查找父楼宇
      const parentBuilding = findParentBuilding(info.node.key, permissionData);
      if (parentBuilding) {
        // 查找父终端
        const parentTerminal = findParentTerminal(info.node.key, parentBuilding);
        if (parentTerminal) {
          console.log('🔍 选择传感器，自动展开终端:', {
            sensorKey: info.node.key,
            sensorTitle: info.node.title,
            terminalKey: parentTerminal.key,
            terminalTitle: parentTerminal.title
          });
          
          // 展开对应的终端
          const newExpandedTerminals = new Set(expandedTerminals);
          newExpandedTerminals.add(parentTerminal.key);
          setExpandedTerminals(newExpandedTerminals);
        }
      }
    } else {
      // 如果不是传感器，重置展开状态
      setExpandedTerminals(new Set());
    }

    // 查找父楼宇
    const parentBuilding = findParentBuilding(info.node.key, permissionData);

    if (parentBuilding) {
      // 找到对应的楼宇地图配置
      const buildingMap = buildingMaps.find((map) => map.key === parentBuilding.key);

      if (buildingMap) {
        setCurrentBuildingMap(buildingMap);
        // 预加载背景图片并计算尺寸
        const img = new Image();
        img.onload = () => {
          calculateImageBounds(img.naturalWidth, img.naturalHeight);
        };
        img.onerror = () => {
          console.error('Failed to load building map background:', buildingMap.background);
          setCurrentBuildingMap(null);
        };
        img.src = buildingMap.background;
      } else {
        console.warn('Building map not found for key:', parentBuilding.key);
        setCurrentBuildingMap(null);
      }
    } else {
      setCurrentBuildingMap(null);
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

  // 获取楼宇下的所有空间、终端和传感器数据
  const getBuildingData = () => {
    if (!selectedNode || !currentBuildingMap) {
      console.log('🔍 getBuildingData: 缺少必要数据', { selectedNode, currentBuildingMap });
      return [];
    }

    const seriesData: any[] = [];

    // 找到父楼宇节点
    const parentBuilding = findParentBuilding(selectedNode.key, permissionData);
    if (!parentBuilding || !currentBuildingMap.rooms) {
      console.log('🔍 getBuildingData: 找不到父楼宇或房间配置', {
        parentBuilding,
        rooms: currentBuildingMap.rooms,
        selectedNodeKey: selectedNode.key
      });
      return [];
    }

    console.log('🔍 getBuildingData: 开始处理数据', {
      selectedNode: selectedNode.title,
      parentBuilding: parentBuilding.title,
      roomsCount: currentBuildingMap.rooms.length,
      expandedTerminals: Array.from(expandedTerminals)
    });

    // 先收集所有空间和终端数据，然后按渲染层级顺序添加
    const spaceDataList: any[] = [];
    const terminalDataList: any[] = [];
    const sensorDataList: any[] = [];

    // 根据building-map.ts配置收集空间和终端数据
    currentBuildingMap.rooms.forEach((roomConfig) => {
      // 查找对应的空间节点
      const spaceNode = findSpaceNodeByKey(roomConfig.key, parentBuilding);

      console.log('🔍 处理房间:', {
        roomKey: roomConfig.key,
        roomTitle: roomConfig.title,
        spaceNode: spaceNode ? spaceNode.title : '未找到',
        terminalsCount: roomConfig.terminals.length
      });

      if (spaceNode) {
        // 收集空间数据
        addSpaceData(roomConfig, spaceNode, spaceDataList);

        // 收集终端数据
        roomConfig.terminals.forEach((terminalConfig) => {
          const terminalNode = findTerminalNodeByKey(terminalConfig.key, spaceNode);
          console.log('🔍 处理终端:', {
            terminalKey: terminalConfig.key,
            terminalTitle: terminalConfig.title,
            terminalNode: terminalNode ? terminalNode.title : '未找到',
            isExpanded: terminalNode ? expandedTerminals.has(terminalNode.key) : false,
            sensorsCount: terminalNode?.children?.length || 0
          });

          if (terminalNode) {
            addTerminalData(terminalConfig, terminalNode, roomConfig, terminalDataList);

            // 如果终端展开，收集传感器数据
            if (expandedTerminals.has(terminalNode.key) && terminalNode.children) {
              console.log('🔍 添加传感器数据:', {
                terminalKey: terminalNode.key,
                sensorsCount: terminalNode.children.length
              });
              addSensorData(terminalNode, terminalConfig, sensorDataList);
            }
          }
        });
      }
    });

    // 按渲染层级顺序添加数据：空间 -> 终端 -> 传感器
    // 这样确保终端渲染在空间之上，传感器渲染在最上层
    seriesData.push(...spaceDataList);
    seriesData.push(...terminalDataList);
    seriesData.push(...sensorDataList);

    console.log('🔍 getBuildingData: 最终数据', {
      totalItems: seriesData.length,
      spaces: seriesData.filter(item => item.type === 'space').length,
      terminals: seriesData.filter(item => item.type === 'terminal').length,
      sensors: seriesData.filter(item => item.type === 'sensor').length,
      data: seriesData
    });

    return seriesData;
  };

  // 查找空间节点
  const findSpaceNodeByKey = (spaceKey: string, buildingNode: PermissionNode): PermissionNode | null => {
    if (!buildingNode.children) return null;
    return buildingNode.children.find(child => child.key === spaceKey) || null;
  };

  // 查找终端节点
  const findTerminalNodeByKey = (terminalKey: string, spaceNode: PermissionNode): PermissionNode | null => {
    if (!spaceNode.children) return null;
    return spaceNode.children.find(child => child.key === terminalKey) || null;
  };

  // 添加空间数据
  const addSpaceData = (roomConfig: RoomInfo, spaceNode: PermissionNode, seriesData: any[]) => {
    const spaceCoords = convertToContainerCoords(
      roomConfig.x,
      roomConfig.y,
      roomConfig.width,
      roomConfig.height
    );

    seriesData.push({
      name: roomConfig.title,
      value: [spaceCoords.x + spaceCoords.width / 2, spaceCoords.y + spaceCoords.height / 2],
      type: 'space',
      spaceKey: spaceNode.key,
      coords: spaceCoords,
      roomConfig,
      isSelected: selectedNode?.key === spaceNode.key
    });
  };

  // 添加终端数据
  const addTerminalData = (terminalConfig: TerminalInfo, terminalNode: PermissionNode, roomConfig: RoomInfo, seriesData: any[]) => {
    // 终端坐标相对于空间坐标
    const relativeX = terminalConfig.x - roomConfig.x;
    const relativeY = terminalConfig.y - roomConfig.y;

    const spaceCoords = convertToContainerCoords(roomConfig.x, roomConfig.y, roomConfig.width, roomConfig.height);
    const terminalCoords = convertToContainerCoords(
      roomConfig.x + relativeX,
      roomConfig.y + relativeY,
      terminalConfig.width || 30,
      terminalConfig.height || 20
    );

    seriesData.push({
      name: terminalNode.title,
      value: [terminalCoords.x + terminalCoords.width / 2, terminalCoords.y + terminalCoords.height / 2],
      type: 'terminal',
      terminalKey: terminalNode.key,
      spaceKey: roomConfig.key,
      coords: terminalCoords,
      isExpanded: expandedTerminals.has(terminalNode.key),
      isSelected: selectedNode?.key === terminalNode.key,
      sensorCount: terminalNode.children?.length || 0
    });
  };

  // 添加传感器数据
  const addSensorData = (terminalNode: PermissionNode, terminalConfig: TerminalInfo, seriesData: any[]) => {
    if (!terminalNode.children) return;

    const terminalCoords = convertToContainerCoords(
      terminalConfig.x,
      terminalConfig.y,
      terminalConfig.width || 30,
      terminalConfig.height || 20
    );

    console.log('🔍 addSensorData: 处理传感器', {
      terminalKey: terminalNode.key,
      sensorsCount: terminalNode.children.length,
      terminalCoords
    });

    terminalNode.children.forEach((sensorNode, index) => {
      // 放宽传感器过滤条件，不仅限于CGQ类型
      if (!sensorNode.key.includes("building-CGQ") && !sensorNode.key.includes("sensor")) {
        console.log('🔍 跳过传感器:', sensorNode.key, '不匹配过滤条件');
        return;
      }

      // 在终端矩形下方弹窗区域水平一字型排列传感器点
      const sensorSize = 10;
      const padding = 8;
      const spacing = 12; // 传感器之间的间距，增加到12px
      
      // 弹窗区域：在终端矩形下方创建扩展区域
      const popupHeight = 30; // 弹窗高度
      const popupY = terminalCoords.y + terminalCoords.height + 5; // 在终端下方5px处开始
      
      // 水平排列：所有传感器在弹窗区域内一字排列
      const sensorX = terminalCoords.x + padding + index * (sensorSize + spacing);
      const sensorY = popupY + (popupHeight - sensorSize) / 2; // 在弹窗区域垂直居中

      console.log('🔍 添加传感器:', {
        sensorKey: sensorNode.key,
        sensorTitle: sensorNode.title,
        position: { x: sensorX, y: sensorY },
        index
      });

      seriesData.push({
        name: sensorNode.title,
        value: [sensorX + sensorSize / 2, sensorY + sensorSize / 2],
        type: 'sensor',
        sensorKey: sensorNode.key,
        terminalKey: terminalNode.key,
        coords: { x: sensorX, y: sensorY, width: sensorSize, height: sensorSize },
        isSelected: selectedNode?.key === sensorNode.key
      });
    });
  };

  // 查找父空间节点
  const findParentSpace = (nodeKey: string, buildingNode: PermissionNode): PermissionNode | null => {
    if (!buildingNode.children) return null;

    for (const spaceNode of buildingNode.children) {
      if (spaceNode.key.includes("building-KJ")) {
        if (checkNodeContains(spaceNode, nodeKey)) {
          return spaceNode;
        }
      }
    }
    return null;
  };

  // 查找父终端节点
  const findParentTerminal = (sensorKey: string, buildingNode: PermissionNode): PermissionNode | null => {
    if (!buildingNode.children) return null;

    for (const spaceNode of buildingNode.children) {
      if (spaceNode.children) {
        for (const terminalNode of spaceNode.children) {
          if (terminalNode.key.includes("building-ZD") && checkNodeContains(terminalNode, sensorKey)) {
            return terminalNode;
          }
        }
      }
    }
    return null;
  };

  // 添加空间和终端到系列数据
  const addSpaceAndTerminals = (spaceNode: PermissionNode, seriesData: any[], highlightTerminalKey?: string) => {
    if (!currentBuildingMap) return;

    // 找到对应的房间配置
    const roomInfo = currentBuildingMap.rooms.find(
      (room) => room.key === spaceNode.key
    );

    if (!roomInfo) return;

    const spaceCoords = convertToContainerCoords(
      roomInfo.x,
      roomInfo.y,
      roomInfo.width,
      roomInfo.height
    );

    // 添加空间矩形
    seriesData.push({
      name: spaceNode.title,
      value: [spaceCoords.x, spaceCoords.y],
      type: 'space',
      spaceKey: spaceNode.key,
      coords: spaceCoords,
      roomInfo
    });

    // 遍历空间下的终端
    spaceNode.children?.forEach((terminalNode) => {
      if (!terminalNode.key.includes("building-ZD")) return;

      // 如果指定了特定终端，只显示该终端
      if (highlightTerminalKey && terminalNode.key !== highlightTerminalKey) return;

      // 找到终端在房间中的配置
      const terminalInfo = roomInfo.terminals.find(
        (terminal) => terminal.key === terminalNode.key
      );

      if (!terminalInfo) return;

      const terminalCoords = convertToContainerCoords(
        terminalInfo.x,
        terminalInfo.y,
        terminalInfo.width || 30,
        terminalInfo.height || 20
      );

      // 添加终端矩形
      seriesData.push({
        name: terminalNode.title,
        value: [terminalCoords.x, terminalCoords.y],
        type: 'terminal',
        terminalKey: terminalNode.key,
        spaceKey: spaceNode.key,
        coords: terminalCoords,
        isExpanded: expandedTerminals.has(terminalNode.key),
        sensors: terminalNode.children || []
      });

      // 如果终端展开，添加传感器点
      if (expandedTerminals.has(terminalNode.key) && terminalNode.children) {
        console.log('🔍 添加传感器点:', {
          terminalKey: terminalNode.key,
          isExpanded: expandedTerminals.has(terminalNode.key),
          sensorsCount: terminalNode.children.length
        });

        terminalNode.children.forEach((sensorNode, index) => {
          // 放宽传感器过滤条件，包含更多类型的传感器
          if (!sensorNode.key.includes("building-CGQ") &&
            !sensorNode.key.includes("sensor") &&
            !sensorNode.key.includes("CGQ")) {
            console.log('🔍 跳过传感器:', sensorNode.key, '不匹配过滤条件');
            return;
          }

          // 在终端矩形下方弹窗区域水平一字型排列传感器点
          const sensorSize = 10;
          const padding = 8;
          const spacing = 12; // 传感器之间的间距，增加到12px
          
          // 弹窗区域：在终端矩形下方创建扩展区域
          const popupHeight = 30; // 弹窗高度
          const popupY = terminalCoords.y + terminalCoords.height + 5; // 在终端下方5px处开始
          
          // 水平排列：所有传感器在弹窗区域内一字排列
          const sensorX = terminalCoords.x + padding + index * (sensorSize + spacing);
          const sensorY = popupY + (popupHeight - sensorSize) / 2; // 在弹窗区域垂直居中

          console.log('🔍 添加传感器点:', {
            sensorKey: sensorNode.key,
            sensorTitle: sensorNode.title,
            position: { x: sensorX, y: sensorY },
            index
          });

          seriesData.push({
            name: sensorNode.title,
            value: [sensorX + sensorSize / 2, sensorY + sensorSize / 2],
            type: 'sensor',
            sensorKey: sensorNode.key,
            terminalKey: terminalNode.key,
            coords: { x: sensorX, y: sensorY, width: sensorSize, height: sensorSize },
            isSelected: selectedNode?.key === sensorNode.key
          });
        });
      }
    });
  };

  // ECharts 配置
  const getOption = () => {
    if (!currentBuildingMap || !selectedNode) {
      console.log('🔍 getOption: 缺少必要数据', { currentBuildingMap, selectedNode });
      return {
        title: { text: selectedNode?.title || '请选择楼宇', left: "center", top: 10 },
        xAxis: { type: "value", min: 0, max: 100, show: false },
        yAxis: { type: "value", min: 0, max: 100, show: false },
        series: [],
      };
    }

    const seriesData = getBuildingData();
    console.log('🔍 getOption: 图表配置数据', {
      seriesDataLength: seriesData.length,
      chartSize,
      selectedNode: selectedNode.title
    });

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
      grid: { left: 0, right: 0, top: 30, bottom: 0, containLabel: false },
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (params: any) => {
          const data = params.data;
          if (data.type === 'space') {
            return `空间: ${data.name}<br/>坐标: (${data.coords.x}, ${data.coords.y})<br/>尺寸: ${data.coords.width} × ${data.coords.height}`;
          } else if (data.type === 'terminal') {
            return `终端: ${data.name}<br/>传感器数量: ${data.sensorCount}<br/>点击${data.isExpanded ? '收起' : '展开'}传感器`;
          } else if (data.type === 'sensor') {
            return `传感器: ${data.name}<br/>终端: ${data.terminalKey}<br/>类型: ${data.sensorType || '未知'}`;
          }
          return data.name || "";
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#fff'
        }
      },
      series: [
        {
          type: "custom",
          coordinateSystem: "cartesian2d",
          data: seriesData.map(item => ({
            value: item.value,
            ...item
          })),
          emphasis: {
            focus: 'self',
            itemStyle: {
              borderWidth: 2,
              borderColor: '#1890ff',
              shadowBlur: 10,
              shadowColor: 'rgba(24, 144, 255, 0.3)'
            }
          },
          renderItem: (params: any, api: any) => {
            console.log('🔍 renderItem 被调用:', {
              params: params?.dataIndex,
              data: params?.data,
              hasApi: !!api,
              seriesData: seriesData[params?.dataIndex]
            });

            if (!params || !api) {
              console.warn('🔍 renderItem: 缺少必要参数', { params: !!params, api: !!api });
              return null;
            }

            // 直接从seriesData获取数据，因为params.data可能不完整
            const data = seriesData[params.dataIndex] || params.data;
            console.log('🔍 renderItem: 使用的数据', data);

            if (!data) {
              console.warn('🔍 renderItem: 没有数据');
              return null;
            }

            console.log('🔍 renderItem: 数据类型检查', {
              dataType: data.type,
              isSpace: data.type === 'space',
              isTerminal: data.type === 'terminal',
              isSensor: data.type === 'sensor'
            });

            const coord = api.coord([api.value(0), api.value(1)]);
            console.log('🔍 renderItem: 坐标转换', {
              originalValue: [api.value(0), api.value(1)],
              convertedCoord: coord,
              dataType: data.type
            });

            if (!coord) {
              console.warn('🔍 renderItem: 坐标转换失败');
              return null;
            }

            // 渲染空间矩形
            if (data.type === 'space') {
              console.log('🔍 渲染空间矩形:', data.name, data.coords);

              // 使用ECharts坐标系统
              const startCoord = api.coord([data.coords.x, data.coords.y]);
              const endCoord = api.coord([data.coords.x + data.coords.width, data.coords.y + data.coords.height]);
              const width = endCoord[0] - startCoord[0];
              const height = endCoord[1] - startCoord[1];

              console.log('🔍 空间矩形坐标转换:', {
                原始: data.coords,
                起始坐标: startCoord,
                结束坐标: endCoord,
                转换后尺寸: { width, height }
              });

              return {
                type: "group",
                children: [
                  // 空间矩形背景
                  {
                    zlevel: 0,
                    type: "rect",
                    shape: {
                      x: startCoord[0],
                      y: startCoord[1],
                      width: width,
                      height: height,
                      r: 8,
                    },
                    style: {
                      fill: data.isSelected ? "rgba(24, 144, 255, 0.2)" : "rgba(24, 144, 255, 0.1)",
                      stroke: data.isSelected ? "#1890ff" : "#40a9ff",
                      lineWidth: data.isSelected ? 3 : 2,
                      shadowColor: "rgba(0, 0, 0, 0.1)",
                      shadowBlur: 4,
                      shadowOffsetX: 2,
                      shadowOffsetY: 2,
                    },
                    emphasis: {
                      disabled: true,
                      focus: 'none'
                    },
                    silent: true,
                  },
                  // 空间标题
                  {
                    type: "text",
                    style: {
                      text: data.name,
                      x: startCoord[0] + width / 2,
                      y: startCoord[1] - 15,
                      textAlign: "center",
                      fontSize: 14,
                      fontWeight: "bold",
                      fill: data.isSelected ? "#1890ff" : "#40a9ff",
                    },
                  },
                ],
              };
            }

            // 渲染终端矩形
            else if (data.type === 'terminal') {
              console.log('🔍 渲染终端矩形:', data.name, data.coords);

              // 使用ECharts坐标系统
              const startCoord = api.coord([data.coords.x, data.coords.y]);
              const endCoord = api.coord([data.coords.x + data.coords.width, data.coords.y + data.coords.height]);
              const width = endCoord[0] - startCoord[0];
              const height = endCoord[1] - startCoord[1];

              console.log('🔍 终端矩形坐标转换:', {
                原始: data.coords,
                起始坐标: startCoord,
                结束坐标: endCoord,
                转换后尺寸: { width, height }
              });

              const terminalColor = data.isSelected ? "#ff4d4f" : (data.isExpanded ? "#ff7875" : "#ffa39e");
              const borderColor = data.isSelected ? "#ff4d4f" : "#fff";

              return {
                type: "group",
                children: [
                  // 终端矩形
                  {
                    zlevel: 1,
                    type: "rect",
                    shape: {
                      x: startCoord[0],
                      y: startCoord[1],
                      width: width,
                      height: height,
                      r: 4,
                    },
                    style: {
                      fill: terminalColor,
                      stroke: borderColor,
                      lineWidth: 2,
                      shadowColor: "rgba(0, 0, 0, 0.2)",
                      shadowBlur: 4,
                    },
                  },
                  // 终端标题
                  // {
                  //   type: "text",
                  //   style: {
                  //     text: data.name,
                  //     x: data.coords.x + data.coords.width / 2,
                  //     y: data.coords.y + data.coords.height / 2 - 5,
                  //     textAlign: "center",
                  //     textVerticalAlign: "middle",
                  //     fontSize: 10,
                  //     fontWeight: "bold",
                  //     fill: "#fff",
                  //   },
                  // },
                  // 传感器数量提示
                  // {
                  //   type: "text",
                  //   style: {
                  //     text: `${data.sensorCount}个传感器`,
                  //     x: data.coords.x + data.coords.width / 2,
                  //     y: data.coords.y + data.coords.height / 2 + 5,
                  //     textAlign: "center",
                  //     textVerticalAlign: "middle",
                  //     fontSize: 8,
                  //     fill: "#fff",
                  //   },
                  // },
                  // 展开/收起指示器
                  // {
                  //   type: "text",
                  //   style: {
                  //     text: data.isExpanded ? "▼" : "▶",
                  //     x: data.coords.x + data.coords.width - 8,
                  //     y: data.coords.y + 8,
                  //     fontSize: 8,
                  //     fill: "#fff",
                  //   },
                  // },
                ],
              };
            }

            // 渲染传感器点
            else if (data.type === 'sensor') {
              console.log('🔍 渲染传感器点:', data.name, data.coords);

              // 使用ECharts坐标系统转换传感器坐标
              const sensorCoord = api.coord([data.coords.x + data.coords.width / 2, data.coords.y + data.coords.height / 2]);

              console.log('🔍 传感器坐标转换:', {
                原始: data.coords,
                转换后: sensorCoord
              });

              return {
                type: "group",
                children: [
                  // 传感器圆点
                  {
                    type: "circle",
                    shape: {
                      cx: sensorCoord[0],  // 横向坐标
                      cy: sensorCoord[1],  // 保持纵向坐标
                      r: data.isSelected ? 8 : 6,  // 增大图标
                    },
                    style: {
                      fill: data.isSelected ? "#52c41a" : "#73d13d",
                      stroke: "#fff",
                      lineWidth: 1,
                      shadowColor: "rgba(0, 0, 0, 0.2)",
                      shadowBlur: 2,
                    },
                  },
                  // 选中状态的外圈
                  ...(data.isSelected ? [{
                    type: "circle",
                    shape: {
                      cx: sensorCoord[0],  // 保持一致的横坐标
                      cy: sensorCoord[1],  // 保持一致的纵坐标
                      r: 12,  // 外圈半径大一些
                    },
                    style: {
                      fill: "transparent",
                      stroke: "#52c41a",
                      lineWidth: 2,
                      lineDash: [2, 2],
                    },
                  }] : []),
                ],
              };
            }

            return null;
          },
        },
      ],
    };
  };

  // 处理图表点击事件
  const onChartClick = (params: any) => {
    if (!params.data) return;

    const data = params.data;
    console.log('🔍 图表点击事件:', data);

    // 点击终端矩形，切换展开/收起状态
    if (data.type === 'terminal') {
      const terminalKey = data.terminalKey;
      const newExpandedTerminals = new Set(expandedTerminals);

      console.log('🔍 点击终端:', {
        terminalKey,
        currentlyExpanded: expandedTerminals.has(terminalKey),
        willExpand: !expandedTerminals.has(terminalKey)
      });

      if (expandedTerminals.has(terminalKey)) {
        newExpandedTerminals.delete(terminalKey);
      } else {
        newExpandedTerminals.add(terminalKey);
      }

      setExpandedTerminals(newExpandedTerminals);
      console.log('🔍 更新展开状态:', Array.from(newExpandedTerminals));
    }
    // 点击空间、终端或传感器时，同步选择树节点
    else if (data.spaceKey || data.terminalKey || data.sensorKey) {
      const nodeKey = data.sensorKey || data.terminalKey || data.spaceKey;

      console.log('🔍 选择节点:', nodeKey);

      // 查找并选择对应的树节点
      const findAndSelectNode = (nodes: PermissionNode[], targetKey: string): boolean => {
        for (const node of nodes) {
          if (node.key === targetKey) {
            setSelectedNode(node);
            console.log('🔍 找到并选择节点:', node.title);
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
    const resizeChart = () => {
      if (currentBuildingMap) {
        const img = new Image();
        img.onload = () => {
          calculateImageBounds(img.naturalWidth, img.naturalHeight);
        };
        img.src = currentBuildingMap.background;
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
      window.removeEventListener("resize", resizeChart);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [currentBuildingMap]);

  // 初始化时默认展开一些终端用于测试
  useEffect(() => {
    if (permissionData.length > 0 && expandedTerminals.size === 0) {
      // 查找第一个终端并展开
      const findFirstTerminal = (nodes: PermissionNode[]): string | null => {
        for (const node of nodes) {
          if (node.key.includes("building-ZD")) {
            return node.key;
          }
          if (node.children) {
            const result = findFirstTerminal(node.children);
            if (result) return result;
          }
        }
        return null;
      };

      const firstTerminalKey = findFirstTerminal(permissionData);
      if (firstTerminalKey) {
        console.log('🔍 初始化展开终端:', firstTerminalKey);
        setExpandedTerminals(new Set([firstTerminalKey]));
      }
    }
  }, [permissionData]);
  useEffect(() => {
    if (chartRef.current && imageSize.width > 0) {
      const echartsInstance = (chartRef.current as any).getEchartsInstance();
      if (echartsInstance) {
        echartsInstance.setOption(getOption());
      }
    }
  }, [selectedNode, expandedTerminals, imageSize, currentBuildingMap]);

  return (
    <div className="flex min-h-screen">
      {/* 左侧权限树 */}
      <div className="w-[30%] pr-4 border-r border-gray-300 overflow-y-auto">
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
            backgroundImage: currentBuildingMap
              ? `url(${currentBuildingMap.background})`
              : "none",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <ReactECharts
            ref={chartRef}
            option={getOption()}
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
