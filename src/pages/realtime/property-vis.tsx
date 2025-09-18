import { useEffect, useState, useRef } from "react";
import { Tree, Spin, Button } from "antd";
import ReactECharts from "echarts-for-react";
import { useQuery } from "@tanstack/react-query";
import { permissionList } from "@/request/account";
import type { TreeDataNode } from "antd";
import { buildingMaps } from "@/config/building-map";
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
      // 并发请求（这里可以改成分批请求避免压力太大）
      // const results = await Promise.all(sensorIds.map(id => getSensorDetail(id)));

      // 合并所有字段
      // const allFields = results.flatMap((res: any) => res.property || []);
      // console.log("所有传感器字段:", allFields);

      // setAllSensorFields(allFields);
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

    fetchAllSensorFields(rawData); // ✅ 直接调用
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

  // 获取楼宇下的所有空间数据
  const getBuildingData = () => {
    if (!selectedNode || !currentBuildingMap) {
      return [];
    }

    const seriesData: any[] = [];

    // 找到父楼宇节点
    const parentBuilding = findParentBuilding(selectedNode.key, permissionData);
    if (!parentBuilding || !currentBuildingMap.rooms) {
      return [];
    }

    // 只收集空间数据
    const spaceDataList: any[] = [];

    // 根据building-map.ts配置收集空间数据
    currentBuildingMap.rooms.forEach((roomConfig) => {
      // 查找对应的空间节点
      const spaceNode = findSpaceNodeByKey(roomConfig.key, parentBuilding);

      if (spaceNode) {
        // 收集空间数据
        addSpaceData(roomConfig, spaceNode, spaceDataList);
      }
    });

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

  // ECharts 配置
  const getOption = () => {
    if (!currentBuildingMap || !selectedNode) {
      return {
        title: { text: selectedNode?.title || "请选择楼宇", left: "center", top: 10 },
        xAxis: { type: "value", min: 0, max: 100, show: false },
        yAxis: { type: "value", min: 0, max: 100, show: false },
        series: [],
      };
    }

    const seriesData = getBuildingData();

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

            // 文字行数据，带颜色、粗体和背景色
            const lines = [
              { text: `${data.name}`, color: "#333", bold: true, bgColor: "rgba(255,255,255,0.2)" },
              { text: `温度: 26°C`, color: "#1890ff", bold: false, bgColor: "rgba(255,255,255,0.1)" },
              { text: `气温: 32°C`, color: "#f5222d", bold: false, bgColor: "rgba(255,255,255,0.1)" },
            ];

            const paddingTop = 4;
            const lineHeight = 16;
            const topY = Math.min(startCoord[1], endCoord[1]);
            const fontSize = Math.min(12, lineHeight - 2);

            const textElements: any[] = [];

            lines.forEach((item, idx) => {
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
                style: { fill: item.bgColor },
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
                    fill: data.isSelected ? "rgba(24, 144, 255, 0.2)" : "rgba(24, 144, 255, 0.1)",
                    stroke: data.isSelected ? "#1890ff" : "#40a9ff",
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
            return `
          <div style="font-size:14px;color:#fff;">
            <b>${data.name}</b><br/>
            <div>状态: <b><span style="color:${data.online ? '#52c41a' : '#ff4d4f'}">${data.online ? '在线' : '离线'}</span></b><br/></div>
              <div style="display: flex; flex-wrap: wrap; gap: 2px; margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.2)">
                  <span style="flex: 0 0 25%;">温度: 26℃</span>
                  <span style="flex: 0 0 25%;">气压: 101kPa</span>
                  <span style="flex: 0 0 25%;">湿度: 45%</span>
                  <span style="flex: 0 0 25%;">CO2: 450ppm</span>
                  <span style="flex: 0 0 25%;">PM2.5: 12μg/m³</span>
</div>

            <div style="color:#999;font-size:14px;margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.2)">更新时间: <b>${new Date().toLocaleString("zh-CN")}</b></div>
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

  useEffect(() => {
    if (chartRef.current && imageSize.width > 0) {
      const echartsInstance = (chartRef.current as any).getEchartsInstance();
      if (echartsInstance) {
        echartsInstance.setOption(getOption());
      }
    }
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
