import Floor1Pic from "@/assets/1楼.png";

// 楼层背景图配置
export const floorBackgrounds: { [floor: number]: string } = {
  1: Floor1Pic,
  // 可以添加更多楼层的背景图
  // 2: Floor2Pic,
  // 3: Floor3Pic,
};

export interface TerminalInfo {
  key: string;
  title: string;
}

export interface RoomInfo {
  key: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  terminals: TerminalInfo[];
}

export interface BuildingMap {
  key: string;
  title: string;
  rooms: RoomInfo[];
}

export const buildingMaps: BuildingMap[] = [
  {
    key: "building-LY0001",
    title: "交通楼电子电气学院",
  
    rooms: [
      {
        key: "building-KJ0036",
        title: "双创中心",
        x: -45,
        y: 30,
        width: 200,
        height: 250,
        floor: 1, // 一楼
        terminals: [
          {
            key: "building-ZD0038",
            title: "91330109040",
          },
        ],
      },
      {
        key: "building-KJ0035",
        title: "研究生工作室",
        x: 190,
        y: 660,
        width: 260,
        height: 190,
        floor: 1, // 一楼
        terminals: [
          {
            key: "building-ZD0037",
            title: "91330109027",
          },
        ],
      },
      {
        key: "building-KJ0034",
        title: "研究生工作室",
        x: 1150,
        y: 650,
        width: 200,
        height: 160,
        floor: 1, // 一楼
        terminals: [
          {
            key: "building-ZD0036",
            title: "91330109031",
          },
        ],
      },
      {
        key: "building-KJ0031",
        title: "人工智能创新技术展示室",
        x: 1950,
        y: 350,
        width: 220,
        height: 160,
        floor: 1, // 一楼
        terminals: [
          {
            key: "building-ZD0033",
            title: "91330109035",
          },
        ],
      },
      {
        key: "building-KJ0026",
        title: "网络实验室",
        x: 1420,
        y: 0,
        width: 220,
        height: 260,
        floor: 1, // 一楼
        terminals: [
          {
            key: "building-ZD0027",
            title: "91330109041",
          },
        ],
      },
    ],
  },
];
