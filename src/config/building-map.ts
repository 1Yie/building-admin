import Floor1Pic from "@/assets/1楼.png";

export interface TerminalInfo {
  key: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface RoomInfo {
  key: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  terminals: TerminalInfo[];
}

export interface BuildingMap {
  key: string;
  title: string;
  background: string;
  rooms: RoomInfo[];
}

export const buildingMaps: BuildingMap[] = [
  {
    key: "building-LY0005",
    title: "交通楼电子电气学院",
    background: Floor1Pic,
    rooms: [
      {
        key: "building-KJ0041",
        title: "新能源技术实验室",
        x: 200,
        y: 150,
        width: 60,
        height: 40,
        terminals: [
          { key: "building-ZD0041", x: 200, y: 150, width: 60, height: 40 },
        ]
      },
    ],
  },
];
