const importFloorPic = (floor: number) => {
  const modules = import.meta.glob("@/assets/*楼.png", {
    eager: true,
    as: "url",
  });
  return modules[`/src/assets/${floor}楼.png`];
};

// 生成楼层背景映射
export const floorBackgrounds: { [floor: number]: string } = Object.fromEntries(
  Array.from({ length: 6 }, (_, i) => {
    const floor = i + 1;
    return [floor, importFloorPic(floor)];
  })
);

export interface TerminalInfo {
  key: string;
  title?: string;
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

/*
格式：
 - 楼宇 > 房间 > 终端
 - 需定义终端，终端查找对应传感器

房间确定楼层背景
*/

export const buildingMaps: BuildingMap[] = [
  {
    key: "building-LY0001",
    title: "交通楼电子电气学院",

    rooms: [
      {
        key: "building-KJ0022",
        title: "电力电子与电机拖动实验室",
        x: 530,
        y: 440,
        width: 440,
        height: 350,
        floor: 1,
        terminals: [
          {
            key: "building-ZD0023",
            title: "91330109059",
          },
        ],
      },
      {
        key: "building-KJ0004",
        title: "电力系统仿真实验室",
        x: 310,
        y: 560,
        width: 300,
        height: 500,
        floor: 2,
        terminals: [
          {
            key: "building-ZD0005",
            title: "91330109050",
          },
        ],
      },
      {
        key: "building-KJ0003",
        title: "电气控制与PLC实验室",
        x: 705,
        y: 560,
        width: 300,
        height: 500,
        floor: 2,
        terminals: [
          {
            key: "building-ZD0004",
            title: "91330109043",
          },
        ],
      },
      {
        key: "building-KJ0010",
        title: "Proteus实验室",
        x: -480,
        y: 550,
        width: 300,
        height: 500,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0011",
            title: "91330109036",
          },
        ],
      },
      {
        key: "building-KJ0007",
        title: "电路实验室",
        x: 700,
        y: -40,
        width: 750,
        height: 320,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0008",
            title: "91330109046",
          },
        ],
      },
      {
        key: "building-KJ0008",
        title: "电子开放实验室",
        x: -60,
        y: -40,
        width: 250,
        height: 320,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0009",
            title: "91330109055",
          },
        ],
      },
      {
        key: "building-KJ0009",
        title: "数字电子实验室",
        x: 760,
        y: 510,
        width: 650,
        height: 520,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0010",
            title: "91330109028",
          },
        ],
      },
      {
        key: "building-KJ0006",
        title: "数模拟电子实验室",
        x: 1590,
        y: -20,
        width: 650,
        height: 320,
        floor: 3,
        terminals: [
          {
            key: "building-ZD0007",
            title: "91330109049",
          },
        ],
      },
      {
        key: "building-KJ0017",
        title: "PCB制作实验室",
        x: -70,
        y: 450,
        width: 250,
        height: 430,
        floor: 4,
        terminals: [
          {
            key: "building-ZD0018",
            title: "91330109062",
          },
        ],
      },
      {
        key: "building-KJ0014",
        title: "多数据融合与现代通信实验室",
        x: 600,
        y: -40,
        width: 650,
        height: 320,
        floor: 4,
        terminals: [
          {
            key: "building-ZD0015",
            title: "91330109020",
          },
        ],
      },
      {
        key: "building-KJ0013",
        title: "电子信息基础实验室",
        x: 1320,
        y: -40,
        width: 580,
        height: 320,
        floor: 4,
        terminals: [
          {
            key: "building-ZD0015",
            title: "91330109020",
          },
        ],
      },
      {
        key: "building-KJ0016",
        title: "无线通信实验室",
        x: 270,
        y: 450,
        width: 250,
        height: 430,
        floor: 4,
        terminals: [
          {
            key: "building-ZD0017",
            title: "91330109021",
          },
        ],
      },
      {
        key: "building-KJ0015",
        title: "数字电视实验室",
        x: 610,
        y: 450,
        width: 250,
        height: 430,
        floor: 4,
        terminals: [
          {
            key: "building-ZD0016",
            title: "91330109038",
          },
        ],
      },
      {
        key: "building-KJ0024",
        title: "运动控制综合实验室",
        x: -480,
        y: 600,
        width: 310,
        height: 460,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0025",
            title: "91330109047",
          },
        ],
      },
      {
        key: "building-KJ0023",
        title: "智能机器人综合实验室",
        x: -80,
        y: 600,
        width: 310,
        height: 460,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0024",
            title: "91330109060",
          },
        ],
      },
      {
        key: "building-KJ0018",
        title: "现代检测技术实验室",
        x: 2420,
        y: 10,
        width: 410,
        height: 260,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0019",
            title: "91330109048",
          },
        ],
      },
      {
        key: "building-KJ0019",
        title: "汽车总线通信实验室",
        x: 2030,
        y: -30,
        width: 330,
        height: 310,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0020",
            title: "91330109032",
          },
        ],
      },
      {
        key: "building-KJ0020",
        title: "汽车故障诊断综合实验室",
        x: 1400,
        y: -30,
        width: 530,
        height: 310,
        floor: 5,
        terminals: [
          {
            key: "building-ZD0021",
            title: "91330109056",
          },
        ],
      },
    ],
  },
];
