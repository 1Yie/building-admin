import { useEffect, useState, useRef } from "react";
import { Tree, Spin } from "antd";
import ReactECharts from "echarts-for-react";
import { useMutation } from "@tanstack/react-query";
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

export default function PropertyVis() {
  const { userInfo, isLoggedIn } = useAuth();
  const [permissionData, setPermissionData] = useState<PermissionNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<PermissionNode | null>(null);
  const [subNodes, setSubNodes] = useState<PermissionNode[]>([]);
  const [currentBuildingMap, setCurrentBuildingMap] =
    useState<BuildingMap | null>(null);
  const [expandedTerminal, setExpandedTerminal] = useState<string | null>(null);
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

  // 获取权限树数据
  const { mutate: getPermissionMutate, isPending: permissionLoading } =
    useMutation({
      mutationFn: permissionList,
      onSuccess: (data) => {
        const rawData = data?.data || [];

        // 转换树形数据结构
        const transformTree = (arr: any[]): PermissionNode[] => {
          return arr.map((item) => ({
            key: item.key,
            title: item.title,
            item: item.item,
            children: Array.isArray(item.children)
              ? transformTree(item.children)
              : [],
          }));
        };

        // 设置权限数据并更新勾选的节点
        setPermissionData(transformTree(rawData));
        setCheckedKeys(data?.data?.check || []);
      },
      onError: (error) => {
        console.error("获取权限失败:", error); // 错误处理
      },
    });

  // 初始化权限数据
  useEffect(() => {
    if (!isLoggedIn || !userInfo?.username) return;

    // 只有在没有数据时才请求
    if (permissionData.length === 0 && !permissionLoading) {
      getPermissionMutate({
        department: "test",
        username: userInfo.username,
      });
    }
  }, [isLoggedIn, userInfo?.username, permissionData, permissionLoading]);

  // 处理勾选事件
  const onCheck = (checkedKeysValue: any) => {
    setCheckedKeys(checkedKeysValue as string[]);
  };

  // 处理选择树节点事件
  const onSelect = (_: React.Key[], info: { node: PermissionNode }) => {
    setSelectedNode(info.node);
    setExpandedTerminal(null); // 重置展开状态

    setCurrentBuildingMap(null);

    // 如果选择的是楼宇节点
    if (info.node.key.includes("building-LY")) {
      const buildingMap = buildingMaps.find((map) => map.key === info.node.key);

      if (buildingMap) {
        setCurrentBuildingMap(buildingMap);

        // 预加载图片以计算尺寸
        const img = new Image();
        img.onload = () => {
          calculateImageBounds(img.naturalWidth, img.naturalHeight);
        };
        img.src = buildingMap.background;

        // 显示楼宇下的所有空间
        setSubNodes(getSubNodes(info.node));
      }
    }
    // 如果选择的是空间节点
    else if (info.node.key.includes("building-KJ")) {
      // 查找父楼宇
      const findParentBuilding = (
        nodes: PermissionNode[]
      ): PermissionNode | null => {
        for (const node of nodes) {
          if (node.children?.some((child) => child.key === info.node.key)) {
            return node;
          }
          const found = findParentBuilding(node.children || []);
          if (found) return found;
        }
        return null;
      };

      const parentBuilding = findParentBuilding(permissionData);
      if (parentBuilding) {
        const buildingMap = buildingMaps.find(
          (map) => map.key === parentBuilding.key
        );
        if (buildingMap) {
          setCurrentBuildingMap(buildingMap);

          const img = new Image();
          img.onload = () => {
            calculateImageBounds(img.naturalWidth, img.naturalHeight);
          };
          img.src = buildingMap.background;
        }
      }

      setSubNodes(getSubNodes(info.node));
    } else {
      setCurrentBuildingMap(null);
      setSubNodes([]);
    }
  };

  // 获取终端和传感器节点
  const getSubNodes = (node: PermissionNode): PermissionNode[] => {
    const nodes: PermissionNode[] = [];

    if (node.key.includes("building-LY") && node.children) {
      // 楼宇节点：返回所有空间
      node.children.forEach((child) => {
        if (child.key.includes("building-KJ")) {
          nodes.push(child);
        }
      });
    } else if (node.key.includes("building-KJ") && node.children) {
      // 空间节点：返回所有终端
      node.children.forEach((child) => {
        if (child.key.includes("building-ZD")) {
          nodes.push(child);
        }
      });
    }

    return nodes;
  };

  // 获取终端下的传感器
  const getTerminalSensors = (terminal: PermissionNode): PermissionNode[] => {
    if (terminal.children) {
      return terminal.children.filter((child) =>
        child.key.includes("building-CGQ")
      );
    }
    return [];
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

  // ECharts 配置
  const getOption = () => {
    if (!currentBuildingMap) {
      return {
        title: { text: selectedNode?.title, left: "center", top: 10 },
        xAxis: { type: "value", min: 0, max: 100, show: false },
        yAxis: { type: "value", min: 0, max: 100, show: false },
        series: [],
      };
    }

    // 只获取终端节点
    const terminals = subNodes.filter((node) =>
      node.key.includes("building-ZD")
    );

    return {
      title: { text: selectedNode?.title, left: "center", top: 10 },
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
      grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (params: any) => {
          if (params.data && params.data.isTerminal) {
            const terminalNode = subNodes.find(
              (t) => t.key === params.data.terminalKey
            );
            if (terminalNode) {
              const sensors = getTerminalSensors(terminalNode);
              if (sensors.length === 0) {
                return `
                  <div style="padding: 12px; max-width: 300px;">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #262626;">${params.data.name}</div>
                    <div style="color: #8c8c8c; text-align: center; padding: 10px;">该终端下暂无传感器</div>
                  </div>
                `;
              }

              let content = `
                <div style="padding: 12px; max-width: 400px; max-height: 300px;">
                  <div style="font-weight: bold; margin-bottom: 8px; color: #262626; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                    ${params.data.name} - 传感器列表 (${sensors.length}个)
                  </div>
                  <div style="max-height: 200px; overflow-y: auto;">
              `;

              sensors.forEach((sensor) => {
                content += `
                  <div style="
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    padding: 6px 8px; 
                    margin-bottom: 4px;
                    background: #f8f9fa; 
                    border-radius: 4px;
                    border-left: 3px solid #52c41a;
                  ">
                    <div style="display: flex; align-items: center;">
                      <div style="
                        width: 6px; 
                        height: 6px; 
                        background: #52c41a; 
                        border-radius: 50%; 
                        margin-right: 8px;
                      "></div>
                      <span style="font-size: 13px; color: #262626;">${sensor.title}</span>
                    </div>
                    <span style="
                      padding: 2px 6px; 
                      font-size: 11px; 
                      background: #f6ffed; 
                      color: #52c41a; 
                      border: 1px solid #b7eb8f;
                      border-radius: 3px;
                    ">在线</span>
                  </div>
                `;
              });

              content += `</div></div>`;
              return content;
            }
          } else if (params.data && params.data.isSpace) {
            const spaceNode = subNodes.find(
              (s) => s.key === params.data.spaceKey
            );
            if (spaceNode && spaceNode.children) {
              const terminals = spaceNode.children.filter((child) =>
                child.key.includes("building-ZD")
              );
              if (terminals.length === 0) {
                return `
                  <div style="padding: 12px; max-width: 300px;">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #262626;">${params.data.name}</div>
                    <div style="color: #8c8c8c; text-align: center; padding: 10px;">该空间下暂无终端</div>
                  </div>
                `;
              }

              let content = `
                <div style="padding: 12px; max-width: 400px; max-height: 300px;">
                  <div style="font-weight: bold; margin-bottom: 8px; color: #262626; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
                    ${params.data.name} - 终端列表 (${terminals.length}个)
                  </div>
                  <div style="max-height: 200px; overflow-y: auto;">
              `;

              terminals.forEach((terminal) => {
                content += `
                  <div style="
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    padding: 6px 8px; 
                    margin-bottom: 4px;
                    background: #f8f9fa; 
                    border-radius: 4px;
                    border-left: 3px solid #ff4d4f;
                  ">
                    <div style="display: flex; align-items: center;">
                      <div style="
                        width: 6px; 
                        height: 6px; 
                        background: #ff4d4f; 
                        border-radius: 50%; 
                        margin-right: 8px;
                      "></div>
                      <span style="font-size: 13px; color: #262626;">${terminal.title}</span>
                    </div>
                    <span style="
                      padding: 2px 6px; 
                      font-size: 11px; 
                      background: #fff2f0; 
                      color: #ff4d4f; 
                      border: 1px solid #ffb3b3;
                      border-radius: 3px;
                    ">在线</span>
                  </div>
                `;
              });

              content += `</div></div>`;
              return content;
            }
          }
          return `${params.data?.name || ""}`;
        },
      },
      series: [
        // 显示空间/终端矩形
        {
          type: "custom",
          coordinateSystem: "cartesian2d",
          data: subNodes
            .map((node) => {
              // 如果是终端节点，查找终端在建筑地图中的位置信息
              if (node.key.includes("building-ZD")) {
                const roomInfo = currentBuildingMap.rooms.find((room) =>
                  room.terminals.some((t) => t.key === node.key)
                );

                if (roomInfo) {
                  const containerCoords = convertToContainerCoords(
                    roomInfo.x,
                    roomInfo.y,
                    roomInfo.width,
                    roomInfo.height
                  );

                  return {
                    name: node.title,
                    value: [
                      containerCoords.x + containerCoords.width / 2,
                      containerCoords.y + containerCoords.height / 2,
                    ],
                    isTerminal: true,
                    terminalKey: node.key,
                    roomInfo: containerCoords,
                  };
                }
              }
              // 如果是空间节点，也查找位置信息
              else if (node.key.includes("building-KJ")) {
                const roomInfo = currentBuildingMap.rooms.find(
                  (room) => room.key === node.key
                );

                if (roomInfo) {
                  const containerCoords = convertToContainerCoords(
                    roomInfo.x,
                    roomInfo.y,
                    roomInfo.width,
                    roomInfo.height
                  );

                  return {
                    name: node.title,
                    value: [
                      containerCoords.x + containerCoords.width / 2,
                      containerCoords.y + containerCoords.height / 2,
                    ],
                    isSpace: true,
                    spaceKey: node.key,
                    roomInfo: containerCoords,
                  };
                }
              }

              return null;
            })
            .filter(Boolean),
          renderItem: (params: any, api: any) => {
            if (!params || !params.data || !api) return null;

            const coord = api.coord([api.value(0), api.value(1)]);
            if (!coord) return null;

            let displayText = "";
            let color = "#ff4d4f"; // 默认红色

            if (params.data.isTerminal) {
              // 终端节点：显示传感器信息
              const terminalNode = subNodes.find(
                (t) => t.key === params.data.terminalKey
              );
              const sensors = terminalNode
                ? getTerminalSensors(terminalNode)
                : [];
              const sensorText = sensors
                .slice(0, 3)
                .map((s) => s.title)
                .join("\n");
              const moreText =
                sensors.length > 3 ? `\n+${sensors.length - 3}更多` : "";
              displayText = sensorText + moreText;
            } else if (params.data.isSpace) {
              // 空间节点：显示终端信息
              const spaceNode = subNodes.find(
                (s) => s.key === params.data.spaceKey
              );
              if (spaceNode && spaceNode.children) {
                const terminals = spaceNode.children.filter((child) =>
                  child.key.includes("building-ZD")
                );
                const terminalText = terminals
                  .slice(0, 3)
                  .map((t) => t.title)
                  .join("\n");
                const moreText =
                  terminals.length > 3 ? `\n+${terminals.length - 3}更多` : "";
                displayText = terminalText + moreText;
                color = "#1890ff"; // 空间用蓝色
              }
            }

            return {
              type: "group",
              children: [
                {
                  type: "rect",
                  shape: {
                    x: coord[0] - params.data.roomInfo.width / 2,
                    y: coord[1] - params.data.roomInfo.height / 2,
                    width: params.data.roomInfo.width,
                    height: params.data.roomInfo.height,
                    r: 5,
                  },
                  style: {
                    fill: color,
                    stroke: "#fff",
                    lineWidth: 2,
                    shadowColor: "rgba(0, 0, 0, 0.3)",
                    shadowBlur: 5,
                    shadowOffsetX: 2,
                    shadowOffsetY: 2,
                  },
                },
                {
                  type: "text",
                  style: {
                    text: params.data.name || "",
                    x: coord[0],
                    y: coord[1] - 10,
                    textAlign: "center",
                    textVerticalAlign: "middle",
                    fontSize: 12,
                    fontWeight: "bold",
                    fill: "#fff",
                  },
                },
                {
                  type: "text",
                  style: {
                    text: displayText,
                    x: coord[0],
                    y: coord[1] + 10,
                    textAlign: "center",
                    textVerticalAlign: "middle",
                    fontSize: 10,
                    fill: "#fff",
                    opacity: 0.9,
                  },
                },
              ],
            };
          },
        },
      ],
    };
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

  // 当 subNodes 或 imageSize 变化时重新渲染图表
  useEffect(() => {
    if (chartRef.current && imageSize.width > 0) {
      const echartsInstance = (chartRef.current as any).getEchartsInstance();
      if (echartsInstance) {
        echartsInstance.setOption(getOption());
      }
    }
  }, [subNodes, imageSize]);

  return (
    <div className="flex min-h-screen">
      {/* 左侧权限树 */}
      <div className="w-[30%] pr-4 border-r border-gray-300 overflow-y-auto">
        <Spin spinning={permissionLoading}>
          <Tree
            className="p-2!"
            treeData={permissionData}
            checkedKeys={checkedKeys}
            onCheck={onCheck}
            onSelect={onSelect}
          />
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
            style={{
              height: "100%",
              width: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              background: "transparent",
            }}
          />
        </div>
      </div>
    </div>
  );
}
